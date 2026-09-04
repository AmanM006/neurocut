import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.editing_env import EditingEnvironment
from backend.optimizer.beam_search import BeamSearchOptimizer
from backend.clickhouse.reward_queries import get_episode_telemetry_series

def test_full_optimization_loop():
    episode_id = "test_opt_eval"
    env = EditingEnvironment(episode_id)
    optimizer = BeamSearchOptimizer(env)

    initial_reward = None
    final_reward = None
    intervention_seen = False

    print(f"=== Starting Optimization Test for Episode: {episode_id} ===")
    for step in optimizer.run_stream(max_steps=3):
        attempt_n = step["attempt_n"]
        reward = step["reward"]
        verdict = step["verdict"]
        worst = step["worst_clip_id"]
        
        if initial_reward is None:
            initial_reward = reward
        final_reward = reward

        print(f"Step {attempt_n}: verdict={verdict}, reward={reward}, worst={worst}")

        if step.get("showrunner_intervention"):
            intervention_seen = True
            interv = step["showrunner_intervention"]
            print("  >>> SHOWRUNNER INTERVENTION OCCURRED!")
            print(f"      Target: {interv['target_clip_id']}")
            print(f"      Generated B-Roll: {interv['broll_clip_id']}")
            print(f"      Reasoning: {interv['reasoning'][:75]}...")

    # Check that B-roll was added to timeline
    clips = env.state.clips
    broll_clips = [c for c in clips if c.is_broll]
    print(f"Total clips on final timeline: {len(clips)}, B-roll clips: {len(broll_clips)}")
    assert len(broll_clips) > 0, "Expected at least one B-roll clip injected"
    assert intervention_seen, "Expected Showrunner intervention to be triggered"

    # Verify telemetry in ClickHouse
    series = get_episode_telemetry_series(episode_id)
    print(f"Telemetry points logged in ClickHouse: {len(series)}")
    assert len(series) > 0

    print(">>> TEST PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_full_optimization_loop()
