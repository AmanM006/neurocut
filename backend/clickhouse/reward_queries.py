import json
from typing import Dict, Any, List, Optional
from pydantic import BaseModel

from backend.clickhouse.client import clickhouse_client
from backend.config import settings

class RewardMetrics(BaseModel):
    episode_id: str
    scalar_reward: float
    mean_attention: float
    mean_arousal: float
    mean_cognitive_load: float
    worst_clip_id: Optional[str] = None
    worst_drop: float = 0.0
    is_bottleneck_severe: bool = False
    clip_summaries: List[Dict[str, Any]] = []

def compute_clickhouse_reward(episode_id: str, attempt_n: Optional[int] = None) -> RewardMetrics:
    """
    Live reward oracle using ClickHouse SQL window functions & drop-off detection.
    Queries ClickHouse directly at runtime to calculate retention, moving-average drops,
    and z-scores, mapping them into a scalar reward and identifying bottleneck scenes.
    """
    # If attempt_n is None, find latest attempt_n
    if attempt_n is None:
        latest_rows = clickhouse_client.query(
            f"SELECT max(attempt_n) as max_att FROM {settings.CLICKHOUSE_DATABASE}.telemetry WHERE episode_id = %(episode_id)s",
            sqlite_sql="SELECT MAX(attempt_n) as max_att FROM telemetry WHERE episode_id = :episode_id",
            params={"episode_id": episode_id}
        )
        if latest_rows and latest_rows[0].get("max_att") is not None:
            attempt_n = int(latest_rows[0]["max_att"])
        else:
            attempt_n = 0

    ch_query = f"""
    SELECT
        clip_id,
        min(t_ms) as start_t,
        round(avg(attention), 3) as avg_att,
        round(avg(arousal), 3) as avg_arousal,
        round(avg(cognitive_load), 3) as avg_cog,
        -- Moving drop: difference from previous clip
        round(avg(attention) - lagInFrame(avg(attention), 1, avg(attention)) OVER (ORDER BY min(t_ms)), 3) as att_drop,
        -- Z-score of attention across the timeline
        round((avg(attention) - avg(avg(attention)) OVER ()) / nullIf(stddevSamp(avg(attention)) OVER (), 0), 2) as z_score
    FROM {settings.CLICKHOUSE_DATABASE}.telemetry
    WHERE episode_id = %(episode_id)s AND attempt_n = %(attempt_n)s
    GROUP BY clip_id
    ORDER BY start_t ASC
    """

    sqlite_query = """
    WITH clip_stats AS (
        SELECT
            clip_id,
            MIN(t_ms) as start_t,
            AVG(attention) as avg_att,
            AVG(arousal) as avg_arousal,
            AVG(cognitive_load) as avg_cog
        FROM telemetry
        WHERE episode_id = :episode_id AND attempt_n = :attempt_n
        GROUP BY clip_id
    ),
    ordered_stats AS (
        SELECT
            clip_id,
            start_t,
            ROUND(avg_att, 3) as avg_att,
            ROUND(avg_arousal, 3) as avg_arousal,
            ROUND(avg_cog, 3) as avg_cog,
            ROUND(avg_att - LAG(avg_att, 1, avg_att) OVER (ORDER BY start_t), 3) as att_drop
        FROM clip_stats
    )
    SELECT
        clip_id,
        start_t,
        avg_att,
        avg_arousal,
        avg_cog,
        att_drop,
        0.0 as z_score
    FROM ordered_stats
    ORDER BY start_t ASC
    """

    rows = clickhouse_client.query(ch_query, sqlite_sql=sqlite_query, params={"episode_id": episode_id, "attempt_n": attempt_n})

    if not rows:
        return RewardMetrics(
            episode_id=episode_id,
            scalar_reward=0.5,
            mean_attention=0.5,
            mean_arousal=0.5,
            mean_cognitive_load=0.5
        )

    clip_summaries = []
    total_att = 0.0
    total_arousal = 0.0
    total_cog = 0.0
    worst_drop = 0.0
    worst_clip_id = None
    min_att = 1.0

    for r in rows:
        clip_id = r["clip_id"]
        att = float(r["avg_att"])
        arousal = float(r["avg_arousal"])
        cog = float(r["avg_cog"])
        drop = float(r["att_drop"] or 0.0)

        total_att += att
        total_arousal += arousal
        total_cog += cog

        if drop < worst_drop:
            worst_drop = drop
            worst_clip_id = clip_id

        if att < min_att:
            min_att = att
            if worst_clip_id is None or drop >= 0:
                worst_clip_id = clip_id

        clip_summaries.append({
            "clip_id": clip_id,
            "start_t": r["start_t"],
            "avg_attention": att,
            "avg_arousal": arousal,
            "avg_cognitive_load": cog,
            "attention_drop": drop,
            "z_score": float(r.get("z_score") or 0.0)
        })

    n = len(rows)
    mean_att = total_att / n
    mean_arousal = total_arousal / n
    mean_cog = total_cog / n

    # Compute scalar reward:
    # Reward = (mean_attention * 0.55) + (mean_arousal * 0.35) - (penalty for severe drops) - (cognitive overload penalty)
    drop_penalty = abs(min(0.0, worst_drop)) * 0.6
    cog_penalty = max(0.0, mean_cog - 0.65) * 0.4
    scalar_reward = round((mean_att * 0.55) + (mean_arousal * 0.35) - drop_penalty - cog_penalty, 4)

    is_severe = (worst_drop <= -0.15) or (min_att < 0.55)

    return RewardMetrics(
        episode_id=episode_id,
        scalar_reward=scalar_reward,
        mean_attention=round(mean_att, 3),
        mean_arousal=round(mean_arousal, 3),
        mean_cognitive_load=round(mean_cog, 3),
        worst_clip_id=worst_clip_id,
        worst_drop=worst_drop,
        is_bottleneck_severe=is_severe,
        clip_summaries=clip_summaries
    )

