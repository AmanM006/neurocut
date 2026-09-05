"use client";

import React from "react";
import { Play, SkipForward, Sparkles, RefreshCw, Users, Terminal, Cpu, ShieldCheck } from "lucide-react";

interface ControlsProps {
 isRunning: boolean;
 onRunOptimization: () => void;
 onStepOptimization: () => void;
 onForceIntervention: () => void;
 onRunSwarm: () => void;
 onResetEpisode: () => void;
 episodeId: string;
 clickhouseMode: string;
 optimizerMode?: "beam_search" | "ppo";
 onToggleOptimizer?: (mode: "beam_search" | "ppo") => void;
}

export const Controls: React.FC<ControlsProps> = ({
 isRunning,
 onRunOptimization,
 onStepOptimization,
 onForceIntervention,
 onRunSwarm,
 onResetEpisode,
 episodeId,
 clickhouseMode,
 optimizerMode = "beam_search",
 onToggleOptimizer
}) => {
 return (
 <header className="sticky top-0 z-50 py-3 px-4 lg:px-6 bg-[#08080a]/90 backdrop-blur-xl border-b border-white/[0.06]">
 <div className="max-w-[1680px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
 {/* Left: Breadcrumbs & Agent Status */}
 <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
 <div className="flex items-center gap-2">
 <span className="text-xs font-mono font-bold tracking-tight text-white">
 NEURO-CUT
 </span>
 <span className="text-zinc-600 font-mono text-xs">/</span>
 <span className="text-xs font-mono text-zinc-400">
 AGENTIC STUDIO
 </span>
 <span className="text-zinc-600 font-mono text-xs">/</span>
 <span className="text-xs font-mono text-indigo-400 font-semibold">
 {optimizerMode === "ppo" ? "PPO POLICY" : "BEAM SEARCH"}
 </span>
 </div>

 <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
 <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
 ONLINE
 </span>
 </div>

        {/* Center: Segmented Sliding Toggle (Raycast Pill Style) */}
        {onToggleOptimizer && (
          <div className="flex items-center bg-[#0c0c0e] border border-white/[0.08] rounded-xl p-1 shadow-inner text-xs font-mono">
            <button
              onClick={() => onToggleOptimizer("beam_search")}
              className={`px-3 py-1.5 rounded-lg transition-all duration-150 ${
                optimizerMode === "beam_search"
                  ? "bg-white text-black font-semibold shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="Phase 1: Deterministic Beam Search Baseline (22.0s • 0.6730)"
            >
              Beam Search (22.0s)
            </button>
            <button
              onClick={() => onToggleOptimizer("ppo")}
              className={`px-3 py-1.5 rounded-lg transition-all duration-150 ${
                optimizerMode === "ppo"
                  ? "bg-white text-black font-semibold shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="Phase 3: Autonomous PPO RL Policy (8.5s • 0.7301)"
            >
              PPO Policy (8.5s)
            </button>
          </div>
        )}

        {/* Right: Actions Deck (Raycast Floating Pill Action Buttons) */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end overflow-x-auto pb-1 md:pb-0">
          {/* Primary Action Button: Optimize Cut */}
          <button
            onClick={onRunOptimization}
            disabled={isRunning}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all duration-150 active:scale-[0.98] ${
              isRunning
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 cursor-not-allowed"
                : "bg-white text-black hover:bg-zinc-200 shadow-md active:scale-[0.98]"
            }`}
          >
            {isRunning ? "Optimizing..." : "Optimize Cut"}
          </button>

          {/* Single Step Button */}
          <button
            onClick={onStepOptimization}
            disabled={isRunning}
            className="px-2.5 py-1.5 rounded-xl text-xs font-mono bg-white/[0.03] hover:bg-white/[0.07] text-zinc-300 hover:text-white border border-white/[0.07] transition-all active:scale-[0.98] disabled:opacity-40"
            title="Execute one discrete trim or swap step"
          >
            Step
          </button>

          {/* Qwen Swarm Preview Button */}
          <button
            onClick={onRunSwarm}
            disabled={isRunning}
            className="px-2.5 py-1.5 rounded-xl text-xs font-mono bg-white/[0.03] hover:bg-white/[0.07] text-purple-300 hover:text-purple-200 border border-purple-500/30 transition-all active:scale-[0.98] disabled:opacity-40"
            title="Evaluate 2 FPS audience telemetry swarm"
          >
            Swarm
          </button>

          {/* Force Showrunner B-Roll Button */}
          <button
            onClick={onForceIntervention}
            disabled={isRunning}
            className="px-2.5 py-1.5 rounded-xl text-xs font-mono bg-white/[0.03] hover:bg-white/[0.07] text-indigo-300 hover:text-indigo-200 border border-indigo-500/30 transition-all active:scale-[0.98] disabled:opacity-40"
            title="Trigger Veo 3.1 B-Roll injection"
          >
            Cutaway
          </button>

          {/* Reset Episode */}
          <button
            onClick={onResetEpisode}
            disabled={isRunning}
            className="px-2.5 py-1.5 rounded-xl text-xs font-mono text-zinc-400 hover:text-white bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] transition-all active:scale-95"
            title="Reset Episode"
          >
            Reset
          </button>
        </div>
 </div>
 </header>
 );
};
