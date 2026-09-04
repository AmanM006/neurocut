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
    <div className="bg-[#101620] border border-slate-800 rounded-xl p-4 flex flex-col h-full shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Film className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-wide text-slate-100 uppercase">
              Panel A // Live Compiled Timeline
            </h2>
            <p className="text-xs text-slate-400">Physical FFmpeg MP4 Compilation</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 text-xs font-mono font-medium rounded-md bg-slate-800 text-slate-300 border border-slate-700">
            Attempt #{attemptN}
          </span>
          <span className="px-2.5 py-1 text-xs font-mono font-bold rounded-md bg-cyan-950 text-cyan-400 border border-cyan-800/50">
            Reward: {(reward || 0).toFixed(4)}
          </span>
        </div>
      </div>

      {/* Video Player */}
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-slate-800/80 shadow-inner flex items-center justify-center group">
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            playsInline
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="text-center p-6 text-slate-500">
            <Play className="w-10 h-10 mx-auto mb-2 opacity-40 animate-pulse" />
            <p className="text-xs">Initializing timeline and compiling first cut...</p>
          </div>
        )}
      </div>

      {/* Timeline Breakdown Track */}
      <div className="mt-4 pt-3 border-t border-slate-800/70">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span className="flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-slate-400" /> Shot Breakdown ({clips.length} shots)
          </span>
          <span className="flex items-center gap-1 font-mono">
            <Clock className="w-3.5 h-3.5 text-slate-400" /> Total: {totalDuration.toFixed(1)}s
          </span>
        </div>

        {/* Visual Timeline Bar */}
        <div className="w-full h-8 bg-slate-900 rounded-md border border-slate-800 overflow-hidden flex gap-0.5 p-0.5">
          {clips.map((clip, idx) => {
            const widthPct = totalDuration > 0 ? (clip.duration_seconds / totalDuration) * 100 : 25;
            const isWorst = clip.clip_id === worstClipId;
            const isBroll = clip.is_broll;

            let bgColor = "bg-slate-700 text-slate-200";
            if (isBroll) {
              bgColor = "bg-gradient-to-r from-amber-600 to-amber-500 text-black font-bold shadow-lg";
            } else if (isWorst) {
              bgColor = "bg-rose-900/80 text-rose-200 border border-rose-600/50";
            } else if (clip.scene_id.includes("climax")) {
              bgColor = "bg-emerald-900/80 text-emerald-200";
            } else if (clip.scene_id.includes("confrontation")) {
              bgColor = "bg-blue-900/80 text-blue-200";
            }

            return (
              <div
                key={`${clip.clip_id}-${idx}`}
                style={{ width: `${Math.max(widthPct, 8)}%` }}
                className={`h-full rounded-sm ${bgColor} text-[10px] font-mono flex items-center justify-center px-1 truncate transition-all duration-300 relative group/clip`}
                title={`${clip.clip_id} (${clip.duration_seconds}s) ${isBroll ? '[SHOWRUNNER B-ROLL]' : ''}`}
              >
                {isBroll && <Sparkles className="w-2.5 h-2.5 mr-0.5 inline-block shrink-0" />}
                <span className="truncate">{clip.clip_id.replace('shot_', '').replace('_dialogue', '')}</span>
                <span className="ml-1 opacity-70">({clip.duration_seconds}s)</span>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-700" />
            <span>Story Shot</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
            <span className="text-amber-400 font-medium">Veo B-Roll Injection</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-800" />
            <span className="text-rose-400">Pacing Drop Bottleneck</span>
          </div>
        </div>
      </div>
    </div>
  );
};
