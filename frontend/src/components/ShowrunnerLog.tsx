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
    <div className="bg-[#101620] border border-slate-800 rounded-xl p-4 flex flex-col h-full shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-wide text-slate-100 uppercase">
              Panel C // Showrunner Decision Stream
            </h2>
            <p className="text-xs text-slate-400">Google ADK Agent & Autonomous Intervention Log</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-mono text-[11px] text-emerald-400 font-medium">ADK SUPERVISOR LIVE</span>
        </div>
      </div>

      {/* Scrolling Stream Area */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 font-mono text-xs max-h-[500px]">
        {logs.map((log) => {
          if (log.type === "intervention") {
            return (
              <div
                key={log.id}
                className="bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-transparent border border-amber-500/40 rounded-lg p-3 shadow-lg transition-all"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/40">
                    <Sparkles className="w-3 h-3 text-amber-400" /> SHOWRUNNER INTERVENTION
                  </span>
                  <span className="text-[10px] text-slate-500">{log.timestamp}</span>
                </div>
                <div className="font-semibold text-slate-100 text-xs flex items-center gap-1.5">
                  {log.title}
                </div>
                {log.details && (
                  <p className="mt-1.5 text-[11px] text-amber-200/90 leading-relaxed bg-black/30 p-2 rounded border border-amber-500/20">
                    {log.details}
                  </p>
                )}
                {log.reward !== undefined && (
                  <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-2">
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
                className="bg-slate-900/60 border border-slate-800/90 rounded-lg p-2.5 transition-all"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <Cpu className="w-3 h-3 text-cyan-400" />
                    <span className="text-slate-200 font-medium">{log.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">{log.timestamp}</span>
                </div>
                {log.details && <p className="text-[11px] text-slate-400 mt-1">{log.details}</p>}
              </div>
            );
          }

          if (log.type === "query") {
            return (
              <div
                key={log.id}
                className="bg-slate-950 border border-slate-800/60 rounded p-2 text-[10px] text-slate-400"
              >
                <span className="text-cyan-400 font-bold mr-1.5">[MCP-CLICKHOUSE]</span>
                <span>{log.title}</span>
                {log.details && <div className="text-slate-500 mt-0.5 font-mono">{log.details}</div>}
              </div>
            );
          }

          return (
            <div key={log.id} className="text-slate-400 text-[11px] flex items-start gap-2 py-0.5">
              <span className="text-slate-600 select-none">›</span>
              <div className="flex-1">
                <span className="text-slate-300">{log.title}</span>
                {log.details && <span className="text-slate-500 block text-[10px]">{log.details}</span>}
              </div>
              <span className="text-[9px] text-slate-600">{log.timestamp}</span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