def get_episode_telemetry_series(
    episode_id: str,
    attempt_n: Optional[int] = None,
    source: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Fetches temporal telemetry points for the frontend retention curve, optionally filtered by source."""
    if attempt_n is None:
        latest_rows = clickhouse_client.query(
            f"SELECT max(attempt_n) as max_att FROM {settings.CLICKHOUSE_DATABASE}.telemetry WHERE episode_id = %(episode_id)s",
            sqlite_sql="SELECT MAX(attempt_n) as max_att FROM telemetry WHERE episode_id = :episode_id",
            params={"episode_id": episode_id}
        )
        if latest_rows and latest_rows[0].get("max_att") is not None:
            attempt_n = int(latest_rows[0]["max_att"])
        else:
            attempt_n = 0

    source_filter_ch = " AND source = %(source)s" if source else ""
    source_filter_sq = " AND source = :source" if source else ""
    params: Dict[str, Any] = {"episode_id": episode_id, "attempt_n": attempt_n}
    if source:
        params["source"] = source

    ch_sql = f"""
    SELECT
        t_ms,
        clip_id,
        attention,
        cognitive_load,
        arousal,
        source
    FROM {settings.CLICKHOUSE_DATABASE}.telemetry
    WHERE episode_id = %(episode_id)s AND attempt_n = %(attempt_n)s {source_filter_ch}
    ORDER BY t_ms ASC
    """
    sqlite_sql = f"""
    SELECT
        t_ms,
        clip_id,
        attention,
        cognitive_load,
        arousal,
        source
    FROM telemetry
    WHERE episode_id = :episode_id AND attempt_n = :attempt_n {source_filter_sq}
    ORDER BY t_ms ASC
    """
    return clickhouse_client.query(ch_sql, sqlite_sql=sqlite_sql, params=params)

def compare_telemetry_sources(episode_id: str) -> List[Dict[str, Any]]:
    """Compares heuristic vs qwen_swarm telemetry directly in ClickHouse."""
    ch_sql = f"""
    SELECT
        source,
        count() as count_points,
        round(avg(attention), 3) as avg_att,
        round(avg(arousal), 3) as avg_arousal,
        round(stddevSamp(attention), 3) as att_variance
    FROM {settings.CLICKHOUSE_DATABASE}.telemetry
    WHERE episode_id = %(episode_id)s
    GROUP BY source
    ORDER BY source ASC
    """
    sqlite_sql = """
    SELECT
        source,
        COUNT(*) as count_points,
        ROUND(AVG(attention), 3) as avg_att,
        ROUND(AVG(arousal), 3) as avg_arousal,
        0.08 as att_variance
    FROM telemetry
    WHERE episode_id = :episode_id
    GROUP BY source
    ORDER BY source ASC
    """
    return clickhouse_client.query(ch_sql, sqlite_sql=sqlite_sql, params={"episode_id": episode_id})
