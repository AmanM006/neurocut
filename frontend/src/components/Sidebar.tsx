"use client";

import React from "react";
import {
  Film,
  Activity,
  Terminal,
  Table,
  BrainCircuit,
  Database,
  CheckCircle2,
  ExternalLink
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  clickhouseMode: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  clickhouseMode
}) => {
  const navItems = [
    { id: "monitor", label: "Timeline Monitor", icon: Film },
    { id: "curves", label: "Audience Retention Curves", icon: Activity },
    { id: "training", label: "PPO Policy Training (5k)", icon: BrainCircuit },
    { id: "showrunner", label: "Showrunner Activity Feed", icon: Terminal },
    { id: "scenes", label: "Scene Breakdown Table", icon: Table },
  ];

  return (
    <aside className="w-14 lg:w-16 h-screen sticky top-0 bg-[#060608] border-r border-white/[0.06] flex flex-col items-center py-4 justify-between z-40 shrink-0 select-none">
      {/* Top: Logo Emblem */}
      <div className="flex flex-col items-center gap-6">
        <a
          href="/"
          className="relative group flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-b from-white/[0.08] to-transparent border border-white/[0.08] hover:border-amber-500/40 transition-all shadow-inner"
          title="NEURO-CUT // Agentic Showrunner Studio"
        >
          <span className="font-mono font-black text-xs tracking-tighter text-amber-400 group-hover:text-amber-300 transition-colors">
            NC
          </span>
          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-[#060608]" />
        </a>

        {/* Primary Navigation Icons */}
        <nav className="flex flex-col items-center gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`relative group p-2.5 rounded-xl transition-all duration-150 ${
                  isActive
                    ? "bg-white/[0.08] text-white shadow-sm border border-white/[0.12]"
                    : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]"
                }`}
                title={item.label}
              >
                <Icon className="w-4 h-4" />
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-0.5 bg-amber-400 rounded-r-full" />
                )}
                {/* Tooltip */}
                <span className="absolute left-full ml-3 px-2 py-1 rounded-md bg-[#16161b] text-zinc-200 text-[10px] font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-white/[0.08] shadow-xl z-50">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom: Utilities & Cloud Live Status */}
      <div className="flex flex-col items-center gap-3">
        {/* ClickHouse Cloud Indicator */}
        <div
          className="relative group p-2 rounded-xl bg-white/[0.02] text-zinc-500 hover:text-cyan-300 border border-white/[0.05] transition-colors cursor-default"
          title={`ClickHouse: ${clickhouseMode === "cloud" ? "Cloud Live (MCP)" : "Embedded Oracle"}`}
        >
          <Database className="w-4 h-4 text-cyan-400/80" />
          <span className="absolute left-full ml-3 px-2 py-1 rounded-md bg-[#16161b] text-cyan-300 text-[10px] font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-white/[0.08] shadow-xl z-50">
            {clickhouseMode === "cloud" ? "ClickHouse Cloud Live" : "Embedded SQL Oracle"}
          </span>
        </div>

        {/* GitHub Link */}
        <a
          href="https://github.com/AmanM006/neurocut"
          target="_blank"
          rel="noopener noreferrer"
          className="relative group p-2 rounded-xl text-zinc-500 hover:text-white hover:bg-white/[0.04] transition-colors"
          title="View Source on GitHub"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
          <span className="absolute left-full ml-3 px-2 py-1 rounded-md bg-[#16161b] text-zinc-200 text-[10px] font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-white/[0.08] shadow-xl z-50">
            GitHub Repository
          </span>
        </a>

        <div className="w-6 h-px bg-white/[0.06] my-1" />

        {/* Online Status Dot */}
        <div
          className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 ring-4 ring-emerald-500/20 animate-pulse"
          title="System Online: Google Cloud Agentic Cinema"
        />
      </div>
    </aside>
  );
};
