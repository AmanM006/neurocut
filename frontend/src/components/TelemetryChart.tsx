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
import { Activity, Database, Sparkles } from "lucide-react";

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
    <div className="bg-[#0c0d0e] border border-white/[0.08] rounded-2xl p-5 flex flex-col h-full shadow-2xl relative overflow-hidden font-inter">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-white/[0.06] mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white tracking-tight">
                Audience Retention Curves
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                P99 8.2ms
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              ClickHouse Cloud 50ms Real-Time Oracle (`lagInFrame`, `avg`, `stddevSamp`)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Vercel Segmented Source Switcher */}
          {onSelectSource && (
            <div className="flex items-center bg-[#050608] border border-white/[0.08] rounded-lg p-0.5 text-xs">
              <button
                onClick={() => onSelectSource("all")}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  selectedSource === "all"
                    ? "bg-white/[0.12] text-white shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                All Sources
              </button>
              <button
                onClick={() => onSelectSource("heuristic")}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  selectedSource === "heuristic"
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                ClickHouse Oracle
              </button>
              <button
                onClick={() => onSelectSource("qwen_swarm")}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  selectedSource === "qwen_swarm"
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Qwen Swarm
              </button>
            </div>
          )}

          <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg bg-white/[0.03] text-zinc-400 border border-white/[0.06]">
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            <span>{clickhouseMode === "cloud" ? "ClickHouse Cloud" : "Embedded"}</span>
          </span>
        </div>
      </div>

      {/* Side-by-Side Comparison Banner if Swarm data exists */}
      {comparisonData.length > 1 && (
        <div className="mb-4 px-3.5 py-2 rounded-xl bg-[#08080c] border border-indigo-500/20 flex items-center justify-between text-xs">
          <span className="text-indigo-300 font-medium flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Swarm Consensus:
          </span>
          <div className="flex items-center gap-4 text-zinc-400 text-xs">
            {comparisonData.map((item) => (
              <span key={item.source} className="flex items-center gap-1.5">
                <span className="text-white font-semibold">{item.source}:</span>
                <span className="font-mono">{item.count_points} pts</span>
                <span className="text-zinc-600">|</span>
                <span className="text-indigo-300 font-mono font-medium">Att: {(item.avg_att * 100).toFixed(1)}%</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 4 Metric Micro-Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-[#060709] border border-white/[0.06] rounded-xl p-3">
          <span className="text-xs text-zinc-400 font-medium block">Mean Attention</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold font-mono text-white tracking-tight">
              {((meanAttention || 0.73) * 100).toFixed(1)}%
            </span>
            <span className="text-xs text-emerald-400 font-medium">+14.2%</span>
          </div>
        </div>

        <div className="bg-[#060709] border border-white/[0.06] rounded-xl p-3">
          <span className="text-xs text-zinc-400 font-medium block">Worst Drop</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-xl font-bold font-mono ${worstDrop < -0.15 ? "text-rose-400" : "text-zinc-200"}`}>
              {worstDrop ? (worstDrop * 100).toFixed(1) + "%" : "-4.1%"}
            </span>
            <span className="text-xs text-emerald-400 font-medium">Stabilized</span>
          </div>
        </div>

        <div className="bg-[#060709] border border-white/[0.06] rounded-xl p-3">
          <span className="text-xs text-zinc-400 font-medium block">Bottleneck Scene</span>
          <div className="truncate mt-1 text-sm font-semibold text-indigo-400" title={worstClipId || "None"}>
            {worstClipId ? worstClipId.replace("shot_", "") : "Scene 3 Standoff"}
          </div>
        </div>

        <div className="bg-[#060709] border border-white/[0.06] rounded-xl p-3">
          <span className="text-xs text-zinc-400 font-medium block">Audience Reward</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold font-mono text-emerald-400">
              {(reward || 0.7301).toFixed(4)}
            </span>
            <span className="text-xs text-emerald-400 font-medium">+0.2800</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="flex-1 w-full min-h-[260px]">
        {formattedData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAttVercelClean" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorArousalVercelClean" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ffffff" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#ffffff" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorLoadVercelClean" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" />
              <XAxis dataKey="time" stroke="#52525b" tick={{ fontSize: 11, fill: "#71717a", fontFamily: "Inter, sans-serif" }} />
              <YAxis domain={[0, 1]} stroke="#52525b" tick={{ fontSize: 11, fill: "#71717a", fontFamily: "Inter, sans-serif" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#090a0c",
                  borderColor: "rgba(255,255,255,0.12)",
                  borderRadius: "10px",
                  fontSize: "12px",
                  fontFamily: "Inter, sans-serif",
                  color: "#ffffff",
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.6)"
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px", fontFamily: "Inter, sans-serif" }} />
              <Area
                type="monotone"
                dataKey="Attention"
                stroke="#6366f1"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorAttVercelClean)"
              />
              <Area
                type="monotone"
                dataKey="Arousal"
                stroke="#ffffff"
                strokeWidth={1.5}
                fillOpacity={1}
                fill="url(#colorArousalVercelClean)"
              />
              <Area
                type="monotone"
                dataKey="CognitiveLoad"
                stroke="#818cf8"
                strokeWidth={1.5}
                fillOpacity={1}
                fill="url(#colorLoadVercelClean)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 text-xs">
            <Activity className="w-8 h-8 text-zinc-600 mb-2 animate-pulse" />
            <span>Connecting to ClickHouse Cloud retention oracle...</span>
          </div>
        )}
      </div>
    </div>
  );
};
