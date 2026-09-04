import json
import os
import asyncio
import threading
from pathlib import Path
from typing import Dict, Any, Optional, List
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from backend.config import settings
from backend.editing_env import EditingEnvironment, TimelineState, Clip
from backend.optimizer.beam_search import BeamSearchOptimizer
from backend.optimizer.ppo_agent import PPOAgent
from backend.clickhouse.client import clickhouse_client
from backend.clickhouse.reward_queries import (
    compute_clickhouse_reward,
    get_episode_telemetry_series,
    RewardMetrics
)

app = FastAPI(
    title="Neuro-Cut API",
    description="Agentic Cinema Hackathon — Autonomous Video Editing & Retention Optimization Engine",
    version="1.0.0"
)

# CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Active in-memory session registry
active_environments: Dict[str, EditingEnvironment] = {}
active_optimizers: Dict[str, BeamSearchOptimizer] = {}
active_ppo_agents: Dict[str, PPOAgent] = {}
is_training_active: bool = False

class CreateEpisodeRequest(BaseModel):
    episode_id: Optional[str] = None

class ActionRequest(BaseModel):
    action_type: str
    params: Dict[str, Any] = {}

class ForceInterventionRequest(BaseModel):
    target_clip_id: Optional[str] = None
    prompt: Optional[str] = None

@app.get("/api/health")
def get_health():
    return {
        "status": "online",
        "app_name": settings.APP_NAME,
        "env": settings.ENV,
        "clickhouse_mode": "cloud" if clickhouse_client.is_cloud else "embedded_analytics",
        "gemini_active": bool(settings.GEMINI_API_KEY),
        "ffmpeg_path": settings.FFMPEG_PATH,
        "scorer_mode": settings.SCORER_MODE,
        "optimizer_mode": settings.OPTIMIZER_MODE
    }

@app.post("/api/episodes/create")
def create_episode(req: CreateEpisodeRequest):
    episode_id = req.episode_id or f"ep_{os.urandom(4).hex()}"
    env = EditingEnvironment(episode_id=episode_id)
    optimizer = BeamSearchOptimizer(env)
    
    # Initial evaluation
    state, metrics = optimizer.evaluate_state(env.state)
    env.state = state

    active_environments[episode_id] = env
    active_optimizers[episode_id] = optimizer

    return {
        "episode_id": episode_id,
        "status": "ready",
        "attempt_n": state.attempt_n,
        "clips": [c.model_dump() for c in state.clips],
        "reward": metrics.scalar_reward,
        "mean_attention": metrics.mean_attention,
        "worst_clip_id": metrics.worst_clip_id,
        "worst_drop": metrics.worst_drop,
        "video_url": f"/api/episodes/{episode_id}/video?t={os.urandom(2).hex()}"
    }

@app.get("/api/episodes/{episode_id}")
def get_episode(episode_id: str):
    env = active_environments.get(episode_id)
    if not env:
        # Recreate from storage
        env = EditingEnvironment(episode_id=episode_id)
        active_environments[episode_id] = env
        active_optimizers[episode_id] = BeamSearchOptimizer(env)

    metrics = compute_clickhouse_reward(episode_id, attempt_n=env.state.attempt_n)
    return {
        "episode_id": episode_id,
        "attempt_n": env.state.attempt_n,
        "clips": [c.model_dump() for c in env.state.clips],
        "total_duration": env.state.total_duration_seconds,
        "last_action": env.state.last_action,
        "reward": metrics.scalar_reward,
        "mean_attention": metrics.mean_attention,
        "mean_arousal": metrics.mean_arousal,
        "worst_clip_id": metrics.worst_clip_id,
        "worst_drop": metrics.worst_drop,
        "video_url": f"/api/episodes/{episode_id}/video"
    }

@app.post("/api/episodes/{episode_id}/optimize/step")
def run_optimization_step(episode_id: str):
    if episode_id not in active_optimizers:
        env = EditingEnvironment(episode_id=episode_id)
        active_environments[episode_id] = env
        active_optimizers[episode_id] = BeamSearchOptimizer(env)

    optimizer = active_optimizers[episode_id]
    result = optimizer.step()
    result["video_url"] = f"/api/episodes/{episode_id}/video?t={os.urandom(2).hex()}"
    return result

