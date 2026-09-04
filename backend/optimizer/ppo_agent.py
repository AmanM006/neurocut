"""
Phase 3 Module: PPO (Proximal Policy Optimization) Reinforcement Learning Policy.
Autonomously optimizes video editing decisions using ClickHouse retention metrics as the reward oracle.

Architecture:
- State Space: 64-dim continuous vector encoding clip durations, takes, trim fractions,
  and ClickHouse SQL window function attention drop-off / bottleneck metrics.
- Action Space: 40 discrete actions (5 action types x 8 clip slots).
  Action types: trim_head, trim_tail, swap_take, ripple_delete, insert_broll.
- Reward Oracle: Retention delta (R_t - R_{t-1}) computed strictly via ClickHouse queries,
  with bonuses for bottleneck elimination.
- Policy Network: Actor-Critic MLP with Generalized Advantage Estimation (GAE)
  and Clipped Surrogate Objective.
- Isolation: Phase 1's BeamSearchOptimizer in `beam_search.py` remains 100% untouched.
"""

import os
import math
import time
import json
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path
import numpy as np
from pydantic import BaseModel

from backend.config import settings
from backend.editing_env import TimelineState, Clip, EditingEnvironment
from backend.scoring.heuristic_scorer import HeuristicScorer
from backend.clickhouse.client import clickhouse_client
from backend.clickhouse.reward_queries import compute_clickhouse_reward, RewardMetrics

# Check PyTorch availability
try:
    import torch
    import torch.nn as nn
    import torch.optim as optim
    from torch.distributions import Categorical
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False
    torch = None

# Action Space Constants
ACTION_TYPES = ["trim_head", "trim_tail", "swap_take", "ripple_delete", "insert_broll"]
MAX_CLIPS = 8
NUM_ACTION_TYPES = len(ACTION_TYPES)
TOTAL_ACTIONS = NUM_ACTION_TYPES * MAX_CLIPS  # 40 discrete actions
STATE_DIM = 64

class ActionSpec(BaseModel):
    action_idx: int
    action_type: str
    target_clip_idx: int
    target_clip_id: Optional[str] = None
    value: float = 0.5

def decode_action(action_idx: int, clips: List[Clip]) -> ActionSpec:
    """Decodes discrete integer action [0..39] to structured action."""
    action_type_idx = action_idx // MAX_CLIPS
    clip_slot_idx = action_idx % MAX_CLIPS
    action_type = ACTION_TYPES[action_type_idx]
    
    target_clip_id = None
    if clip_slot_idx < len(clips):
        target_clip_id = clips[clip_slot_idx].clip_id
        
    val = 0.5
    if action_type == "trim_head":
        val = 0.5
    elif action_type == "trim_tail":
        val = -0.5
    else:
        val = 0.0

    return ActionSpec(
        action_idx=action_idx,
        action_type=action_type,
        target_clip_idx=clip_slot_idx,
        target_clip_id=target_clip_id,
        value=val
    )

def get_action_mask(clips: List[Clip], shot_pool: Dict[str, Any], min_frames: int = 24) -> np.ndarray:
    """Computes a boolean validity mask across 40 discrete actions for the current timeline state."""
    mask = np.zeros(TOTAL_ACTIONS, dtype=bool)
    n_clips = len(clips)
    for act_idx in range(TOTAL_ACTIONS):
        slot = act_idx % MAX_CLIPS
        act_type_idx = act_idx // MAX_CLIPS
        act_type = ACTION_TYPES[act_type_idx]
        if slot >= n_clips:
            continue
        clip = clips[slot]
        if act_type == "trim_head":
            if (clip.end_frame - (clip.start_frame + 12)) >= min_frames:
                mask[act_idx] = True
        elif act_type == "trim_tail":
            if ((clip.end_frame - 12) - clip.start_frame) >= min_frames:
                mask[act_idx] = True
        elif act_type == "swap_take":
            alt_id = "shot_02_dialogue_take2" if clip.clip_id == "shot_02_dialogue_take1" else "shot_02_dialogue_take1"
            if alt_id in shot_pool and alt_id != clip.clip_id:
                mask[act_idx] = True
        elif act_type == "ripple_delete":
            if n_clips > 2:
                mask[act_idx] = True
        elif act_type == "insert_broll":
            if n_clips < MAX_CLIPS:
                mask[act_idx] = True
    if not np.any(mask):
        mask[0] = True
    return mask

