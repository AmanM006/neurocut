"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Zap, ArrowRight, ExternalLink, AlertTriangle, CheckCircle2, Trophy } from "lucide-react";

export const LinearBenchmarkSection: React.FC = () => {
 return (
 <section id="benchmark" className="py-20 md:py-28 border-t border-white/[0.06] bg-[#070809] relative">
 <div className="max-w-6xl mx-auto px-6">
 {/* Section Header */}
 <div className="flex flex-col items-center text-center mb-14">
 <span className="px-2.5 py-1 rounded-full text-[10px] font-berkeley uppercase tracking-wider bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 mb-3">
 Empirical Findings // 5,000-Episode Run
 </span>
 <h2 className="font-inter font-bold text-3xl sm:text-4xl md:text-5xl tracking-tight text-white max-w-3xl">
 The Goodhart&apos;s Law Discovery &amp; Multi-Agent Oversight
 </h2>
 <p className="mt-4 text-sm sm:text-base text-zinc-400 font-inter max-w-2xl">
 What happens when an autonomous RL policy optimizes for audience retention? It discovers that deleting 60% of the film maximizes the average score.
 </p>
 </div>

 {/* Side-by-Side Comparison Bento */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
 {/* Winner 1: Production Standard Cut */}
 <div className="bg-[#0b0c0e] border border-white/[0.08] rounded-2xl p-6 relative overflow-hidden shadow-xl">
 <div className="flex items-center justify-between mb-4">
 <span className="px-2.5 py-1 rounded-full text-[10px] font-berkeley uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
 PRODUCTION FILM WINNER
 </span>
 <span className="font-berkeley text-xs text-zinc-500">Phase 1 Standard</span>
 </div>

 <div className="flex items-baseline gap-2 mb-2">
 <span className="text-3xl sm:text-4xl font-bold font-berkeley text-white">0.6730</span>
 <span className="text-xs font-berkeley text-zinc-400">Audience Reward</span>
 </div>

 <div className="space-y-2 mt-4 text-xs font-berkeley text-zinc-400 border-t border-white/[0.06] pt-4">
 <div className="flex justify-between">
 <span>Story Runtime:</span>
 <span className="text-white font-semibold">22.0 Seconds (528 frames @ 24fps)</span>
 </div>
 <div className="flex justify-between">
 <span>Narrative Integrity:</span>
 <span className="text-emerald-400 font-semibold">5 / 5 Scenes Preserved (100%)</span>
 </div>
 <div className="flex justify-between">
 <span>Showrunner Action:</span>
 <span className="text-indigo-300 font-semibold">Veo B-Roll Injected into Standoff</span>
 </div>
 </div>

 <p className="mt-4 text-xs text-zinc-400 font-inter leading-relaxed">
 When the standoff scene dragged, the Showrunner Agent injected high-tension B-roll, keeping viewer attention high without dropping the scene.
 </p>
 </div>

 {/* Winner 2: Neural Policy Peak (Goodhart's Law Discovery) */}
 <div className="bg-[#0b0c0e] border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden shadow-xl">
 <div className="flex items-center justify-between mb-4">
 <span className="px-2.5 py-1 rounded-full text-[10px] font-berkeley uppercase tracking-wider bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-medium">
 NEURAL POLICY PEAK
 </span>
 <span className="font-berkeley text-xs text-indigo-400/80">Phase 3 PPO</span>
 </div>

 <div className="flex items-baseline gap-2 mb-2">
 <span className="text-3xl sm:text-4xl font-bold font-berkeley text-indigo-400">0.7301</span>
 <span className="text-xs font-berkeley text-indigo-300/60">+8.48% Higher Metric</span>
 </div>

 <div className="space-y-2 mt-4 text-xs font-berkeley text-zinc-400 border-t border-white/[0.06] pt-4">
 <div className="flex justify-between">
 <span>Story Runtime:</span>
 <span className="text-indigo-300 font-semibold">8.5 Seconds (204 frames @ 24fps)</span>
 </div>
 <div className="flex justify-between">
 <span>Narrative Integrity:</span>
 <span className="text-rose-400 font-semibold">2 / 5 Scenes Remaining (Over-Pruned)</span>
 </div>
 <div className="flex justify-between">
 <span>Discovered Shortcut:</span>
 <span className="text-zinc-300 font-semibold">Deleted Exposition &amp; Standoff Setup</span>
 </div>
 </div>

 <p className="mt-4 text-xs text-zinc-400 font-inter leading-relaxed">
 The unconstrained policy mathematically hacked the arithmetic mean. By discarding all context, it achieved a higher score, proving the need for hierarchical multi-agent supervision.
 </p>
 </div>
 </div>

 {/* Action Callout */}
 <div className="p-6 rounded-2xl bg-gradient-to-r from-white/[0.03] to-white/[0.01] border border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
 <div>
 <h4 className="text-sm font-semibold text-white font-inter">
 Ready to see the autonomous timeline optimizer in real time?
 </h4>
 <p className="text-xs text-zinc-400 font-inter mt-0.5">
 Launch the studio to test discrete trimming steps, Qwen vision swarms, and Showrunner overrides.
 </p>
 </div>

 <div className="flex items-center gap-3 shrink-0">
 <a
 href="https://colab.research.google.com/github/AmanM006/neurocut/blob/main/notebooks/train_ppo_colab.ipynb"
 target="_blank"
 rel="noopener noreferrer"
 className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-berkeley text-zinc-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all"
 >
 <span>Colab 5K Run</span>
 <ExternalLink className="w-3.5 h-3.5" />
 </a>

 <Link
 href="/studio"
 className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-inter font-semibold bg-white text-black hover:bg-zinc-200 transition-all shadow-md active:scale-[0.98]"
 >
 <span>Open Studio Dashboard</span>
 <ArrowRight className="w-3.5 h-3.5" />
 </Link>
 </div>
 </div>
 </div>
 </section>
 );
};
