import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.optimizer.ppo_agent import PPOAgent
from backend.clickhouse.client import clickhouse_client

def eval_frozen_policy(checkpoint_path: str = "backend/models/ppo_best.npz", steps: int = 4):
    print("=" * 70)
    print("      EVALUATING FROZEN PPO POLICY ON 'ppo_final_eval'")
    print(f"      Checkpoint: {checkpoint_path}")
    print("=" * 70)

    agent = PPOAgent(episode_id="ppo_final_eval")
    agent.scorer.gemini_client = None
    loaded = agent.load_checkpoint(checkpoint_path)
    print(f"Loaded checkpoint: {loaded}")

    init_reward = agent.reset_episode("ppo_final_eval")
    print(f"Initial timeline reward: {init_reward:.4f}")

    rewards = [init_reward]
    for s in range(steps):
        res = agent.optimize_step(compile_video=(s == steps - 1), deterministic=True)
        rewards.append(res["reward"])
        print(f"Step {s+1}: Action={res['action']:<14} Target={str(res['target_clip_id']):<24} Reward={res['reward']:.4f} Verdict={res['verdict']}")

    print(f"\nFinal frozen evaluation reward: {max(rewards):.4f}")

    print("\n" + "=" * 70)
    print("      CLICKHOUSE CLOUD HEAD-TO-HEAD COMPARISON")
    print("=" * 70)
    rows = clickhouse_client.query("""
        SELECT episode_id, max(reward) as final_reward 
        FROM default.edit_attempts 
        WHERE episode_id IN ('beam_search_baseline', 'ppo_final_eval')
        GROUP BY episode_id
        ORDER BY final_reward DESC
    """)
    for r in rows:
        print(f"  * Episode: {r['episode_id']:<24} | Final Reward: {r['final_reward']:.4f}")

if __name__ == "__main__":
    ckpt = sys.argv[1] if len(sys.argv) > 1 else "backend/models/ppo_best.npz"
    eval_frozen_policy(ckpt)
