"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine
} from "recharts";
import { BrainCircuit, TrendingUp, Play, RefreshCw, Trophy, Target, ShieldCheck, ExternalLink } from "lucide-react";

interface TrainingPoint {
  episode: number;
  reward: number;
  rolling_avg: number;
  best_so_far: number;
}

interface ProgressResponse {
  status: string;
  current_episode: number;
  baseline_reward: number;
  eval_reward: number | null;
  best_so_far: number;
  points: TrainingPoint[];
}

export const TrainingProgress: React.FC = () => {
  const [data, setData] = useState<ProgressResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isStarting, setIsStarting] = useState<boolean>(false);

  const fetchProgress = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/training/progress");
      if (res.ok) {
        const json: ProgressResponse = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error("Failed to fetch training progress:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProgress();
    const interval = setInterval(fetchProgress, 10000);
    return () => clearInterval(interval);
  }, [fetchProgress]);

  const handleStartTraining = async () => {
    try {
      setIsStarting(true);
      const res = await fetch("/api/training/start?episodes=50", { method: "POST" });
      if (res.ok) {
        await fetchProgress();
      }
    } catch (e) {
      console.error("Failed to start training:", e);
    } finally {
      setIsStarting(false);
    }
  };

  const points = data?.points || [];
  const baselineReward = data?.baseline_reward ?? 0.6730;
  const bestSoFar = data?.best_so_far ?? 0.0;
  const currentEp = data?.current_episode ?? 0;
  const isBeatingBaseline = bestSoFar >= baselineReward;

  return (
    <div className="bg-[#101620] border border-slate-800 rounded-xl p-4 flex flex-col h-full shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <BrainCircuit className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                PPO RL Policy Training Curve
              </h2>
              {data?.status === "training" && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  TRAINING ACTIVE
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Live ClickHouse Window Aggregation: 20-Ep Rolling Average vs Ground-Truth Baseline
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={fetchProgress}
            disabled={loading}
            className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 rounded-lg transition"
            title="Refresh metrics from ClickHouse"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <a
            href="https://colab.research.google.com/github/AmanM006/neurocut/blob/main/notebooks/train_ppo_colab.ipynb"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 shadow-lg transition font-mono"
            title="Train 100-300 PPO episodes on Google Colab Cloud GPU to keep local machine free"
          >
            <span>Colab Worker</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={handleStartTraining}
            disabled={isStarting || data?.status === "training"}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 shadow-lg shadow-amber-500/10 transition font-mono"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {data?.status === "training" ? "Training..." : "Train Local"}
          </button>
        </div>
      </div>

      {/* KPI Banners */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-lg p-2 flex flex-col">
          <span className="text-[10px] uppercase font-mono text-slate-400 flex items-center gap-1">
            <Target className="w-3 h-3 text-cyan-400" /> Current Episode
          </span>
          <span className="text-sm font-bold font-mono text-white mt-0.5">
            Ep #{currentEp}
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-lg p-2 flex flex-col">
          <span className="text-[10px] uppercase font-mono text-slate-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-amber-400" /> Rolling Avg (20)
          </span>
          <span className="text-sm font-bold font-mono text-amber-400 mt-0.5">
            {points.length > 0 ? points[points.length - 1].rolling_avg.toFixed(4) : "0.0000"}
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-lg p-2 flex flex-col">
          <span className="text-[10px] uppercase font-mono text-slate-400 flex items-center gap-1">
            <Trophy className="w-3 h-3 text-emerald-400" /> Best So Far
          </span>
          <span className="text-sm font-bold font-mono text-emerald-400 mt-0.5">
            {bestSoFar.toFixed(4)}
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-lg p-2 flex flex-col">
          <span className="text-[10px] uppercase font-mono text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-blue-400" /> P1 Baseline
          </span>
          <span className="text-sm font-bold font-mono text-blue-400 mt-0.5">
            {baselineReward.toFixed(4)}
          </span>
        </div>
      </div>

      {/* Head-to-Head Status Callout */}
      <div className={`px-3 py-2 rounded-lg border text-xs font-mono mb-3 flex items-center justify-between ${
        isBeatingBaseline
          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
          : "bg-slate-900/60 border-slate-800 text-slate-300"
      }`}>
        <div className="flex items-center gap-2">
          <span className="font-bold">
            {isBeatingBaseline ? "🏆 RL Policy Outperforming Baseline:" : "⚖️ RL Policy vs Deterministic Core:"}
          </span>
          <span>
            {bestSoFar > 0
              ? `PPO Best: ${bestSoFar.toFixed(4)} | Beam Search: ${baselineReward.toFixed(4)} (${(
                  ((bestSoFar - baselineReward) / baselineReward) *
                  100
                ).toFixed(1)}% delta)`
              : "Awaiting training iterations to establish comparison"}
          </span>
        </div>
        <span className="text-[10px] text-slate-400">
          Source: ClickHouse `default.edit_attempts`
        </span>
      </div>

      {/* Recharts Curve Visualization */}
      <div className="flex-1 w-full min-h-[220px]">
        {points.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="episode"
                stroke="#64748b"
                tick={{ fontSize: 10, fill: "#64748b" }}
                label={{ value: "Episode Number", position: "insideBottom", offset: -5, fontSize: 10, fill: "#64748b" }}
              />
              <YAxis
                domain={[0.35, 0.85]}
                stroke="#64748b"
                tick={{ fontSize: 10, fill: "#64748b" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0b0f14",
                  borderColor: "#334155",
                  borderRadius: "8px",
                  fontSize: "11px",
                  fontFamily: "monospace"
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "6px" }} />
              <ReferenceLine
                y={baselineReward}
                stroke="#38bdf8"
                strokeDasharray="4 4"
                label={{ value: `P1 Baseline (${baselineReward.toFixed(3)})`, position: "insideTopRight", fill: "#38bdf8", fontSize: 10 }}
              />
              <Line
                type="monotone"
                dataKey="rolling_avg"
                name="Rolling Avg (20 Eps)"
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={false}
              />
              <Line
                type="stepAfter"
                dataKey="best_so_far"
                name="Best-So-Far Ceiling"
                stroke="#10b981"
                strokeWidth={2}
                strokeDasharray="3 3"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="reward"
                name="Episode Final Reward"
                stroke="#94a3b8"
                strokeWidth={1}
                dot={{ r: 1.5, fill: "#94a3b8" }}
                opacity={0.35}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 font-mono text-xs">
            <BrainCircuit className="w-8 h-8 text-slate-700 mb-2" />
            <span>No PPO training episodes recorded yet in ClickHouse Cloud.</span>
            <span className="text-[10px] text-slate-600 mt-1">Click &quot;Train 50 Eps&quot; to begin curriculum.</span>
          </div>
        )}
      </div>
    </div>
  );
};
