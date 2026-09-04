"use client";

import React from "react";
import { Play, SkipForward, Sparkles, RefreshCw, Layers, ShieldCheck } from "lucide-react";

interface ControlsProps {
  isRunning: boolean;
  onRunOptimization: () => void;
  onStepOptimization: () => void;
  onForceIntervention: () => void;
  onResetEpisode: () => void;
  episodeId: string;
  clickhouseMode: string;
}

export const Controls: React.FC<ControlsProps> = ({
  isRunning,
  onRunOptimization,
  onStepOptimization,
  onForceIntervention,
  onResetEpisode,
  episodeId,
  clickhouseMode
}) => {
  return (
    <header className="bg-[#101620]/90 backdrop-blur border-b border-slate-800 px-6 py-3 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand & Mission Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-cyan-500 p-0.5 shadow-lg shadow-amber-500/10">
            <div className="w-full h-full bg-[#0B0F14] rounded-[10px] flex items-center justify-center font-bold text-sm tracking-tighter text-amber-400">
              NC
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white">
                NEURO-CUT
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                PHASE 1 // CORE ENGINE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Agentic Cinema Hackathon • ClickHouse Reward Oracle + ADK Showrunner
            </p>
          </div>
        </div>

        {/* Action Controls Deck */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onRunOptimization}
            disabled={isRunning}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold shadow-md transition-all ${
              isRunning
                ? "bg-cyan-900/50 text-cyan-300 border border-cyan-700/50 cursor-not-allowed"
                : "bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-900/40 hover:shadow-cyan-600/30 active:scale-95"
            }`}
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Optimizing Timeline...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Optimization Loop</span>
              </>
            )}
          </button>

          <button
            onClick={onStepOptimization}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all active:scale-95 disabled:opacity-50"
            title="Execute one discrete trim/swap step"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span>Single Step</span>
          </button>

          <button
            onClick={onForceIntervention}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black shadow-md shadow-amber-900/30 transition-all active:scale-95 disabled:opacity-50"
            title="Manually trigger Google ADK Showrunner Veo B-Roll generation"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Force Showrunner Intervention</span>
          </button>

          <button
            onClick={onResetEpisode}
            disabled={isRunning}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-all"
            title="Reset Episode"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
