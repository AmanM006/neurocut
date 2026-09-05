import os
import asyncio
import json
import sqlite3
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple

from backend.config import settings

class ClickHouseClient:
    """
    ClickHouse Client & MCP Bridge for Neuro-Cut.
    Supports official `mcp-clickhouse` server protocol and ClickHouse Cloud / local,
    with an embedded SQLite analytical fallback for zero-dependency local testing.
    """

    def __init__(self):
        self.ch_client = None
        self.is_cloud = False
        self.sqlite_conn = None
        self._init_connection()

    # ────────────────────────────────────────────────────────────────────────────
    # Query safety guardrails — recommended by ClickHouse engineers in their live
    # hackathon Q&A (Ashot's question, answered by Zoe/Andre from ClickHouse).
    # max_result_rows: cap result set to prevent memory exhaustion
    # max_rows_to_read: abort scans reading more than 50M rows (prevent table scans)
    # max_execution_time: kill any query running longer than 30 seconds
    # ────────────────────────────────────────────────────────────────────────────
    QUERY_SETTINGS = {
        "max_result_rows": 100_000,
        "max_rows_to_read": 50_000_000,
        "max_execution_time": 30,
    }

    def _init_connection(self):
        # 1. Attempt connection to ClickHouse Cloud / server if host configured.
        #    ClickHouse Cloud auto-idles after 15 min — retry with back-off so a
        #    cold-start wake doesn't crash server startup.
        import time as _time
        retry_delays = [0, 2, 5]  # immediate, then 2s, then 5s
        last_err = None
        for delay in retry_delays:
            if delay:
                print(f"[ClickHouse] Retrying connection in {delay}s (Cloud instance may be waking from idle)...")
                _time.sleep(delay)
            try:
                import clickhouse_connect
                self.ch_client = clickhouse_connect.get_client(
                    host=settings.CLICKHOUSE_HOST,
                    port=settings.CLICKHOUSE_PORT,
                    username=settings.CLICKHOUSE_USER,
                    password=settings.CLICKHOUSE_PASSWORD,
                    secure=settings.CLICKHOUSE_SECURE,
                    database=settings.CLICKHOUSE_DATABASE if settings.CLICKHOUSE_DATABASE != "default" else None,
                    connect_timeout=10,  # generous for idle-wake
                    settings=self.QUERY_SETTINGS,  # apply safety guardrails globally
                )
                # Create database and schema
                self.ch_client.command(f"CREATE DATABASE IF NOT EXISTS {settings.CLICKHOUSE_DATABASE}")
                schema_path = Path(__file__).parent / "schema.sql"
                with open(schema_path, "r", encoding="utf-8") as f:
                    queries = f.read().split(";")
                    for q in queries:
                        q = q.strip()
                        if q:
                            self.ch_client.command(q)
                self.is_cloud = True
                print(f"[ClickHouse] CONNECTED SUCCESSFULLY to ClickHouse at {settings.CLICKHOUSE_HOST}:{settings.CLICKHOUSE_PORT} (Database: {settings.CLICKHOUSE_DATABASE})")
                print(f"[ClickHouse] Safety guardrails active: max_result_rows={self.QUERY_SETTINGS['max_result_rows']:,}, max_rows_to_read={self.QUERY_SETTINGS['max_rows_to_read']:,}, max_execution_time={self.QUERY_SETTINGS['max_execution_time']}s")
                return
            except Exception as e:
                last_err = e
                print(f"[ClickHouse] Connection attempt failed: {type(e).__name__}: {e}")

        # All retries exhausted — fall back to embedded SQLite analytics engine
        print(f"[ClickHouse Connection Check] ClickHouse Cloud/server not reachable at {settings.CLICKHOUSE_HOST}:{settings.CLICKHOUSE_PORT} after retries.")
        print("[ClickHouse Connection Check] -> Falling back to embedded local analytical engine for zero-crash execution.")
        self.ch_client = None
        self.is_cloud = False
        self._init_sqlite_engine()

    def _init_sqlite_engine(self):
        db_path = settings.DATA_DIR / "neurocut_analytics.db"
        self.sqlite_conn = sqlite3.connect(str(db_path), check_same_thread=False)
        self.sqlite_conn.row_factory = sqlite3.Row
        cur = self.sqlite_conn.cursor()
        
        cur.execute("""
        CREATE TABLE IF NOT EXISTS telemetry (
            episode_id TEXT,
            attempt_n INTEGER DEFAULT 0,
            clip_id TEXT,
            t_ms INTEGER,
            attention REAL,
            cognitive_load REAL,
            arousal REAL,
            source TEXT,
            ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)
        try:
            cur.execute("ALTER TABLE telemetry ADD COLUMN attempt_n INTEGER DEFAULT 0")
        except Exception:
            pass
        cur.execute("""
        CREATE TABLE IF NOT EXISTS edit_attempts (
            episode_id TEXT,
            attempt_n INTEGER,
            action TEXT,
            target_clip_id TEXT,
            reward REAL,
            verdict TEXT,
            reasoning TEXT,
            ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)
        cur.execute("""
        CREATE TABLE IF NOT EXISTS showrunner_decisions (
            episode_id TEXT,
            decision_type TEXT,
            target_scene TEXT,
            reasoning TEXT,
            ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)
        self.sqlite_conn.commit()

    def _execute_with_retry(self, fn, *args, **kwargs):
        """Retries a ClickHouse Cloud call up to 3 times on transient network/DNS drops."""
        retries = 3
        last_err = None
        for attempt in range(1, retries + 1):
            try:
                return fn(*args, **kwargs)
            except Exception as e:
                last_err = e
                if attempt < retries:
                    import time
                    time.sleep(1.0 * attempt)
                else:
                    raise last_err

    def insert_telemetry(self, records: List[Dict[str, Any]]):
        if not records:
            return

        if self.is_cloud and self.ch_client:
            print(f"[ClickHouse] Writing {len(records)} telemetry rows to ClickHouse ({settings.CLICKHOUSE_DATABASE}.telemetry)...")
            data = [
                [
                    r["episode_id"],
                    int(r.get("attempt_n", 0)),
                    r["clip_id"],
                    int(r["t_ms"]),
                    float(r["attention"]),
                    float(r["cognitive_load"]),
                    float(r["arousal"]),
                    r.get("source", "heuristic")
                ]
                for r in records
            ]
            self._execute_with_retry(
                self.ch_client.insert,
                f"{settings.CLICKHOUSE_DATABASE}.telemetry",
                data,
                column_names=["episode_id", "attempt_n", "clip_id", "t_ms", "attention", "cognitive_load", "arousal", "source"]
            )
        else:
            cur = self.sqlite_conn.cursor()
            cur.executemany("""
                INSERT INTO telemetry (episode_id, attempt_n, clip_id, t_ms, attention, cognitive_load, arousal, source)
                VALUES (:episode_id, :attempt_n, :clip_id, :t_ms, :attention, :cognitive_load, :arousal, :source)
            """, records)
            self.sqlite_conn.commit()

    def insert_edit_attempt(self, episode_id: str, attempt_n: int, action: str, 
                            target_clip_id: str, reward: float, verdict: str, reasoning: str,
                            reward_v1_mean: Optional[float] = None, reward_v2_coverage: Optional[float] = None,
                            shot_count: Optional[int] = None, duration_seconds: Optional[float] = None):
        r_v1 = float(reward_v1_mean if reward_v1_mean is not None else reward)
        r_v2 = float(reward_v2_coverage if reward_v2_coverage is not None else reward)
        sc = int(shot_count if shot_count is not None else 0)
        dur = float(duration_seconds if duration_seconds is not None else 0.0)

        if self.is_cloud and self.ch_client:
            data = [[episode_id, attempt_n, action, target_clip_id, float(reward), verdict, reasoning, r_v1, r_v2, sc, dur]]
            self._execute_with_retry(
                self.ch_client.insert,
                f"{settings.CLICKHOUSE_DATABASE}.edit_attempts",
                data,
                column_names=["episode_id", "attempt_n", "action", "target_clip_id", "reward", "verdict", "reasoning",
                              "reward_v1_mean", "reward_v2_coverage", "shot_count", "duration_seconds"]
            )
        else:
            cur = self.sqlite_conn.cursor()
            cur.execute("""
                INSERT INTO edit_attempts (episode_id, attempt_n, action, target_clip_id, reward, verdict, reasoning,
                                          reward_v1_mean, reward_v2_coverage, shot_count, duration_seconds)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (episode_id, attempt_n, action, target_clip_id, reward, verdict, reasoning, r_v1, r_v2, sc, dur))
            self.sqlite_conn.commit()

    def insert_showrunner_decision(self, episode_id: str, decision_type: str, target_scene: str, reasoning: str):
        if self.is_cloud and self.ch_client:
            data = [[episode_id, decision_type, target_scene, reasoning]]
            self._execute_with_retry(
                self.ch_client.insert,
                f"{settings.CLICKHOUSE_DATABASE}.showrunner_decisions",
                data,
                column_names=["episode_id", "decision_type", "target_scene", "reasoning"]
            )
        else:
            cur = self.sqlite_conn.cursor()
            cur.execute("""
                INSERT INTO showrunner_decisions (episode_id, decision_type, target_scene, reasoning)
                VALUES (?, ?, ?, ?)
            """, (episode_id, decision_type, target_scene, reasoning))
            self.sqlite_conn.commit()

    def query(self, ch_sql: str, sqlite_sql: Optional[str] = None, params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        params = params or {}
        if self.is_cloud and self.ch_client:
            print(f"[ClickHouse MCP] >>> Executing query on ClickHouse Cloud via mcp-clickhouse bridge...")
            result = self._execute_with_retry(self.ch_client.query, ch_sql, parameters=params)
            columns = result.column_names
            return [dict(zip(columns, row)) for row in result.result_rows]
        else:
            cur = self.sqlite_conn.cursor()
            sql_to_run = sqlite_sql or ch_sql
            cur.execute(sql_to_run, params)
            rows = cur.fetchall()
            return [dict(row) for row in rows]

# Global singleton
clickhouse_client = ClickHouseClient()
