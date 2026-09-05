"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Play, Sparkles, Database, Terminal, Activity } from "lucide-react";

export const LinearHero: React.FC = () => {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      {/* Linear Ambient Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-6xl mx-auto px-6 flex flex-col items-center text-center relative z-10">
        {/* Grand Headline */}
        <h1 className="font-inter font-bold text-4xl sm:text-5xl md:text-7xl tracking-[-0.03em] text-white max-w-4xl leading-[1.08]">
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
        <p className="mt-6 text-base sm:text-lg md:text-xl text-zinc-400 font-inter max-w-2xl leading-relaxed">
          Purpose-built for modern cinematic workflows. Driven by ClickHouse Cloud retention oracles, Google ADK Showrunner supervision, and multi-modal Qwen 2.5-VL audience swarms.
        </p>

        {/* Action CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3.5 w-full justify-center">
          <Link
            href="/studio"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-inter font-semibold text-sm bg-white text-black hover:bg-zinc-200 transition-all duration-150 shadow-xl shadow-white/10 active:scale-[0.98]"
          >
            <span>Launch Studio Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <a
            href="#benchmark"
            className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-3 rounded-xl font-inter font-medium text-sm bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/[0.08] hover:border-white/[0.16] transition-all duration-150 active:scale-[0.98]"
          >
            <span>5,000-Ep PPO Benchmark (0.7301)</span>
          </a>
        </div>

        {/* Real-Time Telemetry Badges */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-xs font-berkeley text-zinc-500">
          <span>ClickHouse Cloud (8.2ms P99)</span>
          <span className="text-zinc-700">•</span>
          <span>Google ADK Showrunner (Veo 3.1)</span>
          <span className="text-zinc-700">•</span>
          <span>Qwen 2.5-VL Swarm (2 FPS)</span>
        </div>

        {/* Authentic 1:1 Studio Dashboard Showcase */}
        <div className="mt-14 w-full max-w-5xl rounded-2xl border border-white/[0.1] bg-[#090a0c] p-3 sm:p-4 shadow-2xl backdrop-blur-xl relative group text-left">
          {/* Subtle Frame Glow */}
          <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-indigo-500/10 via-white/[0.02] to-transparent pointer-events-none" />

          {/* Dashboard Top Navigation Bar (1:1 Studio Header) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.07] mb-3 text-xs font-berkeley">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-md bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
                <svg
                  className="w-3 h-3 text-indigo-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="14.31" y1="8" x2="20.05" y2="17.94" />
                  <line x1="9.69" y1="8" x2="21.17" y2="8" />
                  <line x1="7.38" y1="12" x2="13.12" y2="2.06" />
                  <line x1="9.69" y1="16" x2="3.95" y2="6.06" />
                  <line x1="14.31" y1="16" x2="2.83" y2="16" />
                  <line x1="16.62" y1="12" x2="10.88" y2="21.94" />
                </svg>
              </div>
              <span className="font-semibold text-white tracking-tight">STUDIO</span>
              <span className="text-zinc-600">/</span>
              <span className="text-zinc-400">ep_production_final</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                PPO CONVERGED (0.7301)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-[10px] rounded-lg bg-white/[0.03] text-zinc-400 border border-white/[0.06]">
                <Database className="w-3 h-3 text-indigo-400" /> ClickHouse Cloud (8.2ms)
              </span>
              <Link
                href="/studio"
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-white text-black font-medium text-[11px] hover:bg-zinc-200 transition-colors shadow-sm"
              >
                <span>Launch Studio</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* 4 Vercel-Style Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3 font-mono">
            <div className="bg-[#0c0d10] border border-white/[0.06] rounded-xl p-2.5">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Mean Attention</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-lg font-bold text-white tracking-tight">73.0%</span>
                <span className="text-[10px] font-semibold text-emerald-400">+14.2%</span>
              </div>
            </div>
            <div className="bg-[#0c0d10] border border-white/[0.06] rounded-xl p-2.5">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Worst Drop</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-lg font-bold text-zinc-200 tracking-tight">-4.1%</span>
                <span className="text-[10px] font-semibold text-emerald-400">Stabilized</span>
              </div>
            </div>
            <div className="bg-[#0c0d10] border border-white/[0.06] rounded-xl p-2.5">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Showrunner Action</span>
              <div className="truncate mt-1 text-xs font-semibold text-indigo-400">
                Veo Cutaway
              </div>
            </div>
            <div className="bg-[#0c0d10] border border-white/[0.06] rounded-xl p-2.5">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Audience Reward</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-lg font-bold text-emerald-400 tracking-tight">0.7301</span>
                <span className="text-[10px] font-semibold text-emerald-400">+0.2800</span>
              </div>
            </div>
          </div>

          {/* Studio Grid: Video Monitor & Timeline (Left) + Retention Curve & Showrunner Feed (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            {/* Left: Cinema Video Player & Multi-track Timeline */}
            <div className="lg:col-span-7 bg-[#050607] rounded-xl border border-white/[0.07] p-3 flex flex-col justify-between">
              {/* Monitor Header */}
              <div className="flex items-center justify-between text-[11px] font-berkeley text-zinc-400 pb-2 border-b border-white/[0.05]">
                <span className="flex items-center gap-1.5 text-zinc-200">
                  <Play className="w-3 h-3 text-indigo-400 fill-current" /> Rough Cut Assembly #4
                </span>
                <span className="text-zinc-500">1280x720 • 24fps • H.264</span>
              </div>

              {/* Simulated Cinema Screen with Timecode */}
              <div className="my-3 aspect-video bg-gradient-to-br from-[#0c0d12] via-[#07080a] to-[#040507] rounded-lg border border-white/[0.05] relative flex flex-col items-center justify-center overflow-hidden group/screen">
                {/* Corner framing marks */}
                <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-white/[0.2]" />
                <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-white/[0.2]" />
                <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-white/[0.2]" />
                <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-white/[0.2]" />

                <div className="text-center space-y-1.5">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[10px] font-berkeley font-medium">
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    Veo 3.1 B-Roll Cutaway Injected
                  </div>
                  <div className="font-berkeley text-xs text-zinc-400">
                    Macro close-up inserted at frame 180
                  </div>
                </div>

                {/* Bottom Scrubber Overlay */}
                <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[10px] font-berkeley text-zinc-400 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/[0.08]">
                  <span>00:00:14.240</span>
                  <div className="flex-1 mx-3 h-1 rounded-full bg-white/[0.1] relative overflow-hidden">
                    <div className="w-2/3 h-full bg-indigo-500 rounded-full" />
                  </div>
                  <span>00:00:22.000</span>
                </div>
              </div>

              {/* Multi-Track Timeline Bar */}
              <div className="space-y-1 pt-2 border-t border-white/[0.05] font-berkeley text-[9px]">
                <div className="text-[10px] text-zinc-500 flex justify-between">
                  <span>V1 Video Track</span>
                  <span>22.0s Total Arc</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="flex-1 h-6 rounded bg-white/[0.06] border border-white/[0.08] text-zinc-300 flex items-center justify-center px-1 truncate">
                    01_intro (4.0s)
                  </div>
                  <div className="flex-1 h-6 rounded bg-white/[0.06] border border-white/[0.08] text-zinc-300 flex items-center justify-center px-1 truncate">
                    02_dialogue (4.5s)
                  </div>
                  <div className="flex-1 h-6 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center justify-center px-1 truncate font-semibold">
                    03_veo_cutaway (3.5s)
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

            {/* Right: Retention Curve & ADK Directorial Decisions */}
            <div className="lg:col-span-5 bg-[#050607] rounded-xl border border-white/[0.07] p-3 flex flex-col justify-between">
              {/* Retention Curves Area */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-berkeley text-zinc-400 pb-2 border-b border-white/[0.05] mb-2.5">
                  <span className="flex items-center gap-1.5 text-zinc-200">
                    <Activity className="w-3.5 h-3.5 text-indigo-400" /> Retention Curves
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold">50ms Oracle</span>
                </div>

                {/* Vercel-Style SVG Retention Curve */}
                <div className="h-32 w-full bg-[#090a0d] rounded-lg border border-white/[0.05] p-2 relative flex flex-col justify-between">
                  <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="heroAttGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    {/* Grid Lines */}
                    <line x1="0" y1="25" x2="300" y2="25" stroke="#ffffff0a" strokeDasharray="3 3" />
                    <line x1="0" y1="50" x2="300" y2="50" stroke="#ffffff0a" strokeDasharray="3 3" />
                    <line x1="0" y1="75" x2="300" y2="75" stroke="#ffffff0a" strokeDasharray="3 3" />
                    {/* Veo Cutaway injection point indicator */}
                    <line x1="140" y1="10" x2="140" y2="90" stroke="#6366f1" strokeDasharray="2 2" strokeWidth="1" />
                    {/* Area fill */}
                    <path
                      d="M 0 60 Q 50 55, 90 65 T 140 30 T 210 20 T 300 15 L 300 100 L 0 100 Z"
                      fill="url(#heroAttGrad)"
                    />
                    {/* Curve stroke */}
                    <path
                      d="M 0 60 Q 50 55, 90 65 T 140 30 T 210 20 T 300 15"
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="2.5"
                    />
                    {/* Point at injection */}
                    <circle cx="140" cy="30" r="3.5" fill="#ffffff" stroke="#6366f1" strokeWidth="2" />
                  </svg>

                  <div className="flex items-center justify-between text-[9px] font-berkeley text-zinc-500 pt-1">
                    <span>0.0s (Intro)</span>
                    <span className="text-indigo-400 font-semibold">12.0s (Veo Injection)</span>
                    <span>22.0s (Climax)</span>
                  </div>
                </div>
              </div>

              {/* Google ADK Showrunner Activity Card */}
              <div className="mt-3 pt-2.5 border-t border-white/[0.05]">
                <div className="flex items-center justify-between text-[10px] font-berkeley mb-1.5">
                  <span className="text-zinc-400 flex items-center gap-1.5">
                    <Terminal className="w-3 h-3 text-emerald-400" />
                    <span>GOOGLE ADK SHOWRUNNER</span>
                  </span>
                  <span className="text-emerald-400 font-medium">LIVE STREAM</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#0a0b0e] border border-indigo-500/20 text-[10px] font-berkeley text-zinc-300 leading-relaxed">
                  <div className="text-indigo-300 font-semibold mb-1 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
                    Intervention: Injected B-Roll into standoff
                  </div>
                  <p className="text-zinc-400 text-[9.5px]">
                    &ldquo;Standoff tension sagged at frame 180. Prompted Veo 3.1 for macro cutaway to restore momentum without deleting the scene.&rdquo;
                  </p>
                  <div className="mt-2 pt-1.5 border-t border-white/[0.06] flex items-center justify-between text-[9px] text-zinc-500">
                    <span>Reward: 0.4501 &rarr; 0.7301</span>
                    <span className="text-emerald-400 font-bold">+62.2% Attention Flow</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