class TimelineStateEncoder:
    """
    Encodes physical TimelineState and ClickHouse audience telemetry into a normalized 64-dim vector.
    """
    def __init__(self, max_clips: int = MAX_CLIPS):
        self.max_clips = max_clips

    def encode(self, state: TimelineState, reward_metrics: Optional[RewardMetrics] = None) -> np.ndarray:
        vec = np.zeros(STATE_DIM, dtype=np.float32)
        
        # Build lookup for clip metrics from ClickHouse
        ch_summaries = {}
        worst_clip_id = None
        current_scalar_reward = 0.5
        worst_drop = 0.0
        is_bottleneck_severe = 0.0

        if reward_metrics:
            worst_clip_id = reward_metrics.worst_clip_id
            current_scalar_reward = reward_metrics.scalar_reward
            worst_drop = reward_metrics.worst_drop
            is_bottleneck_severe = 1.0 if reward_metrics.is_bottleneck_severe else 0.0
            for s in reward_metrics.clip_summaries:
                ch_summaries[s["clip_id"]] = s

        # 1. Per-Clip features (7 features * 8 clips = 56 features)
        for i in range(min(len(state.clips), self.max_clips)):
            c = state.clips[i]
            base_idx = i * 7
            
            # Duration normalized by 12.0s
            vec[base_idx + 0] = min(1.0, c.duration_seconds / 12.0)
            # Take number normalized by 3.0
            take_num = 1.0
            if "take2" in c.clip_id:
                take_num = 2.0
            vec[base_idx + 1] = take_num / 3.0
            # Is B-roll flag
            vec[base_idx + 2] = 1.0 if c.is_broll else 0.0
            # Head trim fraction
            vec[base_idx + 3] = float(c.start_frame) / max(1.0, float(c.duration_frames))
            # Tail trim fraction
            vec[base_idx + 4] = float(c.end_frame) / max(1.0, float(c.duration_frames))
            
            # ClickHouse attention & drop metrics
            summary = ch_summaries.get(c.clip_id)
            if summary:
                vec[base_idx + 5] = float(summary.get("avg_attention", 0.6))
                vec[base_idx + 6] = float(summary.get("attention_drop", 0.0))
            else:
                vec[base_idx + 5] = 0.6
                vec[base_idx + 6] = 0.0
                
            if c.clip_id == worst_clip_id:
                vec[base_idx + 6] -= 0.2  # Highlight bottleneck

        # 2. Global Timeline Features (base_idx 56 to 63 = 8 features)
        vec[56] = min(1.0, state.total_duration_seconds / 30.0)
        vec[57] = float(len(state.clips)) / float(self.max_clips)
        vec[58] = float(current_scalar_reward)
        vec[59] = float(worst_drop)
        vec[60] = float(state.attempt_n) / 10.0
        vec[61] = is_bottleneck_severe
        broll_count = sum(1 for c in state.clips if c.is_broll)
        vec[62] = float(broll_count) / 4.0
        vec[63] = 1.0  # Bias/presence indicator

        return vec