@app.post("/api/episodes/{episode_id}/optimize/ppo-step")
def run_ppo_step(episode_id: str):
    """Executes a single step using the Phase 3 PPO Reinforcement Learning policy."""
    if episode_id not in active_ppo_agents:
        env = active_environments.get(episode_id) or EditingEnvironment(episode_id=episode_id)
        active_environments[episode_id] = env
        active_ppo_agents[episode_id] = PPOAgent(episode_id=episode_id, env=env)

    agent = active_ppo_agents[episode_id]
    result = agent.optimize_step()
    result["video_url"] = f"/api/episodes/{episode_id}/video?t={os.urandom(2).hex()}"
    return result

@app.post("/api/episodes/{episode_id}/ppo/train")
def train_ppo(episode_id: str, steps: int = Query(default=3, ge=1, le=10)):
    """Runs a multi-step PPO rollout against ClickHouse retention metrics and executes a policy gradient update."""
    if episode_id not in active_ppo_agents:
        env = active_environments.get(episode_id) or EditingEnvironment(episode_id=episode_id)
        active_environments[episode_id] = env
        active_ppo_agents[episode_id] = PPOAgent(episode_id=episode_id, env=env)

    agent = active_ppo_agents[episode_id]
    step_history = []
    for _ in range(steps):
        step_res = agent.optimize_step()
        step_history.append(step_res)

    train_metrics = agent.train_step()
    return {
        "episode_id": episode_id,
        "steps_executed": len(step_history),
        "train_metrics": train_metrics,
        "latest_step": step_history[-1] if step_history else None
    }

@app.get("/api/training/progress")
def get_training_progress():
    """
    Returns live training progress for PPO reinforcement learning curve,
    computed directly via ClickHouse window functions.
    """
    try:
        q = """
        SELECT
          episode_num,
          reward,
          avg(reward) OVER (
            ORDER BY episode_num
            ROWS BETWEEN 19 PRECEDING AND CURRENT ROW
          ) AS rolling_avg_reward,
          max(reward) OVER (
            ORDER BY episode_num
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
          ) AS best_so_far
        FROM (
          SELECT
            toUInt32(splitByChar('_', episode_id)[-1]) AS episode_num,
            max(reward) AS reward
          FROM default.edit_attempts
          WHERE episode_id LIKE 'ppo%train_ep_%'
          GROUP BY episode_id
        )
        ORDER BY episode_num ASC
        """
        rows = clickhouse_client.query(q)
        baseline_res = clickhouse_client.query(
            "SELECT max(reward) as r FROM default.edit_attempts WHERE episode_id = 'beam_search_baseline'"
        )
        baseline_reward = float(baseline_res[0]["r"]) if baseline_res and baseline_res[0]["r"] is not None else 0.6730

        eval_res = clickhouse_client.query(
            "SELECT max(reward) as r FROM default.edit_attempts WHERE episode_id = 'ppo_final_eval'"
        )
        eval_reward = float(eval_res[0]["r"]) if eval_res and eval_res[0]["r"] is not None else None

        best_so_far = float(rows[-1]["best_so_far"]) if rows else 0.0
        current_ep = int(rows[-1]["episode_num"]) if rows else 0

        return {
            "status": "training" if is_training_active else "idle",
            "current_episode": current_ep,
            "baseline_reward": baseline_reward,
            "eval_reward": eval_reward,
            "best_so_far": best_so_far,
            "points": [
                {
                    "episode": int(r["episode_num"]),
                    "reward": round(float(r["reward"]), 4),
                    "rolling_avg": round(float(r["rolling_avg_reward"]), 4),
                    "best_so_far": round(float(r["best_so_far"]), 4)
                }
                for r in rows
            ]
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "points": []
        }

