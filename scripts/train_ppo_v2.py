import os
import sys
import time
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.optimizer.ppo_agent import PPOAgent
from backend.clickhouse.client import clickhouse_client
from backend.clickhouse.reward_queries import compute_clickhouse_reward

MODELS_DIR = Path(__file__).resolve().parent.parent / "backend" / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

def train_ppo_v2(total_episodes: int = 2000, steps_per_episode: int = 4, checkpoint_interval: int = 250):
    print("=" * 75)
    print("   NEURO-CUT // PHASE 4 PRIORITY 1: PPO RETRAINING WITH COVERAGE REWARD")
    print(f"   Episodes: {total_episodes} | Steps/Ep: {steps_per_episode} | Checkpoint: Every {checkpoint_interval} eps")
    print("   Reward Objective: reward_v2_coverage (Narrative Coverage and Runtime Penalties Active)")
    print("=" * 75)

    # Initialize master PPO Agent
    agent = PPOAgent(episode_id="ppo_overnight_v2_ep_1")
    agent.scorer.gemini_client = None  # Fast deterministic scoring for RL exploration

    # Load existing checkpoint for fine-tuning
    v1_ckpt = str(MODELS_DIR / "ppo_best.npz")
    best_v2_path = str(MODELS_DIR / "ppo_best_v2.npz")

    if Path(v1_ckpt).exists():
        loaded = agent.load_checkpoint(v1_ckpt)
        print(f"[PPO v2] Warm-started policy weights from existing checkpoint: {v1_ckpt} ({loaded})")
    else:
        print("[PPO v2] Initialized fresh Actor-Critic weights.")

    best_eval_reward = -999.0
    history = []
    start_time = time.time()

    for ep in range(1, total_episodes + 1):
        ep_id = f"ppo_overnight_v2_ep_{ep}"
        initial_reward = agent.reset_episode(ep_id, log_to_clickhouse=(ep % checkpoint_interval == 0))
        
        ep_rewards = [initial_reward]
        ep_deltas = []

        for step in range(steps_per_episode):
            step_res = agent.optimize_step(compile_video=False, deterministic=False)
            ep_rewards.append(step_res["reward"])
            ep_deltas.append(step_res["delta_reward"])

        train_metrics = agent.train_step()
        final_ep_reward = max(ep_rewards)
        history.append(final_ep_reward)

        if ep % 50 == 0 or ep == 1 or ep == total_episodes:
            elapsed = time.time() - start_time
            rolling_window = history[-50:]
            rolling_avg = sum(rolling_window) / len(rolling_window)
            print(f"Ep {ep:>4}/{total_episodes} | Ep Peak: {final_ep_reward:.4f} | "
                  f"Rolling Avg (50): {rolling_avg:.4f} | Loss: {train_metrics.get('loss', 0):.4f} | "
                  f"Time: {elapsed:.1f}s", flush=True)

        if ep % checkpoint_interval == 0 or ep == total_episodes:
            ckpt_path = str(MODELS_DIR / f"ppo_v2_checkpoint_ep{ep}.npz")
            agent.save_checkpoint(ckpt_path)

            eval_ep_id = f"ppo_v2_eval_ep{ep}"
            agent.reset_episode(eval_ep_id, log_to_clickhouse=False)
            eval_rewards = []
            for _ in range(steps_per_episode):
                ev = agent.optimize_step(compile_video=False, deterministic=True)
                eval_rewards.append(ev["reward"])
            eval_final = max(eval_rewards) if eval_rewards else 0.0
            print(f"  >>> Checkpoint Ep {ep} Eval Score: {eval_final:.4f} (Previous Best: {best_eval_reward:.4f})", flush=True)

            if eval_final > best_eval_reward:
                best_eval_reward = eval_final
                agent.save_checkpoint(best_v2_path)
                print(f"  *** NEW BEST V2 MODEL SAVED! Eval: {best_eval_reward:.4f} ***", flush=True)

            agent.buffer.clear()

    total_time = time.time() - start_time
    print("\n" + "=" * 75)
    print(f"   PPO V2 TRAINING COMPLETED IN {total_time:.1f}s ({total_episodes} episodes)")
    print(f"   Best Eval Reward Achieved: {best_eval_reward:.4f}")
    print("=" * 75)

    print("\n[Step] Executing Rigorous Frozen Policy Evaluation on 'ppo_final_eval_v2'...")
    eval_agent = PPOAgent(episode_id="ppo_final_eval_v2")
    eval_agent.scorer.gemini_client = None
    eval_agent.load_checkpoint(best_v2_path)

    eval_init = eval_agent.reset_episode("ppo_final_eval_v2")
    final_states = [eval_agent.env.state.clone()]
    final_rewards = [eval_init]
    step_records = []

    for s in range(steps_per_episode):
        ev_step = eval_agent.optimize_step(compile_video=True, deterministic=True)
        final_rewards.append(ev_step["reward"])
        final_states.append(eval_agent.env.state.clone())
        step_records.append(ev_step)
        print(f"  Eval Step #{s+1} | Action: {ev_step['action']:<14} on {ev_step['target_clip_id']:<24} | "
              f"Reward: {ev_step['reward']:.4f} | Verdict: {ev_step['verdict']}")

    best_idx = max(range(len(final_rewards)), key=lambda i: final_rewards[i])
    best_eval_state = final_states[best_idx]
    best_eval_reward = final_rewards[best_idx]

    best_video_path = eval_agent.env.compile_timeline(best_eval_state)
    best_eval_state.compiled_video_path = best_video_path

    final_m = compute_clickhouse_reward("ppo_final_eval_v2", attempt_n=best_eval_state.attempt_n)
    print(f"\n>>> PPO FINAL EVAL V2 RESULT:")
    print(f"    Episode ID: ppo_final_eval_v2")
    print(f"    Scalar Reward (v2 coverage): {final_m.reward_v2_coverage:.4f}")
    print(f"    Mean Attention (v1 mean):    {final_m.reward_v1_mean:.4f}")
    print(f"    Preserved Shot Count:       {final_m.shot_count} shots")
    print(f"    Preserved Total Duration:   {final_m.duration_seconds:.1f}s")
    print(f"    Coverage Penalty Incurred:  {final_m.coverage_penalty:.4f}")

    clickhouse_client.insert_edit_attempt(
        episode_id="ppo_final_eval_v2",
        attempt_n=best_eval_state.attempt_n,
        action="ppo_v2_best_cut",
        target_clip_id="",
        reward=final_m.reward_v2_coverage,
        verdict="improved",
        reasoning=f"PPO v2 Policy converged on {final_m.shot_count} shots ({final_m.duration_seconds}s) with coverage preservation",
        reward_v1_mean=final_m.reward_v1_mean,
        reward_v2_coverage=final_m.reward_v2_coverage,
        shot_count=final_m.shot_count,
        duration_seconds=final_m.duration_seconds
    )

    print("\n" + "=" * 75)
    print("   CLICKHOUSE CLOUD HEAD-TO-HEAD COMPARISON (ALL PROTOCOLS)")
    print("=" * 75)
    query = """
    SELECT
      episode_id,
      max(reward) as max_r,
      max(reward_v1_mean) as v1_mean,
      max(reward_v2_coverage) as v2_coverage,
      max(shot_count) as shots,
      max(duration_seconds) as duration
    FROM default.edit_attempts
    WHERE episode_id IN ('beam_search_baseline', 'beam_search_baseline_v2', 'ppo_final_eval', 'ppo_final_eval_v2', 'ppo_eval_verified')
    GROUP BY episode_id
    ORDER BY max_r DESC
    """
    rows = clickhouse_client.query(query)
    for r in rows:
        print(f"  * {r['episode_id']:<24} | Reward: {float(r['max_r']):.4f} | "
              f"v1: {float(r['v1_mean']):.4f} | v2: {float(r['v2_coverage']):.4f} | "
              f"{r['shots']} shots | {float(r['duration']):.1f}s")

    return {
        "best_eval_reward": best_eval_reward,
        "metrics": final_m.model_dump(),
        "comparison": rows
    }

if __name__ == "__main__":
    eps = int(sys.argv[1]) if len(sys.argv) > 1 else 300
    ckpt_int = max(25, eps // 10)
    train_ppo_v2(total_episodes=eps, steps_per_episode=4, checkpoint_interval=ckpt_int)
