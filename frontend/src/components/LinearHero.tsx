"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Play, Sparkles, Cpu, Activity, Database, CheckCircle2, Layers } from "lucide-react";

export const LinearHero: React.FC = () => {
 return (
 <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
 {/* Linear Ambient Background Glows */}
 <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent blur-[120px] pointer-events-none rounded-full" />
 <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-white/[0.15] to-transparent pointer-events-none" />

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

 {/* Interactive Hero Showcase (Linear-Style App Frame) */}
 <div className="mt-14 w-full max-w-5xl rounded-2xl border border-white/[0.1] bg-[#0c0d0e]/80 p-2 sm:p-3 shadow-2xl backdrop-blur-xl relative group">
 {/* Subtle Frame Glow */}
 <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-white/[0.1] via-white/[0.03] to-transparent pointer-events-none" />

 {/* Window Header */}
 <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] mb-3 text-xs font-berkeley">
 <div className="flex items-center gap-2">
 <div className="flex gap-1.5">
 <span className="w-2.5 h-2.5 rounded-full bg-[#27272a]" />
 <span className="w-2.5 h-2.5 rounded-full bg-[#27272a]" />
 <span className="w-2.5 h-2.5 rounded-full bg-[#27272a]" />
 </div>
 <span className="text-zinc-500 text-[11px] ml-2">studio.neurocut.ai/preview</span>
 </div>

 <div className="flex items-center gap-2">
 <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
 PPO POLICY VERIFIED (0.7301)
 </span>
 <span className="px-2 py-0.5 rounded text-[10px] bg-white/[0.04] text-zinc-400 border border-white/[0.08]">
 22.0s Arc
 </span>
 </div>
 </div>

 {/* Window Body: Interactive Studio Teaser */}
 <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-2 text-left">
 {/* Left: Video Preview Teaser */}
 <div className="md:col-span-7 bg-[#060608] rounded-xl border border-white/[0.06] p-3 flex flex-col justify-between aspect-video relative overflow-hidden">
 <div className="flex items-center justify-between text-[11px] font-berkeley text-zinc-400">
 <span className="flex items-center gap-1.5 text-zinc-200">
 <Play className="w-3 h-3 text-indigo-400 fill-current" /> Rough Cut Assembly #4
 </span>
 <span className="text-emerald-400 font-bold">Reward: 0.7301</span>
 </div>

 {/* Mock Cinema Canvas */}
 <div className="flex-1 flex items-center justify-center text-center my-4">
 <div className="space-y-1">
 <div className="text-xs font-berkeley text-zinc-500">Autonomous FFmpeg Pipeline Active</div>
 <div className="text-[10px] text-zinc-600 font-berkeley">1280x720 @ 24fps • H.264 Video Stream</div>
 </div>
 </div>

 {/* Mini Multi-track Bar */}
 <div className="pt-2 border-t border-white/[0.06] flex items-center gap-1 font-berkeley text-[9px]">
 <div className="flex-1 h-6 rounded bg-white/[0.08] text-zinc-300 flex items-center justify-center px-1 truncate">
 shot_01 (4.0s)
 </div>
 <div className="flex-1 h-6 rounded bg-white/[0.08] text-zinc-300 flex items-center justify-center px-1 truncate">
 shot_02 (4.5s)
 </div>
 <div className="w-16 h-6 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center justify-center px-1 truncate">
 Veo B-Roll
 </div>
 <div className="flex-1 h-6 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 flex items-center justify-center px-1 truncate">
 climax (5.5s)
 </div>
 </div>
 </div>

 {/* Right: Drop-off Funnel & Showrunner Teaser */}
 <div className="md:col-span-5 bg-[#060608] rounded-xl border border-white/[0.06] p-3 flex flex-col justify-between">
 <div>
 <div className="flex items-center justify-between text-[11px] font-berkeley mb-3">
 <span className="text-zinc-300 font-medium">Retention Drop-off Funnel</span>
 <span className="text-indigo-400 font-bold">+12.4% Flow</span>
 </div>

 {/* 3D Step Mini Funnel */}
 <div className="space-y-1.5 font-berkeley text-[10px]">
 <div className="flex items-center justify-between p-1.5 rounded bg-white/[0.03] border border-white/[0.04]">
 <span className="text-zinc-400">Scene 1: Introduction</span>
 <span className="text-zinc-200">0.71 Att</span>
 </div>
 <div className="flex items-center justify-between p-1.5 rounded bg-white/[0.03] border border-white/[0.04]">
 <span className="text-zinc-400">Scene 2: Dialogue</span>
 <span className="text-zinc-200">0.65 Att</span>
 </div>
 <div className="flex items-center justify-between p-1.5 rounded bg-rose-950/40 border border-rose-500/30 text-rose-300">
 <span>Scene 3: Pacing Bottleneck</span>
 <span className="font-bold">0.48 Att (Drop)</span>
 </div>
 <div className="flex items-center justify-between p-1.5 rounded bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
 <span className="flex items-center gap-1">
 <Sparkles className="w-2.5 h-2.5" /> Showrunner Cutaway
 </span>
 <span className="font-bold">0.82 Att</span>
 </div>
 </div>
 </div>

 {/* Showrunner Prompt Bar Teaser */}
 <div className="mt-3 pt-2.5 border-t border-white/[0.06]">
 <div className="text-[9px] font-berkeley text-zinc-500 flex items-center gap-1 mb-1">
 <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
 <span>SHOWRUNNER REASONING</span>
 </div>
 <div className="p-2 rounded-lg bg-[#0c0d0f] border border-white/[0.06] text-[10px] font-berkeley text-zinc-300 leading-snug">
 &ldquo;Standoff tension sagged at frame 180. Prompted Veo 3.1 for macro cutaway to restore momentum.&rdquo;
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 </section>
 );
};
