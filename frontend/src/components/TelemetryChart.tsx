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
 <div className="bg-[#0c0c0e] border border-white/[0.07] rounded-2xl p-4 sm:p-5 flex flex-col h-full shadow-2xl relative overflow-hidden">
 {/* Top Ambient Glow Accent */}
 <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent pointer-events-none" />

 {/* Header */}
 <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.06] mb-4">
 <div className="flex items-center gap-2.5">
 <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
 <Activity className="w-4 h-4" />
 </div>
 <div>
 <h2 className="text-xs font-semibold tracking-tight text-white font-mono uppercase">
 Audience Retention Curves
 </h2>
 <p className="text-[10px] text-zinc-500 font-mono">
 ClickHouse Window Functions • 50ms Real-Time Oracle
 </p>
 </div>
 </div>

 <div className="flex items-center gap-2">
 {/* Source Filter Tabs */}
 {onSelectSource && (
 <div className="flex items-center bg-[#060608] border border-white/[0.08] rounded-xl p-0.5 text-[11px] font-mono">
 <button
 onClick={() => onSelectSource("all")}
 className={`px-2.5 py-1 rounded-lg transition-all ${
 selectedSource === "all"
 ? "bg-white/[0.1] text-white font-semibold shadow-sm"
 : "text-zinc-500 hover:text-zinc-300"
 }`}
 >
 All
 </button>
 <button
 onClick={() => onSelectSource("heuristic")}
 className={`px-2.5 py-1 rounded-lg transition-all ${
 selectedSource === "heuristic"
 ? "bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30 shadow-sm"
 : "text-zinc-500 hover:text-zinc-300"
 }`}
 >
 Heuristic
 </button>
 <button
 onClick={() => onSelectSource("qwen_swarm")}
 className={`px-2.5 py-1 rounded-lg transition-all ${
 selectedSource === "qwen_swarm"
 ? "bg-purple-500/15 text-purple-300 font-semibold border border-purple-500/30 shadow-sm"
 : "text-zinc-500 hover:text-zinc-300"
 }`}
 >
 Qwen Swarm
 </button>
 </div>
 )}

 <span className="hidden sm:flex items-center gap-1.5 px-2 py-1 text-[10px] font-mono rounded-lg bg-white/[0.03] text-zinc-400 border border-white/[0.06]">
 <Database className="w-3 h-3 text-cyan-400" />
 <span>{clickhouseMode === "cloud" ? "Cloud Live" : "Embedded"}</span>
 </span>
 </div>
 </div>

 {/* Side-by-Side Comparison Banner if Swarm data exists */}
 {comparisonData.length > 1 && (
 <div className="mb-3 px-3 py-2 rounded-xl bg-[#08080c] border border-purple-500/25 flex items-center justify-between text-xs font-mono">
 <span className="text-purple-400 font-medium flex items-center gap-1.5 text-[11px]">
 <Sparkles className="w-3.5 h-3.5" />
 ClickHouse Swarm Consensus:
 </span>
 <div className="flex items-center gap-3 text-zinc-400 text-[10px]">
 {comparisonData.map((item) => (
 <span key={item.source} className="flex items-center gap-1">
 <span className={item.source === "qwen_swarm" ? "text-purple-400 font-bold" : "text-cyan-400 font-bold"}>
 {item.source}:
 </span>
 <span>{item.count_points} pts</span>
 <span className="text-zinc-600">|</span>
 <span>Att: {(item.avg_att * 100).toFixed(1)}%</span>
 </span>
 ))}
 </div>
 </div>
 )}

 {/* Metric Micro-Cards */}
 <div className="grid grid-cols-4 gap-2 mb-3 font-mono">
 <div className="bg-[#08080a] border border-white/[0.05] rounded-xl p-2.5">
 <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">Mean Attention</span>
 <div className="flex items-baseline gap-1 mt-1">
 <span className="text-sm font-bold text-cyan-400">
 {((meanAttention || 0) * 100).toFixed(1)}%
 </span>
 </div>
 </div>

 <div className="bg-[#08080a] border border-white/[0.05] rounded-xl p-2.5">
 <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">Worst Drop</span>
 <div className="flex items-baseline gap-1 mt-1">
 <span className={`text-sm font-bold ${worstDrop < -0.15 ? 'text-rose-400' : 'text-zinc-200'}`}>
 {worstDrop ? (worstDrop * 100).toFixed(1) + '%' : '0.0%'}
 </span>
 </div>
 </div>

 <div className="bg-[#08080a] border border-white/[0.05] rounded-xl p-2.5">
 <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">Bottleneck</span>
 <div className="truncate mt-1 text-xs font-medium text-indigo-400" title={worstClipId || "None"}>
 {worstClipId ? worstClipId.replace("shot_", "") : "Stabilized"}
 </div>
 </div>

 <div className="bg-[#08080a] border border-white/[0.05] rounded-xl p-2.5">
 <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">Scalar Reward</span>
 <div className="flex items-baseline gap-1 mt-1">
 <span className="text-sm font-bold text-emerald-400">
 {(reward || 0).toFixed(4)}
 </span>
 </div>
 </div>
 </div>

 {/* Chart */}
 <div className="flex-1 w-full min-h-[240px]">
 {formattedData.length > 0 ? (
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
 <defs>
 <linearGradient id="colorAttBento" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
 <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
 </linearGradient>
 <linearGradient id="colorArousalBento" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.25} />
 <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
 </linearGradient>
 <linearGradient id="colorLoadBento" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#A855F7" stopOpacity={0.20} />
 <stop offset="95%" stopColor="#A855F7" stopOpacity={0.0} />
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" stroke="#16161c" />
 <XAxis dataKey="time" stroke="#3f3f46" tick={{ fontSize: 10, fill: "#71717a" }} />
 <YAxis domain={[0, 1]} stroke="#3f3f46" tick={{ fontSize: 10, fill: "#71717a" }} />
 <Tooltip
 contentStyle={{
 backgroundColor: "#0c0c0e",
 borderColor: "rgba(255,255,255,0.1)",
 borderRadius: "12px",
 fontSize: "11px",
 fontFamily: "monospace",
 color: "#ffffff",
 boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)"
 }}
 />
 <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
 <Area type="monotone" dataKey="Attention" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorAttBento)" />
 <Area type="monotone" dataKey="Arousal" stroke="#06B6D4" strokeWidth={1.5} fillOpacity={1} fill="url(#colorArousalBento)" />
 <Area type="monotone" dataKey="CognitiveLoad" stroke="#A855F7" strokeWidth={1.5} fillOpacity={1} fill="url(#colorLoadBento)" />
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
