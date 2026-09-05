"use client";

import React from "react";
import { Play, SkipForward, Sparkles, RefreshCw, Users, Terminal, Cpu } from "lucide-react";

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
    <header className="bg-[#000000]/95 backdrop-blur-md border-b border-white/[0.08] px-6 py-3.5 sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between">
        {/* Brand & Mission Title */}
        <div className="flex items-center gap-3.5">
          <div className="relative group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/80 via-white/10 to-cyan-500/80 p-px shadow-lg shadow-amber-500/10">
              <div className="w-full h-full bg-[#050505] rounded-[11px] flex items-center justify-center font-mono font-bold text-xs tracking-tighter text-amber-400 group-hover:text-amber-300 transition-colors">
                NC
              </div>
            </div>
            <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-black" title="System Online" />
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                <span>NEURO-CUT</span>
                <span className="text-[10px] text-white/40 font-mono font-normal">v1.2.0</span>
              </h1>
              <span className="px-2 py-0.5 text-[9px] font-mono font-semibold tracking-wider uppercase rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                P1 + P2 + P3 COMPLETE
              </span>
            </div>
            <p className="text-[11px] text-white/40 font-mono flex items-center gap-1.5">
              <span>ClickHouse Reward Oracle</span>
              <span className="text-white/20">•</span>
              <span>Qwen 2.5 Swarm</span>
              <span className="text-white/20">•</span>
              <span>PPO Policy</span>
              <span className="text-white/20">•</span>
              <span>Showrunner Agent</span>
            </p>
          </div>
        </div>

        {/* Action Controls Deck */}
        <div className="flex items-center gap-2">
          {/* Policy Toggle */}
          {onToggleOptimizer && (
            <div className="flex items-center bg-[#0a0a0c] border border-white/[0.08] rounded-lg p-1 text-[11px] font-mono mr-1 shadow-inner">
              <button
                onClick={() => onToggleOptimizer("beam_search")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all duration-150 ${
                  optimizerMode === "beam_search"
                    ? "bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/40 shadow-sm"
                    : "text-white/40 hover:text-white/80"
                }`}
                title="Phase 1: Deterministic Beam Search Standard (0.6730)"
              >
                <Cpu className="w-3 h-3" />
                <span>Beam Search</span>
              </button>
              <button
                onClick={() => onToggleOptimizer("ppo")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all duration-150 ${
                  optimizerMode === "ppo"
                    ? "bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/40 shadow-sm"
                    : "text-white/40 hover:text-white/80"
                }`}
                title="Phase 3: Self-Optimizing PPO RL Policy (0.7301)"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>PPO Policy</span>
              </button>
            </div>
          )}

          {/* Run Optimization Button */}
          <button
            onClick={onRunOptimization}
            disabled={isRunning}
            className={`group relative flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 active:scale-[0.98] ${
              isRunning
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 cursor-not-allowed"
                : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-lg shadow-amber-500/20 hover:shadow-amber-500/35 border border-amber-400/50"
            }`}
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Optimizing Timeline...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current transition-transform group-hover:scale-110" />
                <span>Run Optimization Loop</span>
              </>
            )}
          </button>

          {/* Single Step Button */}
          <button
            onClick={onStepOptimization}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-white/[0.04] hover:bg-white/[0.08] text-white/80 hover:text-white border border-white/[0.08] hover:border-white/[0.18] transition-all duration-150 active:scale-[0.98] disabled:opacity-40"
            title="Execute one discrete trim/swap step"
          >
            <SkipForward className="w-3.5 h-3.5 text-white/60" />
            <span>Single Step</span>
          </button>

          {/* Qwen Swarm Preview Button */}
          <button
            onClick={onRunSwarm}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-purple-950/30 hover:bg-purple-900/50 text-purple-300 border border-purple-500/30 hover:border-purple-500/50 transition-all duration-150 active:scale-[0.98] disabled:opacity-40"
            title="Fast local CPU simulated audience preview across 4 personas"
          >
            <Users className="w-3.5 h-3.5 text-purple-400" />
            <span>Qwen Swarm (Preview)</span>
          </button>

          {/* Colab T4 GPU Link */}
          <a
            href="https://colab.research.google.com/github/AmanM006/neurocut/blob/main/notebooks/qwen_swarm_colab.ipynb"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono text-white/70 hover:text-white bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] hover:border-white/[0.18] transition-all duration-150 active:scale-[0.98]"
            title="Launch Real Qwen2.5-VL 3B Model on free NVIDIA T4 GPU in Google Colab"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>Colab T4 GPU</span>
          </a>

          {/* Force Showrunner Button */}
          <button
            onClick={onForceIntervention}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-600/90 to-rose-600/90 hover:from-amber-500 hover:to-rose-500 text-white shadow-md shadow-rose-950/40 border border-amber-500/40 hover:border-amber-400 transition-all duration-150 active:scale-[0.98] disabled:opacity-40"
            title="Manually trigger Google ADK Showrunner Veo 3.1 B-Roll generation"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Force Showrunner</span>
          </button>

          {/* Reset Episode Button */}
          <button
            onClick={onResetEpisode}
            disabled={isRunning}
            className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/[0.1] transition-all duration-150 active:scale-95"
            title="Reset Episode"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
