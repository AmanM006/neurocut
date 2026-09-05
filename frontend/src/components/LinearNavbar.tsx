"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

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
          : "bg-transparent py-4 border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-lg bg-[#121316] border border-white/[0.1] flex items-center justify-center group-hover:border-indigo-500/60 group-hover:bg-indigo-500/10 transition-all duration-200">
            <svg
              className="w-3.5 h-3.5 text-indigo-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
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
          <div className="flex items-center gap-2">
            <span className="font-inter font-semibold text-sm tracking-tight text-white">
              NEURO-CUT
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-inter font-medium uppercase tracking-wider bg-white/[0.06] text-zinc-400 border border-white/[0.08]">
              v2.0
            </span>
          </div>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-inter text-zinc-400">
          <a href="#architecture" className="hover:text-white transition-colors">
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
