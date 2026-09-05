"use client";

import React, { useRef, useEffect } from "react";
import { Film, Play, Sparkles, Clock, Layers } from "lucide-react";

interface Clip {
  clip_id: string;
  scene_id: string;
  take_id: string;
  duration_seconds: number;
  is_broll: boolean;
  description: string;
}

interface VideoPreviewProps {
  videoUrl: string;
  clips: Clip[];
  attemptN: number;
  reward: number;
  worstClipId: string | null;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({
  videoUrl,
  clips,
  attemptN,
  reward,
  worstClipId
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [videoUrl]);

  const totalDuration = clips.reduce((acc, c) => acc + c.duration_seconds, 0);

  return (
    <div className="bg-[#050505] border border-white/[0.08] rounded-xl p-4 flex flex-col h-full shadow-2xl relative overflow-hidden">
      {/* Top Ambient Glow Accent */}
      <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.06] mb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm">
            <Film className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold tracking-wider text-white uppercase font-mono">
              Panel A // Live Compiled Timeline
            </h2>
            <p className="text-[11px] text-white/40 font-mono">Physical FFmpeg MP4 Compilation</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-white/[0.03] text-white/70 border border-white/[0.08]">
            Attempt #{attemptN}
          </span>
          <span className="px-2.5 py-1 text-xs font-mono font-bold rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm">
            Reward: {(reward || 0).toFixed(4)}
          </span>
        </div>
      </div>

      {/* Video Player */}
      <div className="relative aspect-video bg-[#000000] rounded-xl overflow-hidden border border-white/[0.08] shadow-2xl flex items-center justify-center group">
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            playsInline
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="text-center p-6 text-white/30 font-mono">
            <Play className="w-10 h-10 mx-auto mb-2 opacity-30 animate-pulse text-amber-400" />
            <p className="text-xs">Initializing timeline and compiling first cut...</p>
          </div>
        )}
      </div>

      {/* Timeline Breakdown Track */}
      <div className="mt-4 pt-3.5 border-t border-white/[0.06]">
        <div className="flex items-center justify-between text-xs text-white/40 mb-2 font-mono">
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-white/30" /> Shot Breakdown ({clips.length} shots)
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-white/30" /> Total: {totalDuration.toFixed(1)}s
          </span>
        </div>

        {/* Visual Timeline Bar */}
        <div className="w-full h-9 bg-[#08080a] rounded-lg border border-white/[0.06] overflow-hidden flex gap-1 p-1 shadow-inner">
          {clips.map((clip, idx) => {
            const widthPct = totalDuration > 0 ? (clip.duration_seconds / totalDuration) * 100 : 25;
            const isWorst = clip.clip_id === worstClipId;
            const isBroll = clip.is_broll;

            let bgColor = "bg-white/[0.08] text-white/80 border border-white/[0.06]";
            if (isBroll) {
              bgColor = "bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold shadow-md shadow-amber-500/20";
            } else if (isWorst) {
              bgColor = "bg-rose-950/70 text-rose-300 border border-rose-500/50 shadow-sm";
            } else if (clip.scene_id.includes("climax")) {
              bgColor = "bg-emerald-950/70 text-emerald-300 border border-emerald-500/40";
            } else if (clip.scene_id.includes("confrontation")) {
              bgColor = "bg-blue-950/70 text-blue-300 border border-blue-500/40";
            }

            return (
              <div
                key={`${clip.clip_id}-${idx}`}
                style={{ width: `${Math.max(widthPct, 8)}%` }}
                className={`h-full rounded-md ${bgColor} text-[10px] font-mono flex items-center justify-center px-1.5 truncate transition-all duration-200 relative group/clip`}
                title={`${clip.clip_id} (${clip.duration_seconds}s) ${isBroll ? '[SHOWRUNNER B-ROLL]' : ''}`}
              >
                {isBroll && <Sparkles className="w-3 h-3 mr-1 inline-block shrink-0" />}
                <span className="truncate">{clip.clip_id.replace('shot_', '').replace('_dialogue', '')}</span>
                <span className="ml-1 opacity-60">({clip.duration_seconds}s)</span>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-2.5 text-[10px] text-white/40 font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-white/[0.1] border border-white/[0.06]" />
            <span>Story Shot</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 shadow-sm" />
            <span className="text-amber-400 font-medium">Veo B-Roll Injection</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500/80 border border-rose-400/40" />
            <span className="text-rose-400">Pacing Drop Bottleneck</span>
          </div>
        </div>
      </div>
    </div>
  );
};
