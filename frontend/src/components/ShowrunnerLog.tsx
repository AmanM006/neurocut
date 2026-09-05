"use client";

import React, { useRef, useEffect } from "react";
import { Terminal, Sparkles, Cpu } from "lucide-react";

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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-[#0c0d0e] border border-white/[0.08] rounded-2xl p-5 flex flex-col h-full shadow-2xl relative overflow-hidden font-inter">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.06] mb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white tracking-tight">
              Showrunner Activity Feed
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Google ADK Directorial Decisions & SSE Stream
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 font-medium">ADK SUPERVISOR LIVE</span>
        </div>
      </div>

      {/* Scrolling Stream Area */}
      <div ref={containerRef} className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs max-h-[420px]">
        {logs.map((log) => {
          if (log.type === "intervention") {
            return (
              <div
                key={log.id}
                className="bg-[#121016] border border-indigo-500/30 rounded-xl p-3 shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 font-semibold text-[10px] border border-indigo-500/40 uppercase tracking-wider">
                    <Sparkles className="w-3 h-3 text-indigo-400" /> Showrunner B-Roll Injection
                  </span>
                  <span className="text-[11px] font-mono text-zinc-500">{log.timestamp}</span>
                </div>
                <div className="font-semibold text-white text-xs flex items-center gap-1.5">
                  {log.title}
                </div>
                {log.details && (
                  <p className="mt-1.5 text-xs text-indigo-200/90 leading-relaxed bg-black/40 p-2.5 rounded-lg border border-indigo-500/15">
                    {log.details}
                  </p>
                )}
                {log.reward !== undefined && (
                  <div className="mt-2 text-xs text-zinc-400 flex items-center gap-2">
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
                className="bg-[#08080a] border border-white/[0.05] rounded-xl p-2.5 transition-all"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-zinc-200 font-medium text-xs">{log.title}</span>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-500">{log.timestamp}</span>
                </div>
                {log.details && <p className="text-xs text-zinc-400 mt-0.5">{log.details}</p>}
              </div>
            );
          }

          if (log.type === "query") {
            return (
              <div
                key={log.id}
                className="bg-[#060608] border border-white/[0.04] rounded-lg p-2 text-xs text-zinc-400 font-mono"
              >
                <span className="text-indigo-400 font-bold mr-1.5">[CLICKHOUSE]</span>
                <span className="text-zinc-300">{log.title}</span>
                {log.details && <div className="text-zinc-500 mt-0.5">{log.details}</div>}
              </div>
            );
          }

          return (
            <div key={log.id} className="text-zinc-400 text-xs flex items-start gap-2 py-0.5">
              <span className="text-zinc-600 select-none">›</span>
              <div className="flex-1">
                <span className="text-zinc-300">{log.title}</span>
                {log.details && <span className="text-zinc-500 block text-[11px] mt-0.5">{log.details}</span>}
              </div>
              <span className="text-[11px] font-mono text-zinc-600">{log.timestamp}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
