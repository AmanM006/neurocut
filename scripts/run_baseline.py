import os
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.editing_env import EditingEnvironment
from backend.optimizer.beam_search import BeamSearchOptimizer
from backend.clickhouse.client import clickhouse_client
from backend.clickhouse.reward_queries import compute_clickhouse_reward

def run_baseline(episode_id: str = "beam_search_baseline"):
    print(f"\n======================================================================")
    print(f"      NEURO-CUT // RUNNING PHASE 1 BEAM SEARCH BASELINE")
    print(f"      Episode ID: {episode_id}")
    print(f"======================================================================")

    env = EditingEnvironment(episode_id=episode_id)
    optimizer = BeamSearchOptimizer(env)

    # Initial evaluation
    initial_metrics = compute_clickhouse_reward(episode_id, attempt_n=0)
    initial_reward = initial_metrics.scalar_reward
    print(f"\n[Baseline Initial Rough Cut] Reward: {initial_reward:.4f} | Worst: {initial_metrics.worst_clip_id}")

    final_reward = initial_reward
    best_verdict = "initial"

    for step in optimizer.run_stream(max_steps=4):
        attempt_n = step["attempt_n"]
        reward = step["reward"]
        verdict = step["verdict"]
        action = step.get("action_taken", "unknown")
        worst = step.get("worst_clip_id", "")
        print(f"  Attempt #{attempt_n} | Action: {action:<28} | Verdict: {verdict:<10} | Reward: {reward:.4f} | Worst: {worst}")
        if reward > final_reward:
            final_reward = reward
            best_verdict = verdict

    print(f"\n>>> BEAM SEARCH BASELINE COMPLETE!")
    print(f"    Initial Reward: {initial_reward:.4f}")
    print(f"    Final Baseline Reward: {final_reward:.4f}")
    print(f"    Net Improvement: +{final_reward - initial_reward:.4f}")
    print(f"======================================================================\n")
    return final_reward

if __name__ == "__main__":
    ep = sys.argv[1] if len(sys.argv) > 1 else "beam_search_baseline"
    run_baseline(ep)
