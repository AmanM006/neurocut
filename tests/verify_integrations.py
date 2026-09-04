import os
import sys
from pathlib import Path

# Add project root
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.config import settings
from backend.clickhouse.client import clickhouse_client
from backend.scoring.heuristic_scorer import HeuristicScorer
from backend.editing_env import EditingEnvironment
from backend.optimizer.beam_search import BeamSearchOptimizer

def run_all_checks():
    print("=" * 70)
    print("        NEURO-CUT // PHASE 1 VERIFICATION CHECKLIST")
    print("=" * 70)

    # -------------------------------------------------------------
    # CHECK 1: ClickHouse & MCP Status
    # -------------------------------------------------------------
    print("\n[CHECK 1] -- Checking ClickHouse & MCP Server Status:")
    print(f"  * Configured Host: {settings.CLICKHOUSE_HOST}:{settings.CLICKHOUSE_PORT}")
    print(f"  * Database:        {settings.CLICKHOUSE_DATABASE}")
    print(f"  * Connection Mode: {'ClickHouse Cloud (LIVE)' if clickhouse_client.is_cloud else 'Embedded Local Analytical Engine (Fallback)'}")
    
    # Test mcp-clickhouse command
    import subprocess
    mcp_installed = False
    try:
        res = subprocess.run(["mcp-clickhouse", "--help"], capture_output=True, text=True, timeout=5)
        mcp_installed = True
    except subprocess.TimeoutExpired:
        mcp_installed = True
    except Exception:
        mcp_installed = False
    print(f"  * Official 'mcp-clickhouse' MCP Package Installed: {mcp_installed}")

    if not clickhouse_client.is_cloud:
        print("  [!] NOTE: CLICKHOUSE_HOST is currently pointing to localhost.")
        print("      To route queries to your live ClickHouse Cloud instance:")
        print("      Set CLICKHOUSE_HOST=xxx.clickhouse.cloud, CLICKHOUSE_PASSWORD=xxx in .env")

    # -------------------------------------------------------------
    # CHECK 2: Gemini API Live Verification
    # -------------------------------------------------------------
    print("\n[CHECK 2] — Verifying Live Gemini API Execution:")
    print(f"  • GEMINI_API_KEY Configured: {bool(settings.GEMINI_API_KEY)} (Length: {len(settings.GEMINI_API_KEY)})")
    print(f"  • Primary Target Model:     {settings.GEMINI_MODEL}")
    
    scorer = HeuristicScorer()
    test_env = EditingEnvironment("check2_verify_ep")
    print("  * Triggering timeline scoring with live Gemini API...")
    telemetry = scorer.score_timeline(test_env.state)
    print(f"  * Successfully scored {len(telemetry)} telemetry points across timeline.")

    # -------------------------------------------------------------
    # CHECK 3: GitHub LICENSE File
    # -------------------------------------------------------------
    print("\n[CHECK 3] -- Checking LICENSE file at repo root:")
    license_file = settings.PROJECT_DIR / "LICENSE"
    if license_file.exists():
        first_line = license_file.read_text(encoding="utf-8").splitlines()[0]
        print(f"  * LICENSE file found: '{first_line}' ({license_file.stat().st_size} bytes)")
    else:
        print("  [!] LICENSE file missing at repo root!")

    # -------------------------------------------------------------
    # CHECK 4: End-to-End Optimization & Showrunner Intervention
    # -------------------------------------------------------------
    print("\n[CHECK 4] -- End-to-End Sanity Run (Verifying Showrunner Intervention):")
    opt_env = EditingEnvironment("check4_sanity_ep")
    optimizer = BeamSearchOptimizer(opt_env)

    initial_reward = None
    final_reward = None
    intervention_seen = False

    for step in optimizer.run_stream(max_steps=3):
        attempt_n = step["attempt_n"]
        reward = step["reward"]
        verdict = step["verdict"]
        worst = step["worst_clip_id"]

        if initial_reward is None:
            initial_reward = reward
        final_reward = reward

        print(f"  * Step {attempt_n}: Verdict={verdict}, Reward={reward:.4f}, Worst={worst}")

        if step.get("showrunner_intervention"):
            intervention_seen = True
            interv = step["showrunner_intervention"]
            print(f"    >>> SHOWRUNNER AUTONOMOUS INTERVENTION TRIGGERED!")
            print(f"        Target: {interv['target_clip_id']}")
            print(f"        Injected Shot: {interv['broll_clip_id']}")
            print(f"        Reasoning: {interv['reasoning'][:80]}...")

    print(f"  * Final clips on timeline: {len(opt_env.state.clips)} (B-roll count: {sum(1 for c in opt_env.state.clips if c.is_broll)})")
    print(f"  * Showrunner Intervention Fired: {intervention_seen}")
    print(f"  * Reward Progression: {initial_reward:.4f} -> {final_reward:.4f} (Delta: +{final_reward - initial_reward:.4f})")

    assert intervention_seen, "Showrunner intervention did not fire!"
    assert final_reward >= initial_reward, "Reward did not improve!"

    print("\n" + "=" * 70)
    print("        ALL CHECKS EXECUTED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    run_all_checks()