@app.post("/api/training/start")
def start_training_job(episodes: int = Query(default=100, ge=10, le=500)):
    """Launches PPO curriculum training in a background daemon thread."""
    global is_training_active
    if is_training_active:
        return {"status": "already_running", "message": "Training is already in progress"}

    def run_job():
        global is_training_active
        is_training_active = True
        try:
            from scripts.train_ppo import train_ppo_curriculum
            train_ppo_curriculum(total_episodes=episodes, steps_per_episode=4, checkpoint_interval=25)
        finally:
            is_training_active = False

    t = threading.Thread(target=run_job, daemon=True)
    t.start()
    return {"status": "started", "episodes": episodes}

@app.get("/api/episodes/{episode_id}/optimize/stream")
async def stream_optimization(
    episode_id: str,
    max_steps: int = Query(default=4, ge=1, le=10),
    optimizer_type: str = Query(default="beam_search")
):
    if episode_id not in active_environments:
        active_environments[episode_id] = EditingEnvironment(episode_id=episode_id)

    env = active_environments[episode_id]
    if episode_id not in active_optimizers:
        active_optimizers[episode_id] = BeamSearchOptimizer(env)
    if episode_id not in active_ppo_agents:
        active_ppo_agents[episode_id] = PPOAgent(episode_id=episode_id, env=env)

    async def event_generator():
        yield f"data: {json.dumps({'event': 'started', 'episode_id': episode_id, 'optimizer': optimizer_type})}\n\n"
        
        if optimizer_type == "ppo":
            ppo_agent = active_ppo_agents[episode_id]
            for step_n in range(max_steps):
                step_data = ppo_agent.optimize_step()
                step_data["video_url"] = f"/api/episodes/{episode_id}/video?t={os.urandom(2).hex()}"
                yield f"data: {json.dumps({'event': 'step', 'data': step_data})}\n\n"
                await asyncio.sleep(0.5)
            # Run policy gradient update after rollout
            metrics = ppo_agent.train_step()
            yield f"data: {json.dumps({'event': 'trained', 'metrics': metrics})}\n\n"
        else:
            # Deterministic Beam Search (Phase 1 Baseline)
            optimizer = active_optimizers[episode_id]
            for step_data in optimizer.run_stream(max_steps=max_steps):
                step_data["video_url"] = f"/api/episodes/{episode_id}/video?t={os.urandom(2).hex()}"
                yield f"data: {json.dumps({'event': 'step', 'data': step_data})}\n\n"
                await asyncio.sleep(0.5)

        yield f"data: {json.dumps({'event': 'completed', 'episode_id': episode_id})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
    )

@app.get("/api/episodes/{episode_id}/telemetry")
def get_telemetry(
    episode_id: str,
    attempt_n: Optional[int] = None,
    source: Optional[str] = Query(default=None)
):
    series = get_episode_telemetry_series(episode_id, attempt_n=attempt_n, source=source)
    metrics = compute_clickhouse_reward(episode_id, attempt_n=attempt_n)
    return {
        "episode_id": episode_id,
        "attempt_n": attempt_n,
        "source": source or "all",
        "points_count": len(series),
        "metrics": metrics.model_dump(),
        "series": series
    }

@app.post("/api/episodes/{episode_id}/swarm/evaluate")
def evaluate_with_qwen_swarm(episode_id: str):
    """
    Phase 2 Endpoint: Evaluates compiled video cut with Qwen 2.5-VL synthetic audience swarm at 2 FPS.
    Ingests fine-grained multi-persona telemetry tagged source: 'qwen_swarm' into ClickHouse Cloud.
    """
    from backend.scoring.qwen_swarm import QwenAudienceSwarm
    env = active_environments.get(episode_id)
    if not env:
        env = EditingEnvironment(episode_id=episode_id)
        active_environments[episode_id] = env
        active_optimizers[episode_id] = BeamSearchOptimizer(env)

    swarm = QwenAudienceSwarm()
    points = swarm.score_timeline(env.state, write_to_clickhouse=True)
    comparison = swarm.get_comparison_metrics(episode_id)

    return {
        "episode_id": episode_id,
        "status": "evaluated",
        "source": "qwen_swarm",
        "sampling_fps": 2.0,
        "points_generated": len(points),
        "personas_simulated": len(swarm.personas),
        "comparison": comparison["comparison"]
    }

