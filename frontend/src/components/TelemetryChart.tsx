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
import { Activity, Database, AlertCircle, TrendingUp, Zap } from "lucide-react";

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
    <div className="bg-[#101620] border border-slate-800 rounded-xl p-4 flex flex-col h-full shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-wide text-slate-100 uppercase">
              Panel B // ClickHouse Audience Telemetry
            </h2>
            <p className="text-xs text-slate-400">SQL Window Functions & Retention Oracle</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Source Filter Tabs */}
          {onSelectSource && (
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[11px] font-mono">
              <button
                onClick={() => onSelectSource("all")}
                className={`px-2 py-0.5 rounded transition-all ${
                  selectedSource === "all"
                    ? "bg-slate-700 text-white font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => onSelectSource("heuristic")}
                className={`px-2 py-0.5 rounded transition-all ${
                  selectedSource === "heuristic"
                    ? "bg-cyan-900/60 text-cyan-300 font-semibold border border-cyan-700/50"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Heuristic
              </button>
              <button
                onClick={() => onSelectSource("qwen_swarm")}
                className={`px-2 py-0.5 rounded transition-all ${
                  selectedSource === "qwen_swarm"
                    ? "bg-purple-900/60 text-purple-300 font-semibold border border-purple-700/50"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Qwen Swarm
              </button>
            </div>
          )}

          <span className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono rounded bg-slate-800 text-slate-300 border border-slate-700">
            <Database className="w-3 h-3 text-cyan-400" />
            <span>{clickhouseMode === "cloud" ? "ClickHouse Cloud (MCP)" : "Embedded SQL Oracle"}</span>
          </span>
        </div>
      </div>

      {/* Side-by-Side Comparison Banner if Swarm data exists */}
      {comparisonData.length > 1 && (
        <div className="mb-3 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-purple-500/20 flex items-center justify-between text-xs font-mono">
          <span className="text-purple-400 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            ClickHouse Side-by-Side Telemetry Consensus:
          </span>
          <div className="flex items-center gap-4 text-slate-300">
            {comparisonData.map((item) => (
              <span key={item.source} className="flex items-center gap-1">
                <span className={item.source === "qwen_swarm" ? "text-purple-400" : "text-cyan-400"}>
                  {item.source}:
                </span>
                <span>{item.count_points} pts</span>
                <span className="text-slate-500">|</span>
                <span>Att: {(item.avg_att * 100).toFixed(1)}%</span>
                <span className="text-slate-500">|</span>
                <span>Arousal: {(item.avg_arousal * 100).toFixed(1)}%</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Metric Cards Row */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Mean Attention</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-lg font-bold font-mono text-cyan-400">
              {((meanAttention || 0) * 100).toFixed(1)}%
            </span>
            <TrendingUp className="w-3 h-3 text-cyan-400" />
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Worst Drop (Z-Score)</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={`text-lg font-bold font-mono ${worstDrop < -0.15 ? 'text-rose-400' : 'text-slate-200'}`}>
              {worstDrop ? (worstDrop * 100).toFixed(1) + '%' : '0.0%'}
            </span>
            {worstDrop < -0.15 && <AlertCircle className="w-3 h-3 text-rose-400" />}
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Bottleneck Clip</span>
          <div className="truncate mt-1 text-xs font-mono font-medium text-amber-400" title={worstClipId || "None"}>
            {worstClipId ? worstClipId.replace("shot_", "") : "Stabilized"}
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Scalar Reward</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-lg font-bold font-mono text-emerald-400">
              {(reward || 0).toFixed(4)}
            </span>
            <Zap className="w-3 h-3 text-emerald-400" />
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
                  <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorArousal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorCog" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" opacity={0.5} />
              <XAxis dataKey="time" stroke="#64748B" fontSize={10} tickLine={false} />
              <YAxis domain={[0, 1]} stroke="#64748B" fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0B0F14",
                  borderColor: "#334155",
                  borderRadius: "8px",
                  fontSize: "11px",
                  fontFamily: "monospace"
                }}
              />
              <Legend verticalAlign="top" height={24} iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
              <Area
                type="monotone"
                dataKey="Attention"
                stroke="#06B6D4"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorAtt)"
              />
              <Area
                type="monotone"
                dataKey="Arousal"
                stroke="#F43F5E"
                strokeWidth={1.5}
                fillOpacity={1}
                fill="url(#colorArousal)"
              />
              <Area
                type="monotone"
                dataKey="CognitiveLoad"
                stroke="#8B5CF6"
                strokeWidth={1.5}
                fillOpacity={1}
                fill="url(#colorCog)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500 text-xs font-mono">
            Waiting for telemetry stream from ClickHouse...
          </div>
        )}
      </div>

      <div className="mt-2 text-[10px] text-slate-500 flex justify-between items-center border-t border-slate-800/70 pt-2">
        <span>Query: SELECT avg(attention), lagInFrame(...) OVER (ORDER BY t_ms)</span>
        <span>Points: {series.length} | Sampling: 500ms</span>
      </div>
    </div>
  );
};
