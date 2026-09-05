"use client";

import React, { useState } from "react";
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
  const [activeTab, setActiveTab] = useState<"scenes" | "durations" | "flow">("scenes");

  return (
    <div className="bg-[#0c0d0e] border border-white/[0.08] rounded-2xl p-5 flex flex-col h-full shadow-2xl font-inter">
      {/* Header - Vercel Analytics Style */}
      <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.06] mb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-[#060709] border border-white/[0.08] rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setActiveTab("scenes")}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                activeTab === "scenes"
                  ? "bg-white/[0.12] text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Scenes
            </button>
            <button
              onClick={() => setActiveTab("durations")}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                activeTab === "durations"
                  ? "bg-white/[0.12] text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Durations
            </button>
            <button
              onClick={() => setActiveTab("flow")}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                activeTab === "flow"
                  ? "bg-white/[0.12] text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Audience Flow
            </button>
          </div>
        </div>

        <span className="text-xs text-zinc-400 font-medium">
          {clips.length} Active Shots
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/[0.04] text-zinc-400 text-xs">
              <th className="pb-2.5 font-medium">Shot / Scene</th>
              <th className="pb-2.5 font-medium">Take</th>
              <th className="pb-2.5 font-medium">Runtime</th>
              <th className="pb-2.5 font-medium">Type</th>
              <th className="pb-2.5 font-medium text-right">Pacing Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {clips.map((c, idx) => {
              const isBottleneck = c.clip_id === worstClipId;
              const isBroll = c.is_broll;
              return (
                <tr key={`${c.clip_id}-${idx}`} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 font-medium text-zinc-200 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    <span className="truncate max-w-[160px] font-mono text-xs">{c.clip_id}</span>
                  </td>
                  <td className="py-3 text-zinc-400 font-mono text-xs">
                    {c.take_id || "take_1"}
                  </td>
                  <td className="py-3 text-zinc-300 font-mono text-xs">
                    {(typeof c?.duration_seconds === "number" ? c.duration_seconds : 4.0).toFixed(1)}s
                  </td>
                  <td className="py-3">
                    {isBroll ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                        <Sparkles className="w-3 h-3" /> Veo B-Roll
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-white/[0.04] text-zinc-300 border border-white/[0.08]">
                        <Film className="w-3 h-3" /> Narrative
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    {isBottleneck ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/15 text-rose-300 border border-rose-500/30">
                        <AlertTriangle className="w-3 h-3" /> Bottleneck
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle className="w-3 h-3" /> High Flow
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