@app.get("/api/episodes/{episode_id}/telemetry/compare")
def get_telemetry_comparison(episode_id: str):
    """
    Phase 2 Endpoint: Returns comparison of Heuristic vs Qwen Swarm telemetry in ClickHouse.
    """
    from backend.clickhouse.reward_queries import compare_telemetry_sources
    return {
        "episode_id": episode_id,
        "comparison": compare_telemetry_sources(episode_id)
    }

@app.get("/api/episodes/{episode_id}/decisions")
def get_decisions(episode_id: str):
    # Fetch from ClickHouse edit_attempts and showrunner_decisions
    attempts = clickhouse_client.query(
        f"SELECT * FROM {settings.CLICKHOUSE_DATABASE}.edit_attempts WHERE episode_id = %(episode_id)s ORDER BY attempt_n ASC",
        sqlite_sql="SELECT * FROM edit_attempts WHERE episode_id = :episode_id ORDER BY attempt_n ASC",
        params={"episode_id": episode_id}
    )
    decisions = clickhouse_client.query(
        f"SELECT * FROM {settings.CLICKHOUSE_DATABASE}.showrunner_decisions WHERE episode_id = %(episode_id)s ORDER BY ts ASC",
        sqlite_sql="SELECT * FROM showrunner_decisions WHERE episode_id = :episode_id ORDER BY ts ASC",
        params={"episode_id": episode_id}
    )
    return {
        "episode_id": episode_id,
        "attempts": attempts,
        "showrunner_decisions": decisions
    }

@app.post("/api/episodes/{episode_id}/showrunner/force-intervention")
def force_showrunner_intervention(episode_id: str, req: ForceInterventionRequest):
    if episode_id not in active_optimizers:
        env = EditingEnvironment(episode_id=episode_id)
        active_environments[episode_id] = env
        active_optimizers[episode_id] = BeamSearchOptimizer(env)

    env = active_environments[episode_id]
    optimizer = active_optimizers[episode_id]

    target_clip_id = req.target_clip_id or (env.state.clips[1].clip_id if len(env.state.clips) > 1 else env.state.clips[0].clip_id)

    new_state, intervention = optimizer.showrunner.diagnose_and_intervene(
        env=env,
        state=env.state,
        stuck_clip_id=target_clip_id,
        attempt_history=optimizer.history
    )
    new_state, new_metrics = optimizer.evaluate_state(new_state)
    env.state = new_state

    clickhouse_client.insert_edit_attempt(
        episode_id=episode_id,
        attempt_n=new_state.attempt_n,
        action="manual_showrunner_intervention",
        target_clip_id=target_clip_id,
        reward=new_metrics.scalar_reward,
        verdict="showrunner_intervened",
        reasoning=intervention["reasoning"]
    )

    return {
        "status": "intervention_applied",
        "intervention": intervention,
        "reward": new_metrics.scalar_reward,
        "clips": [c.model_dump() for c in new_state.clips],
        "video_url": f"/api/episodes/{episode_id}/video?t={os.urandom(2).hex()}"
    }

@app.get("/api/episodes/{episode_id}/video")
def get_video(episode_id: str):
    env = active_environments.get(episode_id)
    if not env or not env.state.compiled_video_path or not Path(env.state.compiled_video_path).exists():
        # Fallback to latest attempt in compiled dir
        pattern = f"{episode_id}_attempt_*.mp4"
        files = sorted(settings.COMPILED_DIR.glob(pattern), key=os.path.getmtime, reverse=True)
        if files:
            return FileResponse(str(files[0]), media_type="video/mp4")
        raise HTTPException(status_code=404, detail="Compiled video not found")

    return FileResponse(str(env.state.compiled_video_path), media_type="video/mp4")

@app.get("/api/shot-pool")
def get_shot_pool():
    # Return available sample shots and B-roll
    sample_env = EditingEnvironment("pool_inspect")
    return {
        "shots": [
            {
                "clip_id": c.clip_id,
                "scene_id": c.scene_id,
                "take_id": c.take_id,
                "duration_seconds": c.duration_seconds,
                "is_broll": c.is_broll,
                "description": c.description
            }
            for c in sample_env.shot_pool.values()
        ]
    }
