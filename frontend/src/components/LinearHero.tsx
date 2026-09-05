"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Film, Play, Sparkles, Database, Terminal, Activity } from "lucide-react";

export const LinearHero: React.FC = () => {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden font-inter">
      {/* Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-6xl mx-auto px-6 flex flex-col items-center text-center relative z-10">
        {/* Headline */}
        <h1 className="font-bold text-4xl sm:text-5xl md:text-7xl tracking-[-0.03em] text-white max-w-4xl leading-[1.08]">
          The autonomous cinema engine for{" "}
          <span className="bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
            showrunners
          </span>{" "}
          and{" "}
          <span className="bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
            RL policies.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg md:text-xl text-zinc-400 max-w-2xl leading-relaxed">
          Driven by ClickHouse Cloud retention oracles, Google ADK Showrunner supervision, and multi-modal Qwen 2.5-VL audience swarms.
        </p>

        {/* Action CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3.5 w-full justify-center">
          <Link
            href="/studio"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-white text-black hover:bg-zinc-200 transition-colors shadow-lg active:scale-[0.98]"
          >
            <span>Launch Studio Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <a
            href="#benchmark"
            className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-3 rounded-xl font-medium text-sm bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/[0.08] hover:border-white/[0.16] transition-colors active:scale-[0.98]"
          >
            <span>5,000-Ep PPO Benchmark (0.7301)</span>
          </a>
        </div>

        {/* Real-Time Telemetry Badges */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-xs text-zinc-500">
          <span>ClickHouse Cloud (8.2ms P99)</span>
          <span className="text-zinc-700">•</span>
          <span>Google ADK Showrunner (Veo 3.1)</span>
          <span className="text-zinc-700">•</span>
          <span>Qwen 2.5-VL Swarm (2 FPS)</span>
        </div>

        {/* Studio Dashboard Showcase */}
        <div className="mt-14 w-full max-w-5xl rounded-2xl border border-white/[0.1] bg-[#090a0c] p-4 shadow-2xl backdrop-blur-xl relative group text-left">
          {/* Subtle Frame Glow */}
          <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-indigo-500/10 via-white/[0.02] to-transparent pointer-events-none" />

          {/* Dashboard Top Navigation Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.07] mb-4 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-md bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
                <Film className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <span className="font-semibold text-white tracking-tight">STUDIO</span>
              <span className="text-zinc-600">/</span>
              <span className="text-zinc-400 font-mono text-[11px]">ep_production_final</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium font-mono">
                PPO CONVERGED (0.7301)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-[11px] rounded-lg bg-white/[0.03] text-zinc-400 border border-white/[0.06] font-mono">
                <Database className="w-3 h-3 text-indigo-400" /> ClickHouse Cloud (8.2ms)
              </span>
              <Link
                href="/studio"
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-white text-black font-medium text-xs hover:bg-zinc-200 transition-colors shadow-sm"
              >
                <span>Launch Studio</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* 4 Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
            <div className="bg-[#0c0d10] border border-white/[0.06] rounded-xl p-3">
              <span className="text-[11px] text-zinc-500 uppercase tracking-wider block">Mean Attention</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-lg font-bold font-mono text-white tracking-tight">73.0%</span>
                <span className="text-[11px] font-semibold text-emerald-400">+14.2%</span>
              </div>
            </div>
            <div className="bg-[#0c0d10] border border-white/[0.06] rounded-xl p-3">
              <span className="text-[11px] text-zinc-500 uppercase tracking-wider block">Worst Drop</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-lg font-bold font-mono text-zinc-200 tracking-tight">-4.1%</span>
                <span className="text-[11px] font-semibold text-emerald-400">Stabilized</span>
              </div>
            </div>
            <div className="bg-[#0c0d10] border border-white/[0.06] rounded-xl p-3">
              <span className="text-[11px] text-zinc-500 uppercase tracking-wider block">Showrunner Action</span>
              <div className="truncate mt-1 text-xs font-semibold text-indigo-400">
                Veo Cutaway
              </div>
            </div>
            <div className="bg-[#0c0d10] border border-white/[0.06] rounded-xl p-3">
              <span className="text-[11px] text-zinc-500 uppercase tracking-wider block">Audience Reward</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-lg font-bold font-mono text-emerald-400 tracking-tight">0.7301</span>
                <span className="text-[11px] font-semibold text-emerald-400">+0.2800</span>
              </div>
            </div>
          </div>

          {/* Video Player + Timeline */}
          <div className="bg-[#050607] rounded-xl border border-white/[0.07] p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-zinc-400 pb-2 border-b border-white/[0.05]">
              <span className="flex items-center gap-1.5 text-zinc-200">
                <Play className="w-3 h-3 text-indigo-400 fill-current" /> Rough Cut Assembly #4
              </span>
              <span className="font-mono text-zinc-500">1280x720 • 24fps • H.264</span>
            </div>

            <div className="my-3 aspect-video bg-gradient-to-br from-[#0c0d12] via-[#07080a] to-[#040507] rounded-lg border border-white/[0.05] relative flex flex-col items-center justify-center overflow-hidden">
              <div className="text-center space-y-1.5">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-medium">
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  Veo 3.1 B-Roll Cutaway Injected
                </div>
                <div className="text-xs text-zinc-400">
                  Macro close-up inserted at frame 180 to resolve standoff bottleneck
                </div>
              </div>

              <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-xs font-mono text-zinc-400 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/[0.08]">
                <span>00:00:14.240</span>
                <div className="flex-1 mx-3 h-1 rounded-full bg-white/[0.1] relative overflow-hidden">
                  <div className="w-2/3 h-full bg-indigo-500 rounded-full" />
                </div>
                <span>00:00:22.000</span>
              </div>
            </div>

            {/* Multi-Track Timeline Bar */}
            <div className="space-y-1 pt-2 border-t border-white/[0.05] text-xs">
              <div className="text-zinc-500 flex justify-between font-mono text-[11px]">
                <span>V1 Video Track</span>
                <span>22.0s Total Arc</span>
              </div>
              <div className="flex items-center gap-1 text-[11px]">
                <div className="flex-1 h-6 rounded bg-white/[0.06] border border-white/[0.08] text-zinc-300 flex items-center justify-center px-1 truncate">
                  01_intro (4.0s)
                </div>
                <div className="flex-1 h-6 rounded bg-white/[0.06] border border-white/[0.08] text-zinc-300 flex items-center justify-center px-1 truncate">
                  02_dialogue (4.5s)
                </div>
                <div className="flex-1 h-6 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center justify-center px-1 truncate font-semibold">
                  03_veo (3.5s)
                </div>
                <div className="flex-1 h-6 rounded bg-white/[0.06] border border-white/[0.08] text-zinc-300 flex items-center justify-center px-1 truncate">
                  04_standoff (4.5s)
                </div>
                <div className="flex-1 h-6 rounded bg-emerald-950/50 text-emerald-300 border border-emerald-500/30 flex items-center justify-center px-1 truncate font-medium">
                  05_climax (5.5s)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
