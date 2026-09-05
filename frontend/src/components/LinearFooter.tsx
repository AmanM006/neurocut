"use client";

import React from "react";
import Link from "next/link";
import { Database, Sparkles, Terminal } from "lucide-react";

export const LinearFooter: React.FC = () => {
 return (
 <footer className="border-t border-white/[0.06] bg-[#060608] py-12 text-xs font-inter text-zinc-500">
 <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
 <div className="flex items-center gap-3">
 <div className="w-6 h-6 rounded-md bg-white/[0.08] border border-white/[0.1] flex items-center justify-center">
 <span className="font-mono font-bold text-[10px] text-indigo-400">NC</span>
 </div>
 <span className="text-zinc-400 font-medium">NEURO-CUT</span>
 <span className="text-zinc-700">•</span>
 <span>Google Cloud Agentic Cinema Hackathon</span>
 </div>

 <div className="flex items-center gap-6 font-mono text-[11px] text-zinc-400">
 <Link href="/studio" className="hover:text-white transition-colors">
 Studio
 </Link>
 <a href="#features" className="hover:text-white transition-colors">
 Architecture
 </a>
 <a href="#benchmark" className="hover:text-white transition-colors">
 PPO Benchmark
 </a>
 <a
 href="https://github.com/AmanM006/neurocut"
 target="_blank"
 rel="noopener noreferrer"
 className="hover:text-white transition-colors flex items-center gap-1"
 >
 <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
 <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
 </svg>
 <span>GitHub</span>
 </a>
 </div>
 </div>
 </footer>
 );
};