if HAS_TORCH:
    class PyTorchActorCritic(nn.Module):
        """PyTorch Actor-Critic Neural Network for PPO."""
        def __init__(self, state_dim: int = STATE_DIM, action_dim: int = TOTAL_ACTIONS):
            super().__init__()
            self.shared = nn.Sequential(
                nn.Linear(state_dim, 128),
                nn.Tanh(),
                nn.Linear(128, 64),
                nn.Tanh()
            )
            self.actor = nn.Linear(64, action_dim)
            self.critic = nn.Linear(64, 1)

        def forward(self, x: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
            feats = self.shared(x)
            logits = self.actor(feats)
            value = self.critic(feats)
            return logits, value

        def get_action_and_value(self, state_tensor: torch.Tensor, action: Optional[torch.Tensor] = None, mask: Optional[np.ndarray] = None, deterministic: bool = False):
            logits, value = self.forward(state_tensor)
            if mask is not None:
                mask_t = torch.tensor(mask, dtype=torch.bool, device=logits.device)
                logits = torch.where(mask_t, logits, torch.tensor(-1e9, device=logits.device))
            dist = Categorical(logits=logits)
            if action is None:
                if deterministic:
                    action = torch.argmax(logits, dim=-1)
                else:
                    action = dist.sample()
            return action, dist.log_prob(action), dist.entropy(), value
else:
    PyTorchActorCritic = None

class VectorizedActorCritic:
    """
    Lightweight CPU Vectorized Actor-Critic using NumPy for zero-crash execution.
    Provides identical policy sampling, value estimation, and softmax exploration.
    """
    def __init__(self, state_dim: int = STATE_DIM, action_dim: int = TOTAL_ACTIONS, seed: int = 42):
        np.random.seed(seed)
        self.state_dim = state_dim
        self.action_dim = action_dim
        # Initialized weights
        self.W_shared = np.random.randn(state_dim, 64) * 0.1
        self.b_shared = np.zeros(64)
        self.W_actor = np.random.randn(64, action_dim) * 0.1
        self.b_actor = np.zeros(action_dim)
        self.W_critic = np.random.randn(64, 1) * 0.1
        self.b_critic = np.zeros(1)

    def forward(self, state: np.ndarray) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        # Support both 1D and 2D batch inputs
        hidden = np.tanh(np.dot(state, self.W_shared) + self.b_shared)
        logits = np.dot(hidden, self.W_actor) + self.b_actor
        values = np.dot(hidden, self.W_critic) + self.b_critic
        return hidden, logits, values

    def sample_action(self, state: np.ndarray, mask: Optional[np.ndarray] = None, temperature: float = 1.0, deterministic: bool = False) -> Tuple[int, float, float]:
        hidden, logits, values = self.forward(state)
        val = float(values.flatten()[0])
        if mask is not None:
            logits = np.where(mask, logits, -1e9)
        if deterministic:
            action_idx = int(np.argmax(logits))
            return action_idx, 0.0, val
        # Softmax with temperature
        exp_logits = np.exp((logits - np.max(logits)) / max(1e-3, temperature))
        if mask is not None:
            exp_logits = np.where(mask, exp_logits, 0.0)
        sum_exp = np.sum(exp_logits)
        if sum_exp <= 0:
            valid_indices = np.where(mask)[0] if mask is not None else np.arange(len(logits))
            action_idx = int(np.random.choice(valid_indices))
            return action_idx, float(-np.log(len(valid_indices))), val
        probs = exp_logits / sum_exp
        action_idx = int(np.random.choice(len(probs), p=probs))
        log_prob = float(np.log(max(1e-8, probs[action_idx])))
        return action_idx, log_prob, val

class PPORolloutBuffer:
    """Stores trajectories for Generalized Advantage Estimation (GAE) updates."""
    def __init__(self):
        self.states = []
        self.actions = []
        self.log_probs = []
        self.rewards = []
        self.values = []
        self.dones = []

    def clear(self):
        self.states.clear()
        self.actions.clear()
        self.log_probs.clear()
        self.rewards.clear()
        self.values.clear()
        self.dones.clear()

    def add(self, state: np.ndarray, action: int, log_prob: float, reward: float, value: float, done: bool):
        self.states.append(state)
        self.actions.append(action)
        self.log_probs.append(log_prob)
        self.rewards.append(reward)
        self.values.append(value)
        self.dones.append(done)

    def compute_returns_and_advantages(self, last_val: float, gamma: float = 0.99, gae_lambda: float = 0.95):
        rewards = np.array(self.rewards)
        values = np.array(self.values + [last_val])
        dones = np.array(self.dones)
        
        advantages = np.zeros_like(rewards)
        last_gae = 0.0
        
        for t in reversed(range(len(rewards))):
            next_non_terminal = 1.0 - (1.0 if dones[t] else 0.0)
            delta = rewards[t] + gamma * values[t + 1] * next_non_terminal - values[t]
            advantages[t] = last_gae = delta + gamma * gae_lambda * next_non_terminal * last_gae
            
        returns = advantages + values[:-1]
        return returns, advantages

class PPOAgent:
    """
    PPO Reinforcement Learning Policy for Neuro-Cut.
    Autonomously optimizes editing actions using ClickHouse retention metrics.
    """
    def __init__(self, episode_id: str, env: Optional[EditingEnvironment] = None):
        self.episode_id = episode_id
        self.env = env or EditingEnvironment(episode_id=episode_id)
        self.encoder = TimelineStateEncoder()
        self.buffer = PPORolloutBuffer()
        self.scorer = HeuristicScorer()
        
        # Policy mode: PyTorch if available, otherwise Vectorized NumPy
        self.has_torch = HAS_TORCH
        if self.has_torch:
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            self.model = PyTorchActorCritic().to(self.device)
            self.optimizer = optim.Adam(self.model.parameters(), lr=settings.PPO_LR)
            print(f"[PPO Agent] Initialized PyTorch Actor-Critic on {self.device}.")
        else:
            self.model = VectorizedActorCritic()
            self.optimizer = None
            print("[PPO Agent] Initialized Vectorized CPU Actor-Critic Policy (NumPy).")

    def select_action(self, state: TimelineState, reward_metrics: Optional[RewardMetrics] = None, deterministic: bool = False) -> Tuple[ActionSpec, float, float]:
        """Encodes state and selects discrete editing action via policy."""
        state_vec = self.encoder.encode(state, reward_metrics)
        mask = get_action_mask(state.clips, self.env.shot_pool, self.env.MIN_CLIP_FRAMES)
        
        if self.has_torch:
            with torch.no_grad():
                st = torch.from_numpy(state_vec).unsqueeze(0).to(self.device)
                act_tensor, logp_tensor, _, val_tensor = self.model.get_action_and_value(st, mask=mask, deterministic=deterministic)
                act_idx = int(act_tensor.item())
                logp = float(logp_tensor.item())
                val = float(val_tensor.item())
        else:
            act_idx, logp, val = self.model.sample_action(state_vec, mask=mask, deterministic=deterministic)

        action_spec = decode_action(act_idx, state.clips)
        return action_spec, logp, val

    def optimize_step(self, compile_video: bool = True, deterministic: bool = False) -> Dict[str, Any]:
        """
        Executes a single PPO policy step:
        1. Encodes state + ClickHouse retention oracle.
        2. Samples action from Actor policy (or argmax if deterministic).
        3. Applies action to physical TimelineState.
        4. Compiles cut (if compile_video=True) and logs new telemetry to ClickHouse.
        5. Computes retention delta reward R_t - R_{t-1}.
        """
        prev_state = self.env.state.clone()
        prev_metrics = compute_clickhouse_reward(self.episode_id, attempt_n=prev_state.attempt_n)
        prev_reward = prev_metrics.scalar_reward

        # 1. Select action from policy
        action_spec, logp, val = self.select_action(prev_state, prev_metrics, deterministic=deterministic)

        # 2. Apply action to environment
        action_type = action_spec.action_type
        target_clip_id = action_spec.target_clip_id
        val_param = action_spec.value
        
        verdict = "rejected"
        applied = False
        new_state = prev_state

        if target_clip_id is not None:
            if action_type == "trim_head":
                frames = int(val_param * 24) or 12
                new_state, applied, msg = self.env.apply_action(prev_state, "trim_head", clip_id=target_clip_id, frames=frames)
            elif action_type == "trim_tail":
                frames = int(abs(val_param) * 24) or 12
                new_state, applied, msg = self.env.apply_action(prev_state, "trim_tail", clip_id=target_clip_id, frames=frames)
            elif action_type == "swap_take":
                alt_id = "shot_02_dialogue_take2" if target_clip_id == "shot_02_dialogue_take1" else "shot_02_dialogue_take1"
                new_state, applied, msg = self.env.apply_action(prev_state, "swap_take", clip_id=target_clip_id, alt_clip_id=alt_id)
            elif action_type == "ripple_delete":
                new_state, applied, msg = self.env.apply_action(prev_state, "ripple_delete", clip_id=target_clip_id)
            elif action_type == "insert_broll":
                from backend.showrunner.tools import generate_broll_clip
                broll_clip = generate_broll_clip(
                    target_scene=target_clip_id,
                    prompt="Dramatic slow-motion cutaway reaction"
                )
                self.env.shot_pool[broll_clip.clip_id] = broll_clip
                new_state, applied, msg = self.env.apply_action(prev_state, "insert_broll", target_clip_id=target_clip_id, broll_clip_id=broll_clip.clip_id)
                verdict = "showrunner_intervened"

        if not applied:
            # Action invalid (e.g. out of bounds slot or minimum duration reached)
            verdict = "rejected"
            step_reward = -0.30
            new_state = prev_state.clone()
            new_state.attempt_n += 1
            new_reward = prev_reward
            new_metrics = prev_metrics
            video_path = getattr(prev_state, "compiled_video_path", "") or ""
        else:
            # 3. Compile updated video cut (optional during fast training)
            video_path = ""
            if compile_video:
                video_path = self.env.compile_timeline(new_state)
            else:
                video_path = getattr(new_state, "compiled_video_path", "") or ""

            # 4. Score and ingest telemetry into ClickHouse Cloud
            telemetry = self.scorer.score_timeline(new_state)
            clickhouse_client.insert_telemetry([p.model_dump() for p in telemetry])

            # 5. Query ClickHouse Cloud for new retention oracle
            new_metrics = compute_clickhouse_reward(self.episode_id, attempt_n=new_state.attempt_n)
            new_reward = new_metrics.scalar_reward

            # 6. Compute Load-Bearing Retention Delta Reward
            # r = (R_t - R_{t-1}) * 10 + bonuses - penalties
            delta_r = (new_reward - prev_reward) * 10.0
            step_reward = delta_r

            if new_reward > prev_reward:
                step_reward += 0.30
                if verdict != "showrunner_intervened":
                    verdict = "improved"
            else:
                step_reward -= 0.20
                verdict = "regressed"

            # Always transition environment state to the applied edit
            self.env.state = new_state

            # Check if worst bottleneck was resolved
            if new_metrics.worst_clip_id != prev_metrics.worst_clip_id and new_reward >= prev_reward:
                step_reward += 0.40  # Bottleneck resolution bonus

        # 7. Record to rollout buffer
        state_vec = self.encoder.encode(prev_state, prev_metrics)
        self.buffer.add(
            state=state_vec,
            action=action_spec.action_idx,
            log_prob=logp,
            reward=float(step_reward),
            value=val,
            done=(new_state.attempt_n >= 10)
        )

        # 8. Log attempt to ClickHouse
        clickhouse_client.insert_edit_attempt(
            episode_id=self.episode_id,
            attempt_n=new_state.attempt_n,
            action=f"ppo_{action_type}",
            target_clip_id=target_clip_id or "",
            reward=float(new_reward),
            verdict=verdict,
            reasoning=f"PPO Policy selected action {action_spec.action_idx} ({action_type}) targeting {target_clip_id}"
        )

        return {
            "episode_id": self.episode_id,
            "attempt_n": new_state.attempt_n,
            "action": action_type,
            "target_clip_id": target_clip_id,
            "action_idx": action_spec.action_idx,
            "reward": new_reward,
            "delta_reward": round(new_reward - prev_reward, 4),
            "step_reward": round(step_reward, 4),
            "verdict": verdict,
            "worst_clip_id": new_metrics.worst_clip_id,
            "worst_drop": new_metrics.worst_drop,
            "mean_attention": new_metrics.mean_attention,
            "video_url": f"/api/video/{Path(video_path).name}" if video_path else "",
            "clips": [c.model_dump() for c in new_state.clips]
        }

    def train_step(self) -> Dict[str, float]:
        """
        Executes a PPO policy gradient update step over collected rollouts.
        Calculates clipped surrogate loss and value function loss.
        """
        if len(self.buffer.rewards) == 0:
            return {"loss": 0.0, "policy_loss": 0.0, "value_loss": 0.0}

        returns, advantages = self.buffer.compute_returns_and_advantages(last_val=0.0)
        # Normalize advantages
        if len(advantages) > 1:
            advantages = (advantages - np.mean(advantages)) / (np.std(advantages) + 1e-8)

        if self.has_torch:
            states_t = torch.tensor(np.array(self.buffer.states), dtype=torch.float32).to(self.device)
            actions_t = torch.tensor(np.array(self.buffer.actions), dtype=torch.int64).to(self.device)
            old_logp_t = torch.tensor(np.array(self.buffer.log_probs), dtype=torch.float32).to(self.device)
            returns_t = torch.tensor(returns, dtype=torch.float32).to(self.device)
            adv_t = torch.tensor(advantages, dtype=torch.float32).to(self.device)

            # PPO Clipped Surrogate Loss
            _, new_logp, entropy, values = self.model.get_action_and_value(states_t, actions_t)
            ratio = torch.exp(new_logp - old_logp_t)
            surr1 = ratio * adv_t
            surr2 = torch.clamp(ratio, 1.0 - settings.PPO_CLIP_EPS, 1.0 + settings.PPO_CLIP_EPS) * adv_t
            policy_loss = -torch.min(surr1, surr2).mean()

            # Value Loss
            value_loss = 0.5 * ((values.squeeze(-1) - returns_t) ** 2).mean()

            # Total Loss
            total_loss = policy_loss + 0.5 * value_loss - settings.PPO_ENTROPY_COEFF * entropy.mean()

            self.optimizer.zero_grad()
            total_loss.backward()
            nn.utils.clip_grad_norm_(self.model.parameters(), 0.5)
            self.optimizer.step()

            metrics = {
                "loss": float(total_loss.item()),
                "policy_loss": float(policy_loss.item()),
                "value_loss": float(value_loss.item())
            }
        else:
            # Vectorized NumPy analytical policy gradient update
            states_arr = np.array(self.buffer.states)
            actions_arr = np.array(self.buffer.actions)
            adv_arr = np.array(advantages)
            ret_arr = np.array(returns)
            
            # Forward pass across rollout states
            hidden, logits, _ = self.model.forward(states_arr)
            exp_logits = np.exp(logits - np.max(logits, axis=-1, keepdims=True))
            probs = exp_logits / np.sum(exp_logits, axis=-1, keepdims=True)
            
            # Policy gradient: grad = probs - 1_at_action, weighted by advantage
            grad_logits = np.copy(probs)
            for i, a in enumerate(actions_arr):
                grad_logits[i, a] -= 1.0
            grad_logits = grad_logits * adv_arr[:, np.newaxis]
            
            # Value loss gradient
            values_arr = np.dot(hidden, self.model.W_critic) + self.model.b_critic
            grad_val = (values_arr - ret_arr[:, np.newaxis])
            
            # Backprop into Actor & Critic
            dW_actor = np.dot(hidden.T, grad_logits) / len(states_arr)
            db_actor = np.mean(grad_logits, axis=0)
            dW_critic = np.dot(hidden.T, grad_val) / len(states_arr)
            db_critic = np.mean(grad_val, axis=0)
            
            # Backprop into Shared representation
            dhidden = np.dot(grad_logits, self.model.W_actor.T) + np.dot(grad_val, self.model.W_critic.T)
            dtanh = (1.0 - hidden ** 2) * dhidden
            dW_shared = np.dot(states_arr.T, dtanh) / len(states_arr)
            db_shared = np.mean(dtanh, axis=0)
            
            # Parameter update
            lr = settings.PPO_LR
            self.model.W_actor -= lr * np.clip(dW_actor, -0.5, 0.5)
            self.model.b_actor -= lr * np.clip(db_actor, -0.5, 0.5)
            self.model.W_critic -= lr * np.clip(dW_critic, -0.5, 0.5)
            self.model.b_critic -= lr * np.clip(db_critic, -0.5, 0.5)
            self.model.W_shared -= lr * np.clip(dW_shared, -0.5, 0.5)
            self.model.b_shared -= lr * np.clip(db_shared, -0.5, 0.5)
            
            loss = float(np.mean(grad_val ** 2))
            mean_adv = float(np.mean(advantages))
            metrics = {
                "loss": round(loss, 4),
                "policy_loss": round(-mean_adv, 4),
                "value_loss": round(loss * 0.5, 4)
            }

        self.buffer.clear()
        return metrics

    def save_checkpoint(self, path: str):
        """Saves model weights to a file checkpoint."""
        p = Path(path)
        p.parent.mkdir(parents=True, exist_ok=True)
        if self.has_torch:
            torch.save({
                "model_state_dict": self.model.state_dict(),
                "optimizer_state_dict": self.optimizer.state_dict() if self.optimizer else None
            }, path)
        else:
            np.savez(
                path,
                W_shared=self.model.W_shared,
                b_shared=self.model.b_shared,
                W_actor=self.model.W_actor,
                b_actor=self.model.b_actor,
                W_critic=self.model.W_critic,
                b_critic=self.model.b_critic
            )

    def load_checkpoint(self, path: str) -> bool:
        """Loads model weights from a file checkpoint."""
        p = Path(path)
        # Try both with and without .npz / .pt extensions
        if not p.exists():
            if Path(f"{path}.npz").exists():
                p = Path(f"{path}.npz")
            elif Path(f"{path}.pt").exists():
                p = Path(f"{path}.pt")
            else:
                return False
        if self.has_torch and str(p).endswith(".pt"):
            checkpoint = torch.load(str(p), map_location=self.device)
            self.model.load_state_dict(checkpoint["model_state_dict"])
            if self.optimizer and checkpoint.get("optimizer_state_dict"):
                self.optimizer.load_state_dict(checkpoint["optimizer_state_dict"])
            return True
        else:
            data = np.load(str(p))
            self.model.W_shared = data["W_shared"]
            self.model.b_shared = data["b_shared"]
            self.model.W_actor = data["W_actor"]
            self.model.b_actor = data["b_actor"]
            self.model.W_critic = data["W_critic"]
            self.model.b_critic = data["b_critic"]
            return True

    def reset_episode(self, episode_id: str) -> float:
        """Resets the environment for a new training or evaluation episode."""
        self.episode_id = episode_id
        self.env = EditingEnvironment(episode_id=episode_id)
        
        # Ingest initial rough cut telemetry
        initial_telemetry = self.scorer.score_timeline(self.env.state)
        clickhouse_client.insert_telemetry([p.model_dump() for p in initial_telemetry])
        
        # Compute baseline reward via ClickHouse
        initial_metrics = compute_clickhouse_reward(episode_id, attempt_n=0)
        self.env.state.last_reward = initial_metrics.scalar_reward
        
        clickhouse_client.insert_edit_attempt(
            episode_id=episode_id,
            attempt_n=0,
            action="initial_rough_cut",
            target_clip_id="",
            reward=float(initial_metrics.scalar_reward),
            verdict="initial",
            reasoning="PPO Training episode starting timeline"
        )
        return float(initial_metrics.scalar_reward)
