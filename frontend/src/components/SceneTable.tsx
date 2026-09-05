"use client";

import React, { useState } from "react";
import { Table, CheckCircle, AlertTriangle, Film, Sparkles, Clock, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface Clip {
  clip_id: string;
  scene_id: string;
  take_id: string;
  duration_seconds?: number;
  duration?: number;
  duration_frames?: number;
  fps?: number;
  is_broll?: boolean;
  description?: string;
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

  const getDuration = (s: any): number => {
    if (typeof s?.duration_seconds === "number" && !isNaN(s.duration_seconds)) return s.duration_seconds;
    if (typeof s?.duration === "number" && !isNaN(s.duration)) return s.duration;
    if (typeof s?.duration_frames === "number" && s?.fps) return s.duration_frames / s.fps;
    return 4.0;
  };

  const steps = clips.length > 0 ? clips : [
    { clip_id: "shot_01_intro", scene_id: "intro", take_id: "take_1", duration_seconds: 4.0, is_broll: false, description: "Opening Establishing Shot" },
    { clip_id: "shot_02_dialogue", scene_id: "dialogue", take_id: "take_2", duration_seconds: 4.5, is_broll: false, description: "Tense Character Exchange" },
    { clip_id: "shot_03_standoff", scene_id: "standoff", take_id: "take_1", duration_seconds: 6.0, is_broll: false, description: "Pacing Bottleneck Sequence" },
    { clip_id: "broll_veo_cutaway", scene_id: "standoff", take_id: "veo_3.1", duration_seconds: 2.0, is_broll: true, description: "Showrunner Veo 3.1 B-Roll Cutaway" },
    { clip_id: "shot_05_climax", scene_id: "climax", take_id: "take_1", duration_seconds: 5.5, is_broll: false, description: "Climactic Breakthrough Action" },
  ];

  const totalDuration = steps.reduce((acc, s) => acc + getDuration(s), 0);

  return (
    <div className="bg-[#050505] border border-[#1a1a1a] rounded-xl p-5 flex flex-col h-full font-inter">
      {/* Header - Vercel Segmented Control */}
      <div className="flex items-center justify-between pb-3.5 border-b border-[#1a1a1a] mb-3">
        <div className="flex items-center gap-1 bg-[#0a0a0a] border border-[#222222] rounded-lg p-0.5 text-xs">
          <button
            onClick={() => setActiveTab("scenes")}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${
              activeTab === "scenes"
                ? "bg-white/[0.1] text-white shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Scenes
          </button>
          <button
            onClick={() => setActiveTab("durations")}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${
              activeTab === "durations"
                ? "bg-white/[0.1] text-white shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Durations
          </button>
          <button
            onClick={() => setActiveTab("flow")}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${
              activeTab === "flow"
                ? "bg-white/[0.1] text-white shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Audience Flow
          </button>
        </div>

        <span className="text-xs text-zinc-400">
          {steps.length} Shots • <span className="font-mono text-zinc-300">{totalDuration.toFixed(1)}s</span> Total
        </span>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#1a1a1a] text-zinc-400">
              <th className="pb-2.5 font-medium">Shot / Sequence</th>
              {activeTab === "scenes" && (
                <>
                  <th className="pb-2.5 font-medium">Take</th>
                  <th className="pb-2.5 font-medium">Duration</th>
                  <th className="pb-2.5 font-medium">Type</th>
                  <th className="pb-2.5 font-medium text-right">Pacing Status</th>
                </>
              )}
              {activeTab === "durations" && (
                <>
                  <th className="pb-2.5 font-medium">Runtime</th>
                  <th className="pb-2.5 font-medium">Share of Total</th>
                  <th className="pb-2.5 font-medium">Timeline Bar</th>
                  <th className="pb-2.5 font-medium text-right">Directorial Note</th>
                </>
              )}
              {activeTab === "flow" && (
                <>
                  <th className="pb-2.5 font-medium">Consensus Attention</th>
                  <th className="pb-2.5 font-medium">Retention Flow</th>
                  <th className="pb-2.5 font-medium">Momentum</th>
                  <th className="pb-2.5 font-medium text-right">State</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#141414]">
            {steps.map((c, idx) => {
              const isBottleneck = c.clip_id === worstClipId;
              const isBroll = c.is_broll;
              const dur = getDuration(c);
              const sharePct = totalDuration > 0 ? Math.round((dur / totalDuration) * 100) : 20;

              let attention = 0.74;
              let delta = "+12% Recov";
              let isPos = true;

              if (idx === 0) {
                attention = 0.78;
                delta = "100% Start";
                isPos = true;
              } else if (idx === 1) {
                attention = 0.68;
                delta = "-8% Drop";
                isPos = false;
              } else if (idx === 2) {
                attention = isBottleneck ? 0.48 : 0.65;
                delta = isBottleneck ? "-26% Drag" : "-4% Normal";
                isPos = false;
              } else if (idx === 3 && isBroll) {
                attention = 0.85;
                delta = "+34% Boost";
                isPos = true;
              } else if (idx === steps.length - 1) {
                attention = 0.89;
                delta = "+18% Climax";
                isPos = true;
              }

              return (
                <tr key={`${c.clip_id}-${idx}`} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 font-medium text-zinc-200">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${isBottleneck ? "bg-rose-500" : isBroll ? "bg-indigo-400" : "bg-sky-400"}`} />
                      <span className="font-mono text-xs text-white">{c.clip_id}</span>
                    </div>
                  </td>

                  {activeTab === "scenes" && (
                    <>
                      <td className="py-3 text-zinc-400 font-mono text-xs">
                        {c.take_id || "take_1"}
                      </td>
                      <td className="py-3 text-zinc-300 font-mono text-xs">
                        {dur.toFixed(1)}s
                      </td>
                      <td className="py-3">
                        {isBroll ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                            <Sparkles className="w-3 h-3 text-indigo-400" /> Veo B-Roll
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#141414] text-zinc-300 border border-[#262626]">
                            <Film className="w-3 h-3 text-zinc-400" /> Narrative
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        {isBottleneck ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/15 text-rose-300 border border-rose-500/30">
                            <AlertTriangle className="w-3 h-3 text-rose-400" /> Bottleneck
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle className="w-3 h-3 text-emerald-400" /> Sustained
                          </span>
                        )}
                      </td>
                    </>
                  )}

                  {activeTab === "durations" && (
                    <>
                      <td className="py-3 text-zinc-300 font-mono text-xs font-semibold">
                        {dur.toFixed(1)}s
                      </td>
                      <td className="py-3 text-zinc-400 font-mono text-xs">
                        {sharePct}%
                      </td>
                      <td className="py-3">
                        <div className="w-28 h-1.5 rounded-full bg-[#1a1a1a] overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isBottleneck ? "bg-rose-500" : isBroll ? "bg-indigo-500" : "bg-sky-500"}`}
                            style={{ width: `${Math.min(sharePct * 2.5, 100)}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3 text-right text-zinc-400 text-xs">
                        {isBottleneck ? "Needs trim / cutaway" : isBroll ? "Veo 3.1 B-Roll Insert" : "Optimal pacing"}
                      </td>
                    </>
                  )}

                  {activeTab === "flow" && (
                    <>
                      <td className="py-3 font-mono text-xs text-white">
                        {(attention * 100).toFixed(1)}%
                      </td>
                      <td className="py-3">
                        <div className="w-28 h-1.5 rounded-full bg-[#1a1a1a] overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isBottleneck ? "bg-rose-500" : isBroll ? "bg-indigo-400" : "bg-emerald-400"}`}
                            style={{ width: `${attention * 100}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-medium ${
                            isPos
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }`}
                        >
                          {isPos ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                          {delta}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {isBottleneck ? (
                          <span className="text-rose-400 text-[11px] font-medium">Attention Drag</span>
                        ) : isBroll ? (
                          <span className="text-indigo-300 text-[11px] font-medium">Retention Boost</span>
                        ) : (
                          <span className="text-emerald-400 text-[11px] font-medium">Flowing</span>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
