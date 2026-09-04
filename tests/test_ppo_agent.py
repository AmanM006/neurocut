import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.config import settings
from backend.editing_env import EditingEnvironment
from backend.optimizer.ppo_agent import (
    PPOAgent,
    TimelineStateEncoder,
    decode_action,
    STATE_DIM,
    TOTAL_ACTIONS
)
from backend.clickhouse.client import clickhouse_client
from backend.clickhouse.reward_queries import compute_clickhouse_reward

def test_ppo_agent_pipeline():
    print("=" * 70)
    print("        NEURO-CUT // PHASE 3 PPO REINFORCEMENT LEARNING TEST")
    print("=" * 70)

    episode_id = "test_ppo_eval"
    env = EditingEnvironment(episode_id=episode_id)

    # 1. Verify Observation Space Encoder
    print("\n[Step 1] Verifying State Observation Encoder...")
    encoder = TimelineStateEncoder()
    init_metrics = compute_clickhouse_reward(episode_id, attempt_n=0)
    obs_vec = encoder.encode(env.state, init_metrics)
    print(f"  * Observation vector shape: {obs_vec.shape}")
    print(f"  * Sample features (first 8 dims): {obs_vec[:8].round(3)}")
    assert obs_vec.shape == (STATE_DIM,), f"Expected shape ({STATE_DIM},), got {obs_vec.shape}"
    assert not any(math_isnan := [float(x) != float(x) for x in obs_vec]), "Observation contains NaN values!"
    print("  * Observation vector validated successfully!")

    # 2. Verify Discrete Action Space Mapping
    print("\n[Step 2] Verifying Discrete Action Space (40 actions)...")
    for a_idx in [0, 7, 8, 15, 16, 23, 24, 31, 32, 39]:
        spec = decode_action(a_idx, env.state.clips)
        print(f"  * Action {a_idx:02d} -> Type: {spec.action_type:<14} | Clip Slot: {spec.target_clip_idx} | Value: {spec.value}")
    print(f"  * Total discrete actions: {TOTAL_ACTIONS}")

    # 3. Verify PPO Agent Initialization & Policy Sampling
    print("\n[Step 3] Initializing PPO Agent...")
    agent = PPOAgent(episode_id=episode_id, env=env)
    action_spec, logp, val = agent.select_action(env.state, init_metrics)
    print(f"  * Policy selected action {action_spec.action_idx} ({action_spec.action_type})")
    print(f"  * Log probability: {logp:.4f} | State Value estimate V(s): {val:.4f}")
    assert 0 <= action_spec.action_idx < TOTAL_ACTIONS, "Action index out of range!"

    # 4. Execute PPO Optimization Steps against ClickHouse Cloud
    print("\n[Step 4] Executing 3 PPO Optimization Steps against ClickHouse Oracle...")
    for step_i in range(3):
        res = agent.optimize_step()
        print(f"  Step {step_i+1} | Action: {res['action']:<14} | Verdict: {res['verdict']:<12} | Reward: {res['reward']:.4f} | Delta: {res['delta_reward']:+.4f} | Worst: {res['worst_clip_id']}")
        assert res["reward"] > 0, "Reward must be positive"
        assert res["video_url"].startswith("/api/video/"), "Invalid video URL"

    # 5. Verify Rollout Buffer and Policy Update (GAE & Loss)
    print("\n[Step 5] Executing PPO Policy Gradient Training Step...")
    train_metrics = agent.train_step()
    print(f"  * Training metrics: Loss={train_metrics['loss']:.4f} | Policy Loss={train_metrics['policy_loss']:.4f} | Value Loss={train_metrics['value_loss']:.4f}")
    assert "loss" in train_metrics, "Training metrics missing 'loss'"

    # 6. Verify ClickHouse Cloud Ingestion of PPO Attempts
    print("\n[Step 6] Querying ClickHouse Cloud for PPO attempts:")
    attempts = clickhouse_client.query(
        f"SELECT attempt_n, action, reward, verdict FROM {settings.CLICKHOUSE_DATABASE}.edit_attempts WHERE episode_id = %(ep)s ORDER BY attempt_n ASC",
        sqlite_sql="SELECT attempt_n, action, reward, verdict FROM edit_attempts WHERE episode_id = :ep ORDER BY attempt_n ASC",
        params={"ep": episode_id}
    )
    for att in attempts:
        print(f"  * Attempt #{att['attempt_n']} | Action: {att['action']} | Reward: {att['reward']:.4f} | Verdict: {att['verdict']}")
    assert len(attempts) >= 3, "Expected at least 3 attempts in ClickHouse"

    print("\n" + "=" * 70)
    print("        PHASE 3 PPO REINFORCEMENT LEARNING TEST PASSED!")
    print("=" * 70)

if __name__ == "__main__":
    test_ppo_agent_pipeline()
