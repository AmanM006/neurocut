import time
from typing import List, Dict, Any, Optional, Tuple, Generator

from backend.config import settings
from backend.editing_env import EditingEnvironment, TimelineState, Clip
from backend.scoring.heuristic_scorer import HeuristicScorer
from backend.clickhouse.client import clickhouse_client
from backend.clickhouse.reward_queries import compute_clickhouse_reward, RewardMetrics
from backend.showrunner.agent import ShowrunnerAgent

class BeamSearchOptimizer:
    """
    Phase 1 Optimizer:
    Deterministic Beam Search / Hill-Climbing over discrete video editing actions,
    guided by ClickHouse SQL window function rewards and supervised by the Showrunner Agent.
    """

    def __init__(self, env: EditingEnvironment):
        self.env = env
        self.scorer = HeuristicScorer()
        self.showrunner = ShowrunnerAgent()
        self.history: List[Dict[str, Any]] = []
        self.stuck_counter: Dict[str, int] = {}  # counts attempts where clip remained bottleneck

    def evaluate_state(self, state: TimelineState) -> Tuple[TimelineState, RewardMetrics]:
        """Physically compiles video, generates telemetry, writes to ClickHouse, and gets reward."""
        # 1. Compile physical MP4
        compiled_path = self.env.compile_timeline(state)
        state.compiled_video_path = compiled_path

        # 2. Score timeline
        telemetry = self.scorer.score_timeline(state)

        # 3. Insert into ClickHouse
        clickhouse_client.insert_telemetry([t.model_dump() for t in telemetry])

        # 4. Compute reward via ClickHouse SQL window functions
        reward_metrics = compute_clickhouse_reward(state.episode_id, attempt_n=state.attempt_n)
        state.last_reward = reward_metrics.scalar_reward

        return state, reward_metrics

    def step(self) -> Dict[str, Any]:
        """
        Executes a single optimization iteration:
        - Evaluates current state.
        - Checks for Showrunner intervention if a scene is stuck.
        - Otherwise evaluates candidate actions and applies the best move.
        """
        current_state = self.env.state
        state, metrics = self.evaluate_state(current_state)

        attempt_n = state.attempt_n
        worst_clip = metrics.worst_clip_id or (state.clips[0].clip_id if state.clips else "none")

        # Track bottleneck persistence
        self.stuck_counter[worst_clip] = self.stuck_counter.get(worst_clip, 0) + 1

        step_result = {
            "episode_id": state.episode_id,
            "attempt_n": attempt_n,
            "reward": metrics.scalar_reward,
            "mean_attention": metrics.mean_attention,
            "mean_arousal": metrics.mean_arousal,
            "worst_clip_id": worst_clip,
            "worst_drop": metrics.worst_drop,
            "compiled_video": state.compiled_video_path,
            "clips": [c.model_dump() for c in state.clips],
            "action_taken": state.last_action or "initial_state",
            "verdict": "in_progress",
            "showrunner_intervention": None
        }

        # Check for Showrunner Intervention trigger
        if self.stuck_counter.get(worst_clip, 0) >= settings.SHOWRUNNER_STUCK_THRESHOLD:
            # Pacing drop persisted across N attempts! Showrunner intervenes with B-roll!
            new_state, intervention_report = self.showrunner.diagnose_and_intervene(
                env=self.env,
                state=state,
                stuck_clip_id=worst_clip,
                attempt_history=self.history
            )
            # Re-evaluate with newly injected B-roll
            new_state, new_metrics = self.evaluate_state(new_state)
            self.env.state = new_state
            self.stuck_counter[worst_clip] = 0  # reset counter

            clickhouse_client.insert_edit_attempt(
                episode_id=state.episode_id,
                attempt_n=attempt_n + 1,
                action="showrunner_broll_injection",
                target_clip_id=worst_clip,
                reward=new_metrics.scalar_reward,
                verdict="showrunner_intervened",
                reasoning=intervention_report["reasoning"]
            )

            step_result["verdict"] = "showrunner_intervened"
            step_result["showrunner_intervention"] = intervention_report
            step_result["reward"] = new_metrics.scalar_reward
            step_result["compiled_video"] = new_state.compiled_video_path
            step_result["clips"] = [c.model_dump() for c in new_state.clips]
            self.history.append(step_result)
            return step_result

        # Generate discrete candidate actions
        candidates = self._generate_candidate_actions(state, worst_clip)
        best_candidate_state = None
        best_reward = metrics.scalar_reward
        best_action_msg = ""

        for act in candidates:
            cand_state, ok, msg = self.env.apply_action(state, act["type"], **act["params"])
            if not ok:
                continue
            cand_state, cand_metrics = self.evaluate_state(cand_state)
            if cand_metrics.scalar_reward > best_reward:
                best_reward = cand_metrics.scalar_reward
                best_candidate_state = cand_state
                best_action_msg = msg

        if best_candidate_state:
            self.env.state = best_candidate_state
            verdict = "improved"
            reasoning = f"Applied edit: {best_action_msg} (Reward increased to {best_reward})"
        else:
            verdict = "plateau"
            reasoning = f"No discrete trim/swap improved reward over {metrics.scalar_reward}."

        clickhouse_client.insert_edit_attempt(
            episode_id=state.episode_id,
            attempt_n=attempt_n,
            action=state.last_action or "evaluate",
            target_clip_id=worst_clip,
            reward=metrics.scalar_reward,
            verdict=verdict,
            reasoning=reasoning
        )

        step_result["verdict"] = verdict
        step_result["reasoning"] = reasoning
        self.history.append(step_result)
        return step_result

    def _generate_candidate_actions(self, state: TimelineState, target_clip_id: str) -> List[Dict[str, Any]]:
        """Generates candidate actions tailored to address pacing drop in target clip."""
        candidates = []

        # 1. Trim tail of target clip (12 frames = 0.5s or 24 frames = 1.0s)
        candidates.append({"type": "trim_tail", "params": {"clip_id": target_clip_id, "frames": 12}})
        candidates.append({"type": "trim_tail", "params": {"clip_id": target_clip_id, "frames": 24}})

        # 2. Trim head of target clip
        candidates.append({"type": "trim_head", "params": {"clip_id": target_clip_id, "frames": 12}})

        # 3. Swap take if alternate takes exist in pool
        for cid, clip in self.env.shot_pool.items():
            if cid != target_clip_id:
                target_clip = next((c for c in state.clips if c.clip_id == target_clip_id), None)
                if target_clip and clip.scene_id == target_clip.scene_id:
                    candidates.append({"type": "swap_take", "params": {"clip_id": target_clip_id, "alt_clip_id": cid}})

        # 4. Trim other long clips if present
        for c in state.clips:
            if c.clip_id != target_clip_id and c.duration_seconds > 4.0:
                candidates.append({"type": "trim_tail", "params": {"clip_id": c.clip_id, "frames": 12}})

        return candidates

    def run_stream(self, max_steps: int = 5) -> Generator[Dict[str, Any], None, None]:
        """Generator running the full optimization loop, yielding progress events for SSE."""
        for step_idx in range(max_steps):
            result = self.step()
            yield result
            if result.get("verdict") == "showrunner_intervened":
                # Let Showrunner change settle
                pass
            time.sleep(0.3)
