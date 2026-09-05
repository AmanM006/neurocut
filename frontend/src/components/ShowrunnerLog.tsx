"use client";

import React, { useRef, useEffect } from "react";
import { Terminal, Sparkles, Cpu, CheckCircle, AlertTriangle, ArrowRight } from "lucide-react";

export interface LogEntry {
  id: string;
  timestamp: string;
  type: "info" | "action" | "intervention" | "query" | "success";
  title: string;
  details?: string;
  badge?: string;
  reward?: number;
}

interface ShowrunnerLogProps {
  logs: LogEntry[];
}

export const ShowrunnerLog: React.FC<ShowrunnerLogProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="bg-[#050505] border border-white/[0.08] rounded-xl p-4 flex flex-col h-full shadow-2xl relative overflow-hidden">
      {/* Top Ambient Glow Accent */}
      <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.06] mb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold tracking-wider text-white uppercase font-mono">
              Panel C // Showrunner Decision Stream
            </h2>
            <p className="text-[11px] text-white/40 font-mono">Google ADK Agent & Autonomous Intervention Log</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-white/40">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-[10px] text-emerald-400 font-medium tracking-wide">ADK SUPERVISOR LIVE</span>
        </div>
      </div>

      {/* Scrolling Stream Area */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 font-mono text-xs max-h-[500px]">
        {logs.map((log) => {
          if (log.type === "intervention") {
            return (
              <div
                key={log.id}
                className="bg-gradient-to-r from-amber-950/30 via-black to-black border border-amber-500/40 rounded-xl p-3.5 shadow-lg transition-all"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-bold text-[9px] border border-amber-500/40 uppercase tracking-wider">
                    <Sparkles className="w-3 h-3 text-amber-400" /> SHOWRUNNER INTERVENTION
                  </span>
                  <span className="text-[10px] text-white/40">{log.timestamp}</span>
                </div>
                <div className="font-semibold text-white text-xs flex items-center gap-1.5">
                  {log.title}
                </div>
                {log.details && (
                  <p className="mt-2 text-[11px] text-amber-200/90 leading-relaxed bg-[#000000]/60 p-2.5 rounded-lg border border-amber-500/20">
                    {log.details}
                  </p>
                )}
                {log.reward !== undefined && (
                  <div className="mt-2.5 text-[10px] text-white/50 flex items-center gap-2">
                    <span>Reward Delta:</span>
                    <span className="text-emerald-400 font-bold font-mono">+{log.reward.toFixed(4)}</span>
                  </div>
                )}
              </div>
            );
          }

          if (log.type === "action") {
            return (
              <div
                key={log.id}
                className="bg-[#08080a] border border-white/[0.06] rounded-lg p-2.5 transition-all"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <Cpu className="w-3 h-3 text-cyan-400" />
                    <span className="text-white/90 font-medium">{log.title}</span>
                  </div>
                  <span className="text-[10px] text-white/40">{log.timestamp}</span>
                </div>
                {log.details && <p className="text-[11px] text-white/50 mt-1">{log.details}</p>}
              </div>
            );
          }

          if (log.type === "query") {
            return (
              <div
                key={log.id}
                className="bg-[#040406] border border-white/[0.04] rounded p-2 text-[10px] text-white/40"
              >
                <span className="text-cyan-400 font-bold mr-1.5">[MCP-CLICKHOUSE]</span>
                <span className="text-white/70">{log.title}</span>
                {log.details && <div className="text-white/40 mt-0.5 font-mono">{log.details}</div>}
              </div>
            );
          }

          return (
            <div key={log.id} className="text-white/50 text-[11px] flex items-start gap-2 py-0.5 font-mono">
              <span className="text-white/20 select-none">›</span>
              <div className="flex-1">
                <span className="text-white/80">{log.title}</span>
                {log.details && <span className="text-white/40 block text-[10px]">{log.details}</span>}
              </div>
              <span className="text-[9px] text-white/30">{log.timestamp}</span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
