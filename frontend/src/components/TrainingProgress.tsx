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
import {
  BrainCircuit,
  TrendingUp,
  Play,
  RefreshCw,
  Trophy,
  Target,
  ShieldCheck,
  ExternalLink,
  Award,
  Info,
  Sparkles,
  CheckCircle2,
  Crown
} from "lucide-react";
import { ChartSkeleton } from "./SkeletonLoader";

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
  const [showArchitectureInfo, setShowArchitectureInfo] = useState<boolean>(false);

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
  const evalReward = data?.eval_reward ?? null;
  const currentEp = data?.current_episode ?? 0;

  // Empirical Champion Logic:
  // Evaluated frozen policy is the true benchmark.
  const isPPOChampion = evalReward !== null && evalReward >= baselineReward;
  const ppoPeakBeatsBaseline = bestSoFar >= baselineReward;

  if (!data && loading) {
    return (
      <div className="bg-[#0c0c0e] border border-white/[0.07] rounded-2xl p-4 sm:p-5 flex flex-col h-full shadow-2xl">
        <ChartSkeleton />
      </div>
    );
  }

  return (
    <div className="bg-[#0c0c0e] border border-white/[0.07] rounded-2xl p-4 sm:p-5 flex flex-col h-full shadow-2xl relative overflow-hidden">
      {/* Top Ambient Glow Accent */}
      <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.06] mb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm">
            <BrainCircuit className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                PPO RL Policy Training Curve
              </h2>
              {data?.status === "training" && (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  TRAINING ACTIVE
                </span>
              )}
            </div>
            <p className="text-[11px] text-white/40 font-mono">
              Live ClickHouse Window Aggregation: 20-Ep Rolling Average vs Ground-Truth Baseline
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowArchitectureInfo(!showArchitectureInfo)}
            className={`p-1.5 rounded-lg border transition-all duration-150 ${
              showArchitectureInfo
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                : "text-white/40 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] border-white/[0.08]"
            }`}
            title="Architectural Role Distinction: P1 Baseline vs P3 Policy"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={fetchProgress}
            disabled={loading}
            className="p-1.5 text-white/40 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] rounded-lg transition-all duration-150 border border-white/[0.08]"
            title="Refresh metrics from ClickHouse"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <a
            href="https://colab.research.google.com/github/AmanM006/neurocut/blob/main/notebooks/train_ppo_colab.ipynb"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] text-amber-300 border border-amber-500/30 hover:border-amber-500/50 shadow-sm transition-all duration-150 font-mono active:scale-[0.98]"
            title="Train 5,000 PPO episodes on Google Colab Cloud GPU to keep local machine free"
          >
            <span>Colab 5K Run</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={handleStartTraining}
            disabled={isStarting || data?.status === "training"}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-md shadow-amber-500/20 border border-amber-400/40 transition-all duration-150 active:scale-[0.98] font-mono disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {data?.status === "training" ? "Training..." : "Train Local"}
          </button>
        </div>
      </div>

      {/* Explanatory Architecture Drawer (Collapsible) */}
      {showArchitectureInfo && (
        <div className="bg-[#0a0a0e] border border-amber-500/30 rounded-xl p-3 mb-3 text-xs font-mono text-white/80 space-y-2 animate-fadeIn">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>RL Insight: Goodhart&apos;s Law in Autonomous Video Editing</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
            <div className="bg-black/60 p-2.5 rounded-lg border border-blue-500/20">
              <span className="text-blue-400 font-bold block mb-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Phase 1: Beam Search + Showrunner (Production Winner)
              </span>
              <p className="text-white/50 leading-relaxed">
                Preserves full 22.0s dramatic arc across all 5 scenes (<strong className="text-blue-300">0.6730</strong> reward). When the standoff bottleneck dragged, the Showrunner Agent synthesized creative B-roll cutaways to sustain audience retention without hollowing out the story.
              </p>
            </div>
            <div className="bg-black/60 p-2.5 rounded-lg border border-amber-500/20">
              <span className="text-amber-400 font-bold block mb-1 flex items-center gap-1">
                <BrainCircuit className="w-3 h-3" /> Phase 3: Unconstrained PPO (Reward Hacking Finding)
              </span>
              <p className="text-white/50 leading-relaxed">
                Trivially maximized arithmetic mean attention to <strong className="text-emerald-300">0.7301</strong> (+8.5%) by deleting 60% of the film (8.5s 2-shot cut). Demonstrates why autonomous editing cannot rely on pure RL alone: Google ADK Showrunner oversight is essential to enforce narrative continuity.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Current Champion & Alignment Insight Banner */}
      <div className="rounded-xl border border-white/[0.08] bg-black/60 p-3 mb-3 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-mono uppercase tracking-wide text-white/80">
                  Production Film Winner:
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  🛡️ BEAM SEARCH + SHOWRUNNER (22.0s)
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  ⚡ PPO: REWARD-HACKING INSIGHT
                </span>
              </div>
            </div>
          </div>
          <span className="text-[10px] font-mono text-white/40">
            Telemetry: ClickHouse Cloud
          </span>
        </div>

        {/* Head-to-Head Stats Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          {/* Baseline Production Cut */}
          <div className="bg-[#08080a] rounded-lg p-2.5 border border-blue-500/30 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-[10px] text-blue-400 font-semibold uppercase">
                <CheckCircle2 className="w-3 h-3" /> Phase 1: Production Executive Cut
              </div>
              <div className="text-sm font-bold text-white mt-1 flex items-baseline gap-2">
                <span>{baselineReward.toFixed(4)}</span>
                <span className="text-[10px] text-blue-300/80 font-normal">22.0s • 5 Scenes</span>
              </div>
              <p className="text-[10px] text-white/50 mt-0.5 leading-snug">
                Full narrative intact + Showrunner B-roll injection resolving standoff bottleneck.
              </p>
            </div>
            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 shrink-0 ml-2">
              BEST FILM
            </span>
          </div>

          {/* PPO Neural Exploration */}
          <div className="bg-[#08080a] rounded-lg p-2.5 border border-amber-500/30 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-semibold uppercase">
                <BrainCircuit className="w-3 h-3" /> Phase 3: PPO Neural Policy
              </div>
              <div className="text-sm font-bold text-white mt-1 flex items-baseline gap-2">
                <span className="text-emerald-400">{evalReward !== null ? evalReward.toFixed(4) : bestSoFar.toFixed(4)}</span>
                <span className="text-[10px] text-amber-300/80 font-normal">8.5s • 2 Scenes</span>
              </div>
              <p className="text-[10px] text-white/50 mt-0.5 leading-snug">
                <strong className="text-amber-300">Goodhart's Law:</strong> Policy pruned setup scenes to maximize mean engagement (+8.5%).
              </p>
            </div>
            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0 ml-2">
              PEAK SCALAR
            </span>
          </div>
        </div>
      </div>

      {/* KPI Banners */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        <div className="bg-[#08080a] border border-white/[0.06] rounded-lg p-2.5 flex flex-col">
          <span className="text-[10px] uppercase font-mono text-white/40 flex items-center gap-1.5">
            <Target className="w-3 h-3 text-cyan-400" /> Current Episode
          </span>
          <span className="text-sm font-bold font-mono text-white mt-1">
            Ep #{currentEp}
          </span>
        </div>

        <div className="bg-[#08080a] border border-white/[0.06] rounded-lg p-2.5 flex flex-col">
          <span className="text-[10px] uppercase font-mono text-white/40 flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3 text-amber-400" /> Rolling Avg (20)
          </span>
          <span className="text-sm font-bold font-mono text-amber-400 mt-1">
            {points.length > 0 ? points[points.length - 1].rolling_avg.toFixed(4) : "0.0000"}
          </span>
        </div>

        <div className="bg-[#08080a] border border-white/[0.06] rounded-lg p-2.5 flex flex-col">
          <span className="text-[10px] uppercase font-mono text-white/40 flex items-center gap-1.5">
            <Trophy className="w-3 h-3 text-emerald-400" /> Best So Far
          </span>
          <span className="text-sm font-bold font-mono text-emerald-400 mt-1">
            {bestSoFar.toFixed(4)}
          </span>
        </div>

        <div className="bg-[#08080a] border border-white/[0.06] rounded-lg p-2.5 flex flex-col">
          <span className="text-[10px] uppercase font-mono text-white/40 flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3 text-blue-400" /> P1 Baseline
          </span>
          <span className="text-sm font-bold font-mono text-blue-400 mt-1">
            {baselineReward.toFixed(4)}
          </span>
        </div>
      </div>

      {/* Recharts Curve Visualization */}
      <div className="flex-1 w-full min-h-[220px]">
        {points.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#16161b" />
              <XAxis
                dataKey="episode"
                stroke="#475569"
                tick={{ fontSize: 10, fill: "#64748b" }}
                label={{ value: "Episode Number", position: "insideBottom", offset: -5, fontSize: 10, fill: "#475569" }}
              />
              <YAxis
                domain={[0.35, 0.85]}
                stroke="#475569"
                tick={{ fontSize: 10, fill: "#64748b" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#000000",
                  borderColor: "#27272a",
                  borderRadius: "8px",
                  fontSize: "11px",
                  fontFamily: "monospace",
                  color: "#ffffff"
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
          <div className="w-full h-full flex flex-col items-center justify-center text-white/30 font-mono text-xs">
            <BrainCircuit className="w-8 h-8 text-white/20 mb-2" />
            <span>No PPO training episodes recorded yet in ClickHouse Cloud.</span>
            <span className="text-[10px] text-white/20 mt-1">Click &quot;Train Local&quot; or start the Colab Worker.</span>
          </div>
        )}
      </div>
    </div>
  );
};
