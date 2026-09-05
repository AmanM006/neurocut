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
  CheckCircle2
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

  if (!data && loading) {
    return (
      <div className="bg-[#050505] border border-[#1a1a1a] rounded-xl p-5 flex flex-col h-full font-inter">
        <ChartSkeleton />
      </div>
    );
  }

  return (
    <div className="bg-[#050505] border border-[#1a1a1a] rounded-xl p-5 flex flex-col h-full font-inter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#1a1a1a] mb-4 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <BrainCircuit className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white">
                PPO Policy Training Horizon (5,000 Episodes)
              </h2>
              {data?.status === "training" && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                  Active
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              ClickHouse window aggregation: 20-episode rolling mean vs Phase 1 baseline
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setShowArchitectureInfo(!showArchitectureInfo)}
            className={`p-1.5 rounded-lg border transition-colors ${
              showArchitectureInfo
                ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                : "text-zinc-400 hover:text-white bg-[#0a0a0a] border-[#222222]"
            }`}
            title="Goodhart's Law & Architecture Distinction"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={fetchProgress}
            disabled={loading}
            className="p-1.5 text-zinc-400 hover:text-white bg-[#0a0a0a] rounded-lg border border-[#222222] transition-colors"
            title="Refresh metrics from ClickHouse"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <a
            href="https://colab.research.google.com/github/AmanM006/neurocut/blob/main/notebooks/train_ppo_colab.ipynb"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium bg-[#0a0a0a] hover:bg-[#141414] text-indigo-300 border border-indigo-500/30 transition-colors"
            title="Colab Cloud GPU Notebook"
          >
            <span>Colab 5K Run</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={handleStartTraining}
            disabled={isStarting || data?.status === "training"}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold bg-white text-black hover:bg-zinc-200 transition-colors shadow-sm disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{data?.status === "training" ? "Training..." : "Train 50 Eps"}</span>
          </button>
        </div>
      </div>

      {/* Collapsible Architecture Info */}
      {showArchitectureInfo && (
        <div className="bg-[#0a0a0a] border border-indigo-500/30 rounded-xl p-3.5 mb-4 text-xs text-zinc-300 space-y-2">
          <div className="flex items-center gap-1.5 text-indigo-400 font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Directorial Alignment Insight: Goodhart&apos;s Law in Cinema</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
            <div className="p-3 rounded-lg bg-[#050505] border border-blue-500/20">
              <span className="text-blue-400 font-semibold block mb-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Production Cut: Showrunner + Beam Search
              </span>
              <p className="text-zinc-400 leading-relaxed">
                Preserves all 5 scenes (22.0s duration, 0.6730 reward). When the standoff scene dragged, Showrunner synthesized creative Veo B-roll cutaways to sustain attention without destroying the narrative arc.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[#050505] border border-indigo-500/20">
              <span className="text-indigo-400 font-semibold block mb-1 flex items-center gap-1">
                <BrainCircuit className="w-3.5 h-3.5" /> Phase 3: Unconstrained PPO Policy
              </span>
              <p className="text-zinc-400 leading-relaxed">
                Trivially maximized arithmetic mean attention to 0.7301 (+8.5%) by cutting 60% of the film down to 8.5s. Proves why agentic oversight is required to avoid reward-hacking duration collapse.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Head-to-Head Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-xs">
        <div className="p-3 rounded-lg bg-[#0a0a0a] border border-blue-500/25 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] text-blue-400 font-semibold uppercase">
              <CheckCircle2 className="w-3.5 h-3.5" /> Phase 1: Production Cut (5 Scenes)
            </div>
            <div className="text-base font-bold font-mono text-white mt-1 flex items-baseline gap-2">
              <span>{baselineReward.toFixed(4)}</span>
              <span className="text-xs text-blue-300 font-normal">22.0s Arc</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Full story preserved + Veo cutaway resolving standoff bottleneck
            </p>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 shrink-0 ml-2">
            STORY WINNER
          </span>
        </div>

        <div className="p-3 rounded-lg bg-[#0a0a0a] border border-indigo-500/25 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] text-indigo-400 font-semibold uppercase">
              <BrainCircuit className="w-3.5 h-3.5" /> Phase 3: PPO Neural Policy
            </div>
            <div className="text-base font-bold font-mono text-white mt-1 flex items-baseline gap-2">
              <span className="text-emerald-400">{evalReward !== null ? evalReward.toFixed(4) : bestSoFar.toFixed(4)}</span>
              <span className="text-xs text-indigo-300 font-normal">8.5s Arc</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Goodhart&apos;s finding: Policy pruned setup scenes to boost mean attention (+8.5%)
            </p>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0 ml-2">
            SCALAR PEAK
          </span>
        </div>
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
        <div className="p-3 rounded-lg bg-[#0a0a0a] border border-[#222222]">
          <span className="text-xs text-zinc-400 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-sky-400" /> Current Ep
          </span>
          <div className="text-base font-bold font-mono text-white mt-1">
            Ep #{currentEp}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-[#0a0a0a] border border-[#222222]">
          <span className="text-xs text-zinc-400 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-400" /> Rolling Mean (20)
          </span>
          <div className="text-base font-bold font-mono text-indigo-400 mt-1">
            {points.length > 0 ? points[points.length - 1].rolling_avg.toFixed(4) : "0.0000"}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-[#0a0a0a] border border-[#222222]">
          <span className="text-xs text-zinc-400 flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-emerald-400" /> Best So Far
          </span>
          <div className="text-base font-bold font-mono text-emerald-400 mt-1">
            {bestSoFar.toFixed(4)}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-[#0a0a0a] border border-[#222222]">
          <span className="text-xs text-zinc-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> P1 Baseline
          </span>
          <div className="text-base font-bold font-mono text-blue-400 mt-1">
            {baselineReward.toFixed(4)}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 w-full min-h-[260px]">
        {points.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
              <XAxis
                dataKey="episode"
                stroke="#52525b"
                tick={{ fontSize: 10, fill: "#71717a" }}
              />
              <YAxis
                domain={[0.35, 0.85]}
                stroke="#52525b"
                tick={{ fontSize: 10, fill: "#71717a" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#050505",
                  borderColor: "#222222",
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
                stroke="#6366f1"
                strokeWidth={2}
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
                stroke="#71717a"
                strokeWidth={1}
                dot={{ r: 1.5, fill: "#71717a" }}
                opacity={0.4}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 text-xs py-10">
            <BrainCircuit className="w-8 h-8 text-zinc-600 mb-2" />
            <span>No PPO training episodes recorded yet in ClickHouse Cloud.</span>
            <span className="text-[11px] text-zinc-600 mt-1">Click &quot;Train 50 Eps&quot; or start the Colab Worker.</span>
          </div>
        )}
      </div>
    </div>
  );
};
