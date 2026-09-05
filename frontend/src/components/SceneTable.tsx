"use client";

import React from "react";
import { Table, CheckCircle, AlertTriangle, Film, Sparkles } from "lucide-react";

interface Clip {
  clip_id: string;
  scene_id: string;
  take_id: string;
  duration_seconds: number;
  is_broll: boolean;
  description: string;
}

interface SceneTableProps {
  clips: Clip[];
  worstClipId: string | null;
  reward: number;
}

export const SceneTable: React.FC<SceneTableProps> = ({
  clips,
  worstClipId,
  reward
}) => {
  return (
    <div className="bg-[#0c0c0e] border border-white/[0.07] rounded-2xl p-4 flex flex-col h-full shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-white/[0.03] text-zinc-300 border border-white/[0.08]">
            <Table className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-zinc-100 tracking-tight">
              Scene-by-Scene Pacing Telemetry
            </h3>
            <p className="text-[10px] text-zinc-500 font-mono">
              ClickHouse Frame Ingestion & Pacing Analysis
            </p>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/[0.03] text-zinc-400 border border-white/[0.08]">
          {clips.length} Active Shots
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left text-[11px] font-mono">
          <thead>
            <tr className="border-b border-white/[0.04] text-zinc-500 text-[10px] uppercase tracking-wider">
              <th className="pb-2 font-medium">Shot / Scene</th>
              <th className="pb-2 font-medium">Take</th>
              <th className="pb-2 font-medium">Runtime</th>
              <th className="pb-2 font-medium">Type</th>
              <th className="pb-2 font-medium text-right">Pacing Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {clips.map((c, idx) => {
              const isBottleneck = c.clip_id === worstClipId;
              const isBroll = c.is_broll;
              return (
                <tr key={`${c.clip_id}-${idx}`} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-2.5 font-medium text-zinc-200 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                    <span className="truncate max-w-[140px]">{c.clip_id}</span>
                  </td>
                  <td className="py-2.5 text-zinc-400">
                    {c.take_id || "take_1"}
                  </td>
                  <td className="py-2.5 text-zinc-300">
                    {(typeof c?.duration_seconds === "number" ? c.duration_seconds : 4.0).toFixed(1)}s
                  </td>
                  <td className="py-2.5">
                    {isBroll ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] bg-purple-500/15 text-purple-300 border border-purple-500/30">
                        <Sparkles className="w-2.5 h-2.5" /> B-Roll
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] bg-zinc-800 text-zinc-300 border border-white/[0.05]">
                        <Film className="w-2.5 h-2.5" /> Narrative
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 text-right">
                    {isBottleneck ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                        <AlertTriangle className="w-2.5 h-2.5" /> Bottleneck
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle className="w-2.5 h-2.5" /> High Flow
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
