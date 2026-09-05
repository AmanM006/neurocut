"use client";

import React, { useRef, useEffect } from "react";
import { Film, Play, Sparkles, Clock, Layers } from "lucide-react";

interface Clip {
  clip_id: string;
  scene_id: string;
  take_id: string;
  duration_seconds?: number;
  duration?: number;
  duration_frames?: number;
  fps?: number;
  is_broll?: boolean;
  description?: string;
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

  const getDuration = (c: any): number => {
    if (typeof c?.duration_seconds === "number" && !isNaN(c.duration_seconds)) return c.duration_seconds;
    if (typeof c?.duration === "number" && !isNaN(c.duration)) return c.duration;
    if (typeof c?.duration_frames === "number" && c?.fps) return c.duration_frames / c.fps;
    return 4.0;
  };

  const steps = clips.length > 0 ? clips : [
    { clip_id: "shot_01_intro", scene_id: "intro", take_id: "take_1", duration_seconds: 4.0, is_broll: false, description: "Opening Establishing Shot" },
    { clip_id: "shot_02_dialogue", scene_id: "dialogue", take_id: "take_2", duration_seconds: 4.5, is_broll: false, description: "Tense Character Exchange" },
    { clip_id: "shot_03_standoff", scene_id: "standoff", take_id: "take_1", duration_seconds: 6.0, is_broll: false, description: "Pacing Bottleneck Sequence" },
    { clip_id: "broll_veo_cutaway", scene_id: "standoff", take_id: "veo_3.1", duration_seconds: 2.0, is_broll: true, description: "Showrunner Veo 3.1 B-Roll Cutaway" },
    { clip_id: "shot_05_climax", scene_id: "climax", take_id: "take_1", duration_seconds: 5.5, is_broll: false, description: "Climactic Breakthrough Action" },
  ];

  const totalDuration = steps.reduce((acc, c) => acc + getDuration(c), 0);

  return (
    <div className="bg-[#050505] border border-[#1a1a1a] rounded-xl p-5 flex flex-col justify-between h-full font-inter">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-[#1a1a1a] mb-4 gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
            <Film className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white truncate">
              Timeline Monitor
            </h3>
            <p className="text-xs text-zinc-500 truncate mt-0.5">
              Autonomous Cut • 1280x720 @ 24fps
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="px-2.5 py-1 text-xs font-mono rounded-lg bg-[#0a0a0a] text-zinc-400 border border-[#222222]">
            Cut #{attemptN}
          </span>
          <span className="px-2.5 py-1 text-xs font-mono font-semibold rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
            {(reward || 0.7301).toFixed(4)}
          </span>
        </div>
      </div>

      {/* Video Player Bezel */}
      <div className="relative aspect-video bg-[#000000] rounded-lg overflow-hidden border border-[#222222] flex items-center justify-center">
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            playsInline
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="text-center p-6 text-zinc-500">
            <Play className="w-8 h-8 mx-auto mb-2 opacity-40 text-indigo-400 animate-pulse" />
            <p className="text-xs font-medium text-zinc-400">Compiling rough cut video stream...</p>
          </div>
        )}
      </div>

      {/* Timeline Breakdown Track */}
      <div className="mt-4 pt-3.5 border-t border-[#1a1a1a]">
        <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
          <span className="flex items-center gap-1.5 font-medium">
            <Layers className="w-3.5 h-3.5 text-zinc-500" /> Sequence Structure ({steps.length} shots)
          </span>
          <span className="flex items-center gap-1.5 font-mono text-zinc-300">
            <Clock className="w-3.5 h-3.5 text-zinc-500" /> {totalDuration.toFixed(1)}s Total
          </span>
        </div>

        {/* Visual Multi-Track Bar */}
        <div className="w-full h-8 bg-[#0a0a0a] rounded-lg border border-[#222222] overflow-hidden flex gap-1 p-1">
          {steps.map((clip, idx) => {
            const widthPct = totalDuration > 0 ? (getDuration(clip) / totalDuration) * 100 : 25;
            const isWorst = clip.clip_id === worstClipId;
            const isBroll = clip.is_broll;

            let bgColor = "bg-[#141414] text-zinc-300 border border-[#262626]";
            if (isBroll) {
              bgColor = "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-semibold";
            } else if (isWorst) {
              bgColor = "bg-rose-950/40 text-rose-300 border border-rose-500/40";
            }

            return (
              <div
                key={`${clip.clip_id}-${idx}`}
                style={{ width: `${Math.max(widthPct, 12)}%` }}
                className={`h-full rounded ${bgColor} text-xs flex items-center justify-center px-1.5 truncate transition-all relative group/clip`}
                title={`${clip.clip_id} (${getDuration(clip).toFixed(1)}s)`}
              >
                {isBroll && <Sparkles className="w-3 h-3 mr-1 inline-block shrink-0 text-indigo-400" />}
                <span className="truncate text-[11px] font-medium">{clip.clip_id.replace("shot_", "").replace("_dialogue", "")}</span>
                <span className="ml-1 opacity-60 font-mono text-[10px]">({getDuration(clip).toFixed(1)}s)</span>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-2.5 text-[11px] text-zinc-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-[#1a1a1a] border border-[#333333]" />
            <span>Narrative</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-indigo-500/40 border border-indigo-500/60" />
            <span className="text-indigo-400 font-medium">Veo B-Roll</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-rose-500/40 border border-rose-500/60" />
            <span className="text-rose-400 font-medium">Bottleneck</span>
          </div>
        </div>
      </div>
    </div>
  );
};
