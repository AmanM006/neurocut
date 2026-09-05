-- Neuro-Cut ClickHouse Schema
-- Load-bearing reward & analytics engine for Agentic Cinema

CREATE TABLE IF NOT EXISTS telemetry (
  episode_id String,
  attempt_n UInt16 DEFAULT 0,
  clip_id String,
  t_ms UInt32,
  attention Float32,
  cognitive_load Float32,
  arousal Float32,
  source String, -- 'heuristic' | 'qwen_swarm'
  ts DateTime DEFAULT now()
) ENGINE = MergeTree ORDER BY (episode_id, attempt_n, clip_id, t_ms);

CREATE TABLE IF NOT EXISTS edit_attempts (
  episode_id String,
  attempt_n UInt16,
  action String,
  target_clip_id String,
  reward Float32,
  verdict String, -- 'pass' | 'retry' | 'showrunner_intervened'
  reasoning String,
  reward_v1_mean Float32 DEFAULT reward,
  reward_v2_coverage Float32 DEFAULT reward,
  shot_count UInt16 DEFAULT 0,
  duration_seconds Float32 DEFAULT 0.0,
  ts DateTime DEFAULT now()
) ENGINE = MergeTree ORDER BY (episode_id, attempt_n);

CREATE TABLE IF NOT EXISTS showrunner_decisions (
  episode_id String,
  decision_type String, -- 'generate_broll' | 'restart_episode' | 'adjust_exploration'
  target_scene String,
  reasoning String,
  ts DateTime DEFAULT now()
) ENGINE = MergeTree ORDER BY (episode_id, ts);
