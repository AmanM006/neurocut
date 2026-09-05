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
            <span className="text-xs font-mono text-amber-400 font-semibold">
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-150 ${
                optimizerMode === "beam_search"
                  ? "bg-white/[0.1] text-white font-semibold border border-white/[0.12] shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
              title="Phase 1: Deterministic Beam Search Baseline (22.0s • 0.6730)"
            >
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              <span>Beam Search (22.0s)</span>
            </button>
            <button
              onClick={() => onToggleOptimizer("ppo")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-150 ${
                optimizerMode === "ppo"
                  ? "bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
              title="Phase 3: Autonomous PPO RL Policy (8.5s • 0.7301)"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>PPO Policy (8.5s)</span>
            </button>
          </div>
        )}

        {/* Right: Actions Deck (Raycast Floating Pill Action Buttons) */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end overflow-x-auto pb-1 md:pb-0">
          {/* Primary Action Button: Optimize Cut */}
          <button
            onClick={onRunOptimization}
            disabled={isRunning}
            className={`group flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all duration-200 active:scale-[0.98] ${
              isRunning
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 cursor-not-allowed"
                : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 border border-amber-400/40"
            }`}
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Optimizing...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current transition-transform group-hover:scale-110" />
                <span>Optimize Cut</span>
              </>
            )}
          </button>

          {/* Single Step Button */}
          <button
            onClick={onStepOptimization}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono bg-white/[0.03] hover:bg-white/[0.07] text-zinc-300 hover:text-white border border-white/[0.07] hover:border-white/[0.15] transition-all active:scale-[0.98] disabled:opacity-40"
            title="Execute one discrete trim or swap step"
          >
            <SkipForward className="w-3.5 h-3.5 text-zinc-400" />
            <span>Step</span>
          </button>

          {/* Qwen Swarm Preview Button */}
          <button
            onClick={onRunSwarm}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono bg-white/[0.03] hover:bg-white/[0.07] text-zinc-300 hover:text-white border border-white/[0.07] hover:border-white/[0.15] transition-all active:scale-[0.98] disabled:opacity-40"
            title="Evaluate 2 FPS audience telemetry swarm"
          >
            <Users className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Qwen Swarm</span>
          </button>

          {/* Colab Link */}
          <a
            href="https://colab.research.google.com/github/AmanM006/neurocut/blob/main/notebooks/qwen_swarm_colab.ipynb"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-mono bg-white/[0.02] hover:bg-white/[0.06] text-zinc-400 hover:text-zinc-200 border border-white/[0.06] transition-all"
            title="Launch Real Qwen2.5-VL 3B Model on NVIDIA T4 GPU"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>Colab T4</span>
          </a>

          {/* Force Showrunner B-Roll Button */}
          <button
            onClick={onForceIntervention}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono bg-white/[0.03] hover:bg-white/[0.07] text-amber-300 hover:text-amber-200 border border-amber-500/20 hover:border-amber-500/40 transition-all active:scale-[0.98] disabled:opacity-40"
            title="Trigger Veo 3.1 B-Roll injection"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Cutaway</span>
          </button>

          {/* Reset Episode */}
          <button
            onClick={onResetEpisode}
            disabled={isRunning}
            className="p-1.5 rounded-xl text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04] border border-transparent hover:border-white/[0.08] transition-all active:scale-95"
            title="Reset Episode"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
