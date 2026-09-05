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
import { Activity, Database, AlertCircle, TrendingUp, Zap, Sparkles } from "lucide-react";

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
    <div className="bg-[#050505] border border-white/[0.08] rounded-xl p-4 flex flex-col h-full shadow-2xl relative overflow-hidden">
      {/* Top Ambient Glow Accent */}
      <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.06] mb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold tracking-wider text-white uppercase font-mono">
              Panel B // ClickHouse Audience Telemetry
            </h2>
            <p className="text-[11px] text-white/40 font-mono">SQL Window Functions & Retention Oracle</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Source Filter Tabs */}
          {onSelectSource && (
            <div className="flex items-center bg-[#0a0a0d] border border-white/[0.08] rounded-lg p-0.5 text-[11px] font-mono shadow-inner">
              <button
                onClick={() => onSelectSource("all")}
                className={`px-2.5 py-1 rounded-md transition-all duration-150 ${
                  selectedSource === "all"
                    ? "bg-white/[0.1] text-white font-semibold shadow-sm"
                    : "text-white/40 hover:text-white/80"
                }`}
              >
                All
              </button>
              <button
                onClick={() => onSelectSource("heuristic")}
                className={`px-2.5 py-1 rounded-md transition-all duration-150 ${
                  selectedSource === "heuristic"
                    ? "bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30 shadow-sm"
                    : "text-white/40 hover:text-white/80"
                }`}
              >
                Heuristic
              </button>
              <button
                onClick={() => onSelectSource("qwen_swarm")}
                className={`px-2.5 py-1 rounded-md transition-all duration-150 ${
                  selectedSource === "qwen_swarm"
                    ? "bg-purple-500/15 text-purple-300 font-semibold border border-purple-500/30 shadow-sm"
                    : "text-white/40 hover:text-white/80"
                }`}
              >
                Qwen Swarm
              </button>
            </div>
          )}

          <span className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono rounded-lg bg-white/[0.03] text-white/70 border border-white/[0.08]">
            <Database className="w-3 h-3 text-cyan-400" />
            <span>{clickhouseMode === "cloud" ? "ClickHouse Cloud (MCP)" : "Embedded SQL Oracle"}</span>
          </span>
        </div>
      </div>

      {/* Side-by-Side Comparison Banner if Swarm data exists */}
      {comparisonData.length > 1 && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-[#0a0a0f] border border-purple-500/30 flex items-center justify-between text-xs font-mono shadow-sm">
          <span className="text-purple-400 font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            ClickHouse Consensus:
          </span>
          <div className="flex items-center gap-4 text-white/70 text-[11px]">
            {comparisonData.map((item) => (
              <span key={item.source} className="flex items-center gap-1">
                <span className={item.source === "qwen_swarm" ? "text-purple-400 font-bold" : "text-cyan-400 font-bold"}>
                  {item.source}:
                </span>
                <span>{item.count_points} pts</span>
                <span className="text-white/20">|</span>
                <span>Att: {(item.avg_att * 100).toFixed(1)}%</span>
                <span className="text-white/20">|</span>
                <span>Arousal: {(item.avg_arousal * 100).toFixed(1)}%</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Metric Cards Row */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        <div className="bg-[#08080a] border border-white/[0.06] rounded-lg p-2.5">
          <span className="text-[10px] text-white/40 uppercase tracking-wider block font-mono">Mean Attention</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-base font-bold font-mono text-cyan-400">
              {((meanAttention || 0) * 100).toFixed(1)}%
            </span>
            <TrendingUp className="w-3 h-3 text-cyan-400/80" />
          </div>
        </div>

        <div className="bg-[#08080a] border border-white/[0.06] rounded-lg p-2.5">
          <span className="text-[10px] text-white/40 uppercase tracking-wider block font-mono">Worst Drop (Z-Score)</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={`text-base font-bold font-mono ${worstDrop < -0.15 ? 'text-rose-400' : 'text-white'}`}>
              {worstDrop ? (worstDrop * 100).toFixed(1) + '%' : '0.0%'}
            </span>
            {worstDrop < -0.15 && <AlertCircle className="w-3 h-3 text-rose-400" />}
          </div>
        </div>

        <div className="bg-[#08080a] border border-white/[0.06] rounded-lg p-2.5">
          <span className="text-[10px] text-white/40 uppercase tracking-wider block font-mono">Bottleneck Clip</span>
          <div className="truncate mt-1 text-xs font-mono font-medium text-amber-400" title={worstClipId || "None"}>
            {worstClipId ? worstClipId.replace("shot_", "") : "Stabilized"}
          </div>
        </div>

        <div className="bg-[#08080a] border border-white/[0.06] rounded-lg p-2.5">
          <span className="text-[10px] text-white/40 uppercase tracking-wider block font-mono">Scalar Reward</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-base font-bold font-mono text-emerald-400">
              {(reward || 0).toFixed(4)}
            </span>
            <Zap className="w-3 h-3 text-emerald-400/80" />
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 w-full min-h-[220px]">
        {formattedData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorArousal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.30} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#A855F7" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#A855F7" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#16161b" />
              <XAxis dataKey="time" stroke="#475569" tick={{ fontSize: 10, fill: "#64748b" }} />
              <YAxis domain={[0, 1]} stroke="#475569" tick={{ fontSize: 10, fill: "#64748b" }} />
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
              <Area type="monotone" dataKey="Attention" stroke="#06B6D4" strokeWidth={2} fillOpacity={1} fill="url(#colorAtt)" />
              <Area type="monotone" dataKey="Arousal" stroke="#F59E0B" strokeWidth={1.5} fillOpacity={1} fill="url(#colorArousal)" />
              <Area type="monotone" dataKey="CognitiveLoad" stroke="#A855F7" strokeWidth={1.5} fillOpacity={1} fill="url(#colorLoad)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-white/30 font-mono text-xs">
            <Activity className="w-8 h-8 text-white/20 mb-2 animate-pulse" />
            <span>Waiting for telemetry stream from ClickHouse...</span>
            <span className="text-[10px] text-white/20 mt-1">Query: SELECT avg(attention), lagInFrame(...) OVER (ORDER BY t_ms)</span>
          </div>
        )}
      </div>
    </div>
  );
};
