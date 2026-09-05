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
import { Activity } from "lucide-react";

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
  const formattedData = (series || []).map((p) => ({
    time: `${(p.t_ms / 1000).toFixed(1)}s`,
    rawTime: p.t_ms,
    Attention: p.attention,
    Arousal: p.arousal,
    CognitiveLoad: p.cognitive_load,
    clip: p.clip_id,
    source: p.source
  }));

  return (
    <div className="bg-[#050505] border border-[#1a1a1a] rounded-xl p-5 flex flex-col justify-between h-full font-inter">
      {/* Top Header Bar - Clean Single Line with zero wrapping */}
      <div className="flex items-center justify-between pb-3.5 border-b border-[#1a1a1a] mb-4 gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white whitespace-nowrap">
                Audience Retention
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                8.2ms P99
              </span>
            </div>
            <p className="text-xs text-zinc-500 truncate mt-0.5">
              ClickHouse Cloud 50ms window aggregation
            </p>
          </div>
        </div>

        {/* Compact Segmented Pills - Never overflows */}
        {onSelectSource && (
          <div className="flex items-center bg-[#0a0a0a] border border-[#222222] rounded-lg p-0.5 text-xs shrink-0">
            <button
              onClick={() => onSelectSource("all")}
              className={`px-2.5 py-1 rounded-md font-medium text-xs transition-colors ${
                selectedSource === "all"
                  ? "bg-white/[0.1] text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              All
            </button>
            <button
              onClick={() => onSelectSource("heuristic")}
              className={`px-2.5 py-1 rounded-md font-medium text-xs transition-colors ${
                selectedSource === "heuristic"
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Oracle
            </button>
            <button
              onClick={() => onSelectSource("qwen_swarm")}
              className={`px-2.5 py-1 rounded-md font-medium text-xs transition-colors ${
                selectedSource === "qwen_swarm"
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Swarm
            </button>
          </div>
        )}
      </div>

      {/* Comparison Summary Banner (Only if Swarm data is present) */}
      {comparisonData.length > 1 && (
        <div className="mb-3 px-3 py-1.5 rounded-lg bg-[#0a0a0a] border border-indigo-500/20 flex items-center justify-between text-xs">
          <span className="text-zinc-400 text-[11px]">Swarm Consensus:</span>
          <div className="flex items-center gap-3 text-xs">
            {comparisonData.map((item) => (
              <span key={item.source} className="flex items-center gap-1 text-[11px]">
                <span className="text-zinc-400 capitalize">{item.source.replace("_", " ")}:</span>
                <span className="font-mono text-white font-medium">{(item.avg_att * 100).toFixed(1)}%</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Chart Canvas with explicit height to prevent Recharts collapse */}
      <div className="w-full h-[320px] flex-1">
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
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
              <XAxis dataKey="time" stroke="#52525b" tick={{ fontSize: 11, fill: "#71717a" }} />
              <YAxis domain={[0, 1]} stroke="#52525b" tick={{ fontSize: 11, fill: "#71717a" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#050505",
                  borderColor: "#222222",
                  borderRadius: "8px",
                  fontSize: "11px",
                  color: "#ffffff"
                }}
                formatter={(value: any, name: any) => [
                  typeof value === "number" ? `${(value * 100).toFixed(1)}%` : value,
                  name
                ]}
              />
              <Legend
                verticalAlign="bottom"
                height={32}
                iconType="circle"
                wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
              />
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
                stroke="#e4e4e7"
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
            <Activity className="w-8 h-8 text-zinc-600 mb-2" />
            <span>Ingesting ClickHouse frame telemetry...</span>
          </div>
        )}
      </div>
    </div>
  );
};
