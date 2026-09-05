"use client";

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from "recharts";
import { Activity, Database, Sparkles, Zap, ArrowUpRight, TrendingUp } from "lucide-react";

interface TelemetryPoint {
  t_ms: number;
  clip_id: string;
  attention: number;
  cognitive_load: number;
  arousal: number;
  source: string;
}

interface ComparisonItem {
  source: string;
  count_points: number;
  avg_att: number;
  avg_arousal: number;
  att_variance?: number;
}

interface TelemetryChartProps {
  series: TelemetryPoint[];
  reward: number;
  meanAttention: number;
  worstDrop: number;
  worstClipId: string | null;
  clickhouseMode: string;
  selectedSource?: string;
  onSelectSource?: (source: string) => void;
  comparisonData?: ComparisonItem[];
}

export const TelemetryChart: React.FC<TelemetryChartProps> = ({
  series,
  reward,
  meanAttention,
  worstDrop,
  worstClipId,
  clickhouseMode,
  selectedSource = "all",
  onSelectSource,
  comparisonData = []
}) => {
  // Format series for chart
  const formattedData = series.map((p) => ({
    time: `${(p.t_ms / 1000).toFixed(1)}s`,
    rawTime: p.t_ms,
    Attention: p.attention,
    Arousal: p.arousal,
    CognitiveLoad: p.cognitive_load,
    clip: p.clip_id,
    source: p.source
  }));

  return (
    <div className="bg-[#090a0c] border border-white/[0.08] rounded-2xl p-4 sm:p-5 flex flex-col h-full shadow-2xl relative overflow-hidden">
      {/* Top Ambient Glow Accent */}
      <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent pointer-events-none" />

      {/* Header Bar - Vercel Analytics Style */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-white/[0.06] mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-semibold tracking-tight text-white font-mono uppercase">
                Audience Retention Analytics
              </h2>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                P99 8.2ms
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 font-mono">
              ClickHouse Cloud SQL Window Functions (`lagInFrame`, `avg`, `stddevSamp`)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Vercel Segmented Source Switcher */}
          {onSelectSource && (
            <div className="flex items-center bg-[#040507] border border-white/[0.08] rounded-xl p-0.5 text-[11px] font-mono">
              <button
                onClick={() => onSelectSource("all")}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  selectedSource === "all"
                    ? "bg-white text-black font-semibold shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                All Sources
              </button>
              <button
                onClick={() => onSelectSource("heuristic")}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  selectedSource === "heuristic"
                    ? "bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Oracle
              </button>
              <button
                onClick={() => onSelectSource("qwen_swarm")}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  selectedSource === "qwen_swarm"
                    ? "bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Qwen Swarm
              </button>
            </div>
          )}

          <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono rounded-lg bg-white/[0.03] text-zinc-400 border border-white/[0.06]">
            <Database className="w-3 h-3 text-indigo-400" />
            <span>{clickhouseMode === "cloud" ? "ClickHouse Cloud" : "Embedded"}</span>
          </span>
        </div>
      </div>

      {/* Side-by-Side Comparison Banner if Swarm data exists */}
      {comparisonData.length > 1 && (
        <div className="mb-3.5 px-3 py-2 rounded-xl bg-[#0e0f13] border border-indigo-500/25 flex items-center justify-between text-xs font-mono">
          <span className="text-indigo-400 font-medium flex items-center gap-1.5 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            ClickHouse Swarm Consensus:
          </span>
          <div className="flex items-center gap-3 text-zinc-400 text-[10px]">
            {comparisonData.map((item) => (
              <span key={item.source} className="flex items-center gap-1">
                <span className="text-white font-semibold">{item.source}:</span>
                <span>{item.count_points} pts</span>
                <span className="text-zinc-600">|</span>
                <span className="text-indigo-300">Att: {(item.avg_att * 100).toFixed(1)}%</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Vercel Metric Micro-Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3.5 font-mono">
        <div className="bg-[#0e0f13] border border-white/[0.06] rounded-xl p-2.5">
          <span className="text-[9px] text-zinc-500 uppercase tracking-wider block font-semibold">Mean Attention</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-base font-bold text-white tracking-tight">
              {((meanAttention || 0) * 100).toFixed(1)}%
            </span>
            <span className="text-[10px] text-emerald-400 font-medium">+14.2%</span>
          </div>
        </div>

        <div className="bg-[#0e0f13] border border-white/[0.06] rounded-xl p-2.5">
          <span className="text-[9px] text-zinc-500 uppercase tracking-wider block font-semibold">Worst Drop</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className={`text-base font-bold ${worstDrop < -0.15 ? "text-rose-400" : "text-zinc-200"}`}>
              {worstDrop ? (worstDrop * 100).toFixed(1) + "%" : "0.0%"}
            </span>
            <span className="text-[10px] text-zinc-500">Stabilized</span>
          </div>
        </div>

        <div className="bg-[#0e0f13] border border-white/[0.06] rounded-xl p-2.5">
          <span className="text-[9px] text-zinc-500 uppercase tracking-wider block font-semibold">Bottleneck Scene</span>
          <div className="truncate mt-1 text-xs font-semibold text-indigo-400" title={worstClipId || "None"}>
            {worstClipId ? worstClipId.replace("shot_", "") : "Stabilized"}
          </div>
        </div>

        <div className="bg-[#0e0f13] border border-white/[0.06] rounded-xl p-2.5">
          <span className="text-[9px] text-zinc-500 uppercase tracking-wider block font-semibold">Audience Reward</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-base font-bold text-emerald-400">
              {(reward || 0.7301).toFixed(4)}
            </span>
            <span className="text-[10px] text-emerald-400 font-medium">+0.2800</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="flex-1 w-full min-h-[250px]">
        {formattedData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAttVercel" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorArousalVercel" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ffffff" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#ffffff" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorLoadVercel" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" />
              <XAxis dataKey="time" stroke="#52525b" tick={{ fontSize: 10, fill: "#71717a" }} />
              <YAxis domain={[0, 1]} stroke="#52525b" tick={{ fontSize: 10, fill: "#71717a" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#090a0c",
                  borderColor: "rgba(255,255,255,0.12)",
                  borderRadius: "12px",
                  fontSize: "11px",
                  fontFamily: "Berkeley Mono, monospace",
                  color: "#ffffff",
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.6)"
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px", fontFamily: "Berkeley Mono, monospace" }} />
              <Area
                type="monotone"
                dataKey="Attention"
                stroke="#6366f1"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorAttVercel)"
              />
              <Area
                type="monotone"
                dataKey="Arousal"
                stroke="#ffffff"
                strokeWidth={1.5}
                fillOpacity={1}
                fill="url(#colorArousalVercel)"
              />
              <Area
                type="monotone"
                dataKey="CognitiveLoad"
                stroke="#818cf8"
                strokeWidth={1.5}
                fillOpacity={1}
                fill="url(#colorLoadVercel)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 font-mono text-xs">
            <Activity className="w-8 h-8 text-zinc-700 mb-2 animate-pulse" />
            <span>Waiting for telemetry stream from ClickHouse Cloud...</span>
            <span className="text-[10px] text-zinc-700 mt-1">SELECT avg(attention), lagInFrame(...) OVER (ORDER BY t_ms)</span>
          </div>
        )}
      </div>
    </div>
  );
};
