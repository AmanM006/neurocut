"use client";

import React, { useState } from "react";
import { Sparkles, Play, SkipForward, Users, RefreshCw, AlertTriangle, ArrowRight, CheckCircle2, Zap, ArrowDownRight, ArrowUpRight } from "lucide-react";

interface Clip {
 clip_id: string;
 scene_id: string;
 take_id: string;
 duration_seconds: number;
 is_broll: boolean;
 description: string;
}

interface PacingFunnelCardProps {
 clips: Clip[];
 worstClipId: string | null;
 reward: number;
 isRunning: boolean;
 onRunOptimization: () => void;
 onStepOptimization: () => void;
 onForceIntervention: () => void;
 onRunSwarm: () => void;
 onResetEpisode: () => void;
 showrunnerReasoning?: string;
 optimizerMode: "beam_search" | "ppo";
}

export const PacingFunnelCard: React.FC<PacingFunnelCardProps> = ({
 clips,
 worstClipId,
 reward,
 isRunning,
 onRunOptimization,
 onStepOptimization,
 onForceIntervention,
 onRunSwarm,
 onResetEpisode,
 showrunnerReasoning,
 optimizerMode
}) => {
 const [promptText, setPromptText] = useState(
 showrunnerReasoning ||
 "I want to know what caused the drop-off in the standoff sequence and inject B-roll"
 );

 // Define steps from clips or canonical sequence
 const steps = clips.length > 0 ? clips : [
 { clip_id: "shot_01_intro", scene_id: "intro", take_id: "take_1", duration_seconds: 4.0, is_broll: false, description: "Opening Establishing Shot" },
 { clip_id: "shot_02_dialogue", scene_id: "dialogue", take_id: "take_2", duration_seconds: 4.5, is_broll: false, description: "Tense Character Exchange" },
 { clip_id: "shot_03_standoff", scene_id: "standoff", take_id: "take_1", duration_seconds: 6.0, is_broll: false, description: "Pacing Bottleneck Sequence" },
 { clip_id: "broll_veo_cutaway", scene_id: "standoff", take_id: "veo_3.1", duration_seconds: 2.0, is_broll: true, description: "Showrunner Veo 3.1 B-Roll Cutaway" },
 { clip_id: "shot_05_climax", scene_id: "climax", take_id: "take_1", duration_seconds: 5.5, is_broll: false, description: "Climactic Breakthrough Action" },
 ];

  const getDuration = (s: any) =>
    typeof s?.duration_seconds === "number" && !isNaN(s.duration_seconds)
      ? s.duration_seconds
      : typeof s?.duration === "number"
      ? s.duration
      : typeof s?.duration_frames === "number" && s?.fps
      ? s.duration_frames / s.fps
      : 4.0;

  const totalDuration = steps.reduce((acc, s) => acc + getDuration(s), 0);

 return (
 <div className="bg-[#0c0c0e] border border-white/[0.08] rounded-3xl p-5 sm:p-7 flex flex-col justify-between shadow-2xl relative overflow-hidden group">
 {/* Top Header */}
 <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] mb-6">
 <div>
 <h3 className="font-inter font-bold text-base text-white tracking-tight flex items-center gap-2">
 <span>Scene-by-Scene Pacing &amp; Retention Funnel</span>
 <span className="text-[10px] font-berkeley px-2 py-0.5 rounded-full bg-white/[0.05] text-zinc-400 border border-white/[0.08]">
 {steps.length} Scenes
 </span>
 </h3>
 <p className="text-xs text-zinc-400 font-inter mt-0.5">
 ClickHouse frame-level drop-off telemetry • Conversion across narrative arcs
 </p>
 </div>

 <div className="flex items-center gap-2 font-berkeley text-xs">
 <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/[0.03] text-zinc-300 border border-white/[0.07]">
 <span>Total Arc:</span>
 <span className="font-bold text-white">{totalDuration.toFixed(1)}s</span>
 </span>
 <span className="px-3 py-1 rounded-xl bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-bold">
 Reward: {(reward || 0).toFixed(4)}
 </span>
 </div>
 </div>

 {/* Sequential 3D Step Funnel (Modeled on Zentra Payments in reference image) */}
 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 my-2">
 {steps.map((step, idx) => {
 const isBottleneck = step.clip_id === worstClipId;
 const isBroll = step.is_broll;
 
 // Simulated attention scores matching empirical trace
 let attentionScore = 0.71;
 let deltaText = "100% Start";
 let isPositive = true;

 if (idx === 1) {
 attentionScore = 0.65;
 deltaText = "-8% Drop";
 isPositive = false;
 } else if (idx === 2) {
 attentionScore = isBottleneck ? 0.48 : 0.62;
 deltaText = isBottleneck ? "-26% Drag" : "-4% Normal";
 isPositive = false;
 } else if (idx === 3) {
 attentionScore = isBroll ? 0.82 : 0.74;
 deltaText = isBroll ? "+34% Flow" : "+12% Recov";
 isPositive = true;
 } else if (idx === 4) {
 attentionScore = 0.88;
 deltaText = "+14% Peak";
 isPositive = true;
 }

 // Height of the 3D step bar
 const barHeightPct = Math.max(Math.round(attentionScore * 100), 30);

 return (
 <div
 key={`${step.clip_id}-${idx}`}
 className={`rounded-2xl border p-3.5 flex flex-col justify-between transition-all duration-200 relative group/step ${
 isBottleneck
 ? "bg-gradient-to-b from-rose-950/40 via-[#0e0c0d] to-[#0c0c0e] border-rose-500/40 shadow-lg shadow-rose-950/20"
 </div>

 {/* 3D Striped Visual Funnel Column */}
 <div className="my-3 h-24 w-full bg-black/40 rounded-xl border border-white/[0.05] p-1 flex flex-col justify-end overflow-hidden relative">
 {/* 3D Isometric / Striped Box */}
 <div
 style={{ height: `${barHeightPct}%` }}
 className={`w-full rounded-lg transition-all duration-500 relative overflow-hidden ${
 isBottleneck
 ? "bg-gradient-to-t from-rose-600 via-rose-500 to-rose-400 shadow-md shadow-rose-500/30"
 : isBroll
 ? "bg-gradient-to-t from-indigo-600 via-indigo-500 to-indigo-400 shadow-md shadow-indigo-500/30"
 : "bg-gradient-to-t from-blue-600 via-cyan-500 to-cyan-400 shadow-md shadow-cyan-500/20"
 }`}
 >
 {/* Diagonal Hatch / Stripe Pattern */}
 <div
 className="absolute inset-0 opacity-25"
 style={{
 backgroundImage:
 "repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.4) 4px, rgba(255,255,255,0.4) 8px)"
 }}
 />
 </div>
 </div>

 {/* Step Footer Badge */}
 <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between text-[10px] font-berkeley">
 <span
 className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full font-semibold ${
 isPositive
 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
 : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
 }`}
 >
 {isPositive ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
 {deltaText}
 </span>

 <span className="text-zinc-500">
 {isBroll ? "Veo Cut" : isBottleneck ? "Drop" : "Flow"}
 </span>
 </div>
 </div>
 );
 })}
 </div>

      {/* Embedded Floating Showrunner AI Prompt Bar (Exact match to reference image) */}
      <div className="mt-5 p-3 sm:p-4 rounded-2xl bg-[#121316] border border-white/[0.1] shadow-xl backdrop-blur-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Left: Interactive Prompt */}
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-berkeley text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <span>What would you like to explore next?</span>
            <span className="text-zinc-600">•</span>
            <span className="text-indigo-400 font-medium">Showrunner Directive</span>
          </div>
          <input
            type="text"
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            className="w-full bg-transparent font-inter text-xs text-white placeholder-zinc-500 outline-none mt-1 truncate"
            placeholder="Ask Showrunner to trim, inject B-roll, or run PPO policy..."
          />
        </div>

        {/* Right: Embedded Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 overflow-x-auto pb-1 sm:pb-0">
          {/* Optimize Cut */}
          <button
            onClick={onRunOptimization}
            disabled={isRunning}
            className={`px-3.5 py-1.5 rounded-xl font-berkeley text-xs font-semibold transition-all duration-150 active:scale-[0.98] ${
              isRunning
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 cursor-not-allowed"
                : "bg-white text-black hover:bg-zinc-200 shadow-md active:scale-[0.98]"
            }`}
          >
            {isRunning ? "Optimizing..." : "Optimize Cut"}
          </button>

          {/* Single Step */}
          <button
            onClick={onStepOptimization}
            disabled={isRunning}
            className="px-2.5 py-1.5 rounded-xl font-berkeley text-xs bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/[0.08] transition-all"
            title="Execute one discrete trim/swap step"
          >
            Step
          </button>

          {/* Qwen Swarm */}
          <button
            onClick={onRunSwarm}
            disabled={isRunning}
            className="px-2.5 py-1.5 rounded-xl font-berkeley text-xs bg-white/[0.04] hover:bg-white/[0.08] text-purple-300 hover:text-purple-200 border border-purple-500/30 transition-all"
            title="Evaluate Qwen 2.5-VL 2 FPS audience swarm"
          >
            Swarm
          </button>

          {/* Cutaway Override */}
          <button
            onClick={onForceIntervention}
            disabled={isRunning}
            className="px-2.5 py-1.5 rounded-xl font-berkeley text-xs bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 transition-all"
            title="Force Veo 3.1 B-Roll Cutaway"
          >
            Cutaway
          </button>

          {/* Reset */}
          <button
            onClick={onResetEpisode}
            disabled={isRunning}
            className="px-2.5 py-1.5 rounded-xl font-berkeley text-xs text-zinc-400 hover:text-white bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] transition-all"
            title="Reset Episode"
          >
            Reset
          </button>
        </div>
      </div>
 </div>
 );
};
