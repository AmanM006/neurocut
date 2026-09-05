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
    <div className="bg-[#050505] border border-[#1a1a1a] rounded-xl p-5 flex flex-col justify-between h-full font-inter">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-[#1a1a1a] mb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              Showrunner Activity Feed
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Google ADK Decisions &amp; Real-time SSE Stream
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Active</span>
        </div>
      </div>

      {/* Scrolling Feed */}
      <div ref={containerRef} className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs max-h-[380px]">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-zinc-500 text-xs">
            <Terminal className="w-6 h-6 text-zinc-600 mb-2" />
            <span>Awaiting Showrunner agent decisions...</span>
          </div>
        ) : (
          logs.map((log) => {
            if (log.type === "intervention") {
              return (
                <div
                  key={log.id}
                  className="bg-[#0e0c14] border border-indigo-500/30 rounded-lg p-3 transition-all"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 uppercase tracking-wide">
                      <Sparkles className="w-3 h-3 text-indigo-400" /> Veo Cutaway Injected
                    </span>
                    <span className="text-[11px] font-mono text-zinc-500">{log.timestamp}</span>
                  </div>
                  <div className="font-semibold text-white text-xs">
                    {log.title}
                  </div>
                  {log.details && (
                    <p className="mt-1 text-xs text-zinc-300 leading-relaxed bg-black/40 p-2 rounded border border-indigo-500/15">
                      {log.details}
                    </p>
                  )}
                  {log.reward !== undefined && (
                    <div className="mt-1.5 text-[11px] text-zinc-400 flex items-center gap-1.5">
                      <span>Reward Delta:</span>
                      <span className="text-emerald-400 font-bold font-mono">+{log.reward.toFixed(4)}</span>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div
                key={log.id}
                className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-2.5 transition-all"
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
          })
        )}
      </div>
    </div>
  );
};
