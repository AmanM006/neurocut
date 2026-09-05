"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Database, Sparkles } from "lucide-react";

export const LinearNavbar: React.FC = () => {
 const [scrolled, setScrolled] = useState(false);

 useEffect(() => {
 const handleScroll = () => {
 setScrolled(window.scrollY > 20);
 };
 window.addEventListener("scroll", handleScroll);
 return () => window.removeEventListener("scroll", handleScroll);
 }, []);

 return (
 <header
 className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
 scrolled
 ? "bg-[#08090a]/85 backdrop-blur-xl border-b border-white/[0.08] shadow-2xl py-3"
 : "bg-transparent py-4 border-b border-white/[0.04]"
 }`}
 >
 <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
 {/* Brand */}
 <Link href="/" className="flex items-center gap-3 group">
 <div className="w-8 h-8 rounded-lg bg-gradient-to-b from-white/[0.12] to-white/[0.02] border border-white/[0.1] flex items-center justify-center shadow-inner group-hover:border-indigo-500/50 transition-colors">
 <span className="font-berkeley font-bold text-xs tracking-tighter text-indigo-400">
 NC
 </span>
 </div>
 <div className="flex items-center gap-2">
 <span className="font-inter font-semibold text-sm tracking-tight text-white">
 NEURO-CUT
 </span>
 <span className="px-1.5 py-0.5 rounded text-[9px] font-berkeley uppercase tracking-wider bg-white/[0.06] text-zinc-400 border border-white/[0.08]">
 v2.0
 </span>
 </div>
 </Link>

 {/* Center Nav Links */}
 <nav className="hidden md:flex items-center gap-6 text-xs font-inter text-zinc-400">
 <a href="#features" className="hover:text-white transition-colors">
 Architecture
 </a>
 <a href="#retention" className="hover:text-white transition-colors">
 Retention Oracle
 </a>
 <a href="#showrunner" className="hover:text-white transition-colors">
 Showrunner Agent
 </a>
 <a href="#benchmark" className="hover:text-white transition-colors">
 PPO Benchmark
 </a>
 <Link
 href="/studio"
 className="text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 font-medium"
 >
 <span>Live Studio</span>
 <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
 </Link>
 </nav>

 {/* Right CTAs */}
 <div className="flex items-center gap-3">
 <a
 href="https://github.com/AmanM006/neurocut"
 target="_blank"
 rel="noopener noreferrer"
 className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.05] border border-transparent hover:border-white/[0.08] transition-all"
 title="GitHub Repository"
 >
 <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
 <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
 </svg>
 </a>

 <Link
 href="/studio"
 className="group flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-inter font-medium bg-white text-black hover:bg-zinc-200 transition-all duration-150 shadow-md hover:shadow-white/20 active:scale-[0.98]"
 >
 <span>Launch Studio</span>
 <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
 </Link>
 </div>
 </div>
 </header>
 );
};
