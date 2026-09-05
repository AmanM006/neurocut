"use client";

import React from "react";
import { Database, Activity, Sparkles, Cpu, Layers, Terminal, ArrowUpRight, Film } from "lucide-react";

export const LinearFeatures: React.FC = () => {
 const features = [
 {
 id: "retention",
 num: "01",
 tag: "REAL-TIME ORACLE",
 title: "ClickHouse Cloud 50ms Retention Engine",
 description:
 "Calculates instantaneous frame-by-frame audience engagement using SQL window functions (`lagInFrame`, `avg`, `stddevSamp`). Returns scalar rewards in under 8.2ms with zero cold start.",
 icon: Database,
 accent: "cyan",
 stats: "8.2ms P99 Latency • asia-southeast1 GCP"
 },
 {
 id: "swarm",
 num: "02",
 tag: "MULTIMODAL SWARM",
 title: "Qwen 2.5-VL 3B Audience Vision Swarm",
 description:
 "Evaluates 2 FPS raw video frames across four distinct viewer personas (Action Enthusiast, Drama Purist, Sensory Seeker, Casual). Ingests multi-perspective consensus attention into ClickHouse.",
 icon: Activity,
 accent: "purple",
 stats: "4 Personas • 2 FPS Continuous Stream"
 },
 {
 id: "showrunner",
 num: "03",
 tag: "DIRECTORIAL AGENT",
 title: "Google ADK Showrunner Supervisor",
 description:
 "Hierarchical multi-agent supervisor that inspects pacing drops. When a scene drags, it prompts Google Veo 3.1 & Imagen to synthesize contextual B-roll cutaways instead of deleting vital narrative scenes.",
 icon: Sparkles,
 accent: "indigo",
 stats: "Veo 3.1 • Zero Story Collapse"
 },
 {
 id: "ppo",
 num: "04",
 tag: "POLICY GRADIENT",
 title: "40-Action Actor-Critic PPO Policy",
 description:
 "Trained over 5,000 episodes on NVIDIA T4 GPU. Explores discrete head/tail trims, shot swaps, and multi-step combinations with ClickHouse retention deltas as the reward signal.",
 icon: Cpu,
 accent: "emerald",
 stats: "0.7301 Peak Benchmark • 5,000 Episodes"
 }
 ];

 return (
 <section id="architecture" className="py-20 md:py-28 border-t border-white/[0.06] relative">
 <div className="max-w-6xl mx-auto px-6">
 {/* Section Header */}
 <div className="flex flex-col items-center text-center mb-16">
 <span className="px-2.5 py-1 rounded-full text-[10px] font-berkeley uppercase tracking-wider bg-white/[0.04] text-zinc-400 border border-white/[0.08] mb-3">
 Core Architecture
 </span>
 <h2 className="font-inter font-bold text-3xl sm:text-4xl md:text-5xl tracking-tight text-white max-w-2xl">
 A new standard for agentic cinematic post-production.
 </h2>
 <p className="mt-4 text-sm sm:text-base text-zinc-400 font-inter max-w-xl">
 Every layer is purpose-built for low-latency reasoning, combining analytical databases with generative vision models and reinforcement learning.
 </p>
 </div>

 {/* 4-Pillar Grid */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {features.map((feat) => {
 const Icon = feat.icon;
 let iconColor = "text-cyan-400 bg-cyan-500/10 border-cyan-500/20";
 if (feat.accent === "purple") iconColor = "text-purple-400 bg-purple-500/10 border-purple-500/20";
 if (feat.accent === "indigo") iconColor = "text-indigo-400 bg-indigo-500/10 border-indigo-500/20";
 return (
 <div
 key={feat.num}
 id={feat.id}
 className="bg-[#0b0c0e] border border-white/[0.07] rounded-2xl p-6 flex flex-col justify-between group hover:border-white/[0.14] transition-all duration-200 shadow-lg"
 >
 <div>
 <div className="flex items-center justify-between mb-4">
 <span className="font-berkeley text-xs text-zinc-500 tracking-wider">
 {feat.num} / {feat.tag}
 </span>
 </div>

 <h3 className="font-inter font-semibold text-lg text-white tracking-tight group-hover:text-indigo-300 transition-colors">
 {feat.title}
 </h3>

 <p className="mt-2 text-xs sm:text-sm text-zinc-400 font-inter leading-relaxed">
 {feat.description}
 </p>
 </div>

 <div className="mt-6 pt-4 border-t border-white/[0.05] flex items-center justify-between text-[11px] font-berkeley text-zinc-500">
 <span>{feat.stats}</span>
 <ArrowUpRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-white transition-colors" />
 </div>
 </div>
 );
 })}
 </div>
 </div>
 </section>
 );
};
