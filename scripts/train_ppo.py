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

def train_ppo_curriculum(total_episodes: int = 150, steps_per_episode: int = 4, checkpoint_interval: int = 25):
    print("=" * 70)
    print("      NEURO-CUT // PHASE 3 PPO REINFORCEMENT LEARNING TRAINING")
    print(f"      Total Episodes: {total_episodes} | Steps/Ep: {steps_per_episode} | Checkpoint: Every {checkpoint_interval} eps")
    print("=" * 70)

    # Initialize master PPO Agent
    agent = PPOAgent(episode_id="ppo_train_ep_1")
    agent.scorer.gemini_client = None  # Fast deterministic cinematic scoring for RL exploration
    
    best_eval_reward = -999.0
    best_checkpoint_path = str(MODELS_DIR / "ppo_best.npz")
    history = []

    start_time = time.time()

    for ep in range(1, total_episodes + 1):
        ep_id = f"ppo_train_ep_{ep}"
        initial_reward = agent.reset_episode(ep_id)
        
        ep_rewards = [initial_reward]
        ep_deltas = []

        for step in range(steps_per_episode):
            # Fast rollout: skip physical FFmpeg video render during policy exploration
            step_res = agent.optimize_step(compile_video=False, deterministic=False)
            ep_rewards.append(step_res["reward"])
            ep_deltas.append(step_res["delta_reward"])

        # Execute Policy Gradient training update step over rollout trajectory
        train_metrics = agent.train_step()
        final_ep_reward = max(ep_rewards)
        history.append(final_ep_reward)

        # Rolling 20-episode average
        rolling_window = history[-20:]
        rolling_avg = sum(rolling_window) / len(rolling_window)

        if ep % 5 == 0 or ep == 1 or ep == total_episodes:
            elapsed = time.time() - start_time
            print(f"Ep {ep:>3}/{total_episodes} | Final Reward: {final_ep_reward:.4f} | "
                  f"Rolling Avg (20): {rolling_avg:.4f} | Loss: {train_metrics.get('loss', 0):.4f} | "
                  f"Time: {elapsed:.1f}s")

        # Checkpoint discipline
        if ep % checkpoint_interval == 0 or ep == total_episodes:
            ckpt_path = str(MODELS_DIR / f"ppo_checkpoint_ep{ep}.npz")
            agent.save_checkpoint(ckpt_path)
            print(f"  >>> Checkpoint saved: {ckpt_path}")

            # Run deterministic evaluation on fresh held-out attempt
            eval_ep_id = f"ppo_eval_ep{ep}"
            agent.reset_episode(eval_ep_id)
            eval_rewards = []
            for _ in range(steps_per_episode):
                ev = agent.optimize_step(compile_video=False, deterministic=True)
                eval_rewards.append(ev["reward"])
            eval_final = max(eval_rewards) if eval_rewards else 0.0
            print(f"  >>> Checkpoint Ep {ep} Eval Score: {eval_final:.4f} (Previous Best: {best_eval_reward:.4f})")

            if eval_final > best_eval_reward:
                best_eval_reward = eval_final
                agent.save_checkpoint(best_checkpoint_path)
                print(f"  *** NEW BEST MODEL SAVED! Eval: {best_eval_reward:.4f} ***")

    total_time = time.time() - start_time
    print("\n" + "=" * 70)
    print(f"      PPO TRAINING COMPLETED IN {total_time:.1f}s")
    print(f"      Best Eval Reward Achieved: {best_eval_reward:.4f}")
    print("=" * 70)

    # Step 4: Final Frozen-Policy Evaluation on 'ppo_final_eval'
    print("\n[Step 4] Executing Final Frozen Policy Evaluation on 'ppo_final_eval'...")
    eval_agent = PPOAgent(episode_id="ppo_final_eval")
    eval_agent.scorer.gemini_client = None
    loaded = eval_agent.load_checkpoint(best_checkpoint_path)
    print(f"  * Best checkpoint loaded ({best_checkpoint_path}): {loaded}")

    eval_init = eval_agent.reset_episode("ppo_final_eval")
    final_rewards = [eval_init]

    for s in range(steps_per_episode):
        # Compile physical MP4 video on the final evaluated cut
        ev_step = eval_agent.optimize_step(compile_video=(s == steps_per_episode - 1), deterministic=True)
        final_rewards.append(ev_step["reward"])
        print(f"  Eval Step #{s+1} | Action: {ev_step['action']} on {ev_step['target_clip_id']} | "
              f"Reward: {ev_step['reward']:.4f} | Verdict: {ev_step['verdict']}")

    ppo_final_reward = max(final_rewards)
    print(f"\n>>> PPO Final Evaluated Reward: {ppo_final_reward:.4f}")

    # Query ClickHouse Ground Truth Comparison
    print("\n" + "=" * 70)
    print("      CLICKHOUSE CLOUD HEAD-TO-HEAD COMPARISON")
    print("=" * 70)
    query = """
    SELECT episode_id, max(reward) as final_reward 
    FROM default.edit_attempts 
    WHERE episode_id IN ('beam_search_baseline', 'ppo_final_eval')
    GROUP BY episode_id
    ORDER BY final_reward DESC
    """
    rows = clickhouse_client.query(query)
    for r in rows:
        print(f"  * Episode: {r['episode_id']:<22} | Final Reward: {r['final_reward']:.4f}")

    return {
        "best_eval_reward": best_eval_reward,
        "ppo_final_reward": ppo_final_reward,
        "comparison": rows
    }

if __name__ == "__main__":
    eps = int(sys.argv[1]) if len(sys.argv) > 1 else 100
    train_ppo_curriculum(total_episodes=eps, steps_per_episode=4, checkpoint_interval=25)
