import sys
from pathlib import Path

# Add project root
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.config import settings
from backend.editing_env import EditingEnvironment
from backend.scoring.heuristic_scorer import HeuristicScorer
from backend.scoring.qwen_swarm import QwenAudienceSwarm, SWARM_PERSONAS
from backend.clickhouse.client import clickhouse_client
from backend.clickhouse.reward_queries import get_episode_telemetry_series, compare_telemetry_sources

def test_qwen_swarm_pipeline():
    print("=" * 70)
    print("        NEURO-CUT // PHASE 2 QWEN SWARM TEST")
    print("=" * 70)

    episode_id = "test_qwen_eval_p2"
    env = EditingEnvironment(episode_id)

    # 1. Compile physical MP4 first
    compiled_path = env.compile_timeline(env.state)
    print(f"Compiled test cut for swarm: {Path(compiled_path).name}")

    # 2. Run Phase 1 Heuristic Scorer first to establish baseline
    print("\n[Step 1] Running Phase 1 Heuristic Scorer baseline...")
    heuristic_scorer = HeuristicScorer()
    heuristic_points = heuristic_scorer.score_timeline(env.state)
    clickhouse_client.insert_telemetry([p.model_dump() for p in heuristic_points])
    print(f"  * Heuristic points logged: {len(heuristic_points)} (source: 'heuristic')")

    # 3. Run Phase 2 Qwen Audience Swarm at 2 FPS
    print("\n[Step 2] Running Phase 2 Qwen 2.5-VL Audience Swarm (2 FPS)...")
    swarm = QwenAudienceSwarm()
    print(f"  * Active personas: {list(SWARM_PERSONAS.keys())}")
    swarm_points = swarm.score_timeline(env.state, write_to_clickhouse=True)
    print(f"  * Swarm points generated: {len(swarm_points)} (source: 'qwen_swarm')")

    # Verify source tag
    sources = set(p.source for p in swarm_points)
    assert sources == {"qwen_swarm"}, f"Expected all swarm points to be tagged 'qwen_swarm', got {sources}"

    # Verify volume difference (2 FPS produces more points than heuristic sampling)
    print(f"\n[Step 3] Comparing Volume & Density:")
    print(f"  * Heuristic points: {len(heuristic_points)}")
    print(f"  * Swarm points (2 FPS): {len(swarm_points)}")
    assert len(swarm_points) >= len(heuristic_points), "Swarm 2 FPS should have higher/equal temporal density"

    # 4. Verify ClickHouse Cloud Ingestion
    print("\n[Step 4] Querying ClickHouse Cloud for 'qwen_swarm' telemetry:")
    swarm_series = get_episode_telemetry_series(episode_id, source="qwen_swarm")
    print(f"  * Telemetry rows retrieved from ClickHouse Cloud with source='qwen_swarm': {len(swarm_series)}")
    assert len(swarm_series) > 0, "No qwen_swarm rows found in ClickHouse"

    # 5. Side-by-side comparative query
    print("\n[Step 5] Side-by-Side Comparison from ClickHouse:")
    comparison = compare_telemetry_sources(episode_id)
    for row in comparison:
        print(f"  * Source: {row['source']:<12} | Points: {row['count_points']:<4} | Avg Attention: {row['avg_att']:<6} | Avg Arousal: {row['avg_arousal']:<6}")

    print("\n" + "=" * 70)
    print("        PHASE 2 QWEN SWARM PIPELINE VERIFIED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    test_qwen_swarm_pipeline()
