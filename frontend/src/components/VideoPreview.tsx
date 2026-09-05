"use client";

import React, { useRef, useEffect } from "react";
import { Film, Play, Sparkles, Clock, Layers, Maximize2 } from "lucide-react";

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
 <div className="bg-[#0c0c0e] border border-white/[0.07] rounded-2xl p-4 sm:p-5 flex flex-col h-full shadow-2xl relative overflow-hidden group">
 {/* Top Ambient Glow Accent */}
 <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent pointer-events-none" />

 {/* Header */}
 <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.06] mb-4">
 <div className="flex items-center gap-2.5">
 <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
 <Film className="w-4 h-4" />
 </div>
 <div>
 <h2 className="text-xs font-semibold tracking-tight text-white font-mono uppercase">
 Timeline Monitor // Live Cut
 </h2>
 <p className="text-[10px] text-zinc-500 font-mono">
 FFmpeg Stitch • 1280x720 @ 24fps
 </p>
 </div>
 </div>

 <div className="flex items-center gap-2">
 <span className="px-2.5 py-1 text-[11px] font-mono rounded-lg bg-white/[0.03] text-zinc-400 border border-white/[0.06]">
 Cut #{attemptN}
 </span>
 <span className="px-2.5 py-1 text-[11px] font-mono font-bold rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
 Reward: {(reward || 0).toFixed(4)}
 </span>
 </div>
 </div>

 {/* Video Player Bezel */}
 <div className="relative aspect-video bg-[#050507] rounded-xl overflow-hidden border border-white/[0.08] shadow-2xl flex items-center justify-center">
 {videoUrl ? (
 <video
 ref={videoRef}
 src={videoUrl}
 controls
 playsInline
 className="w-full h-full object-contain"
 />
 ) : (
 <div className="text-center p-6 text-zinc-600 font-mono">
 <Play className="w-8 h-8 mx-auto mb-2 opacity-30 animate-pulse text-indigo-400" />
 <p className="text-xs">Initializing timeline and compiling first cut...</p>
 </div>
 )}
 </div>

 {/* Timeline Breakdown Track */}
 <div className="mt-4 pt-3.5 border-t border-white/[0.06]">
 <div className="flex items-center justify-between text-xs text-zinc-400 mb-2 font-mono">
 <span className="flex items-center gap-1.5 text-[11px]">
 <Layers className="w-3.5 h-3.5 text-zinc-500" /> Sequence Structure ({clips.length} shots)
 </span>
 <span className="flex items-center gap-1.5 text-[11px]">
 <Clock className="w-3.5 h-3.5 text-zinc-500" /> Runtime: {totalDuration.toFixed(1)}s
 </span>
 </div>

 {/* Visual Multi-Track Bar */}
 <div className="w-full h-9 bg-[#060608] rounded-xl border border-white/[0.06] overflow-hidden flex gap-1 p-1 shadow-inner">
 {clips.map((clip, idx) => {
 const widthPct = totalDuration > 0 ? (clip.duration_seconds / totalDuration) * 100 : 25;
 const isWorst = clip.clip_id === worstClipId;
 const isBroll = clip.is_broll;

 let bgColor = "bg-white/[0.06] text-zinc-300 border border-white/[0.06]";
 if (isBroll) {
 bgColor = "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-semibold";
 } else if (isWorst) {
 bgColor = "bg-rose-950/60 text-rose-300 border border-rose-500/40";
 } else if (clip.scene_id.includes("climax")) {
 bgColor = "bg-emerald-950/50 text-emerald-300 border border-emerald-500/30";
 } else if (clip.scene_id.includes("confrontation")) {
 bgColor = "bg-blue-950/50 text-blue-300 border border-blue-500/30";
 }

 return (
 <div
 key={`${clip.clip_id}-${idx}`}
 style={{ width: `${Math.max(widthPct, 8)}%` }}
 className={`h-full rounded-lg ${bgColor} text-[10px] font-mono flex items-center justify-center px-1.5 truncate transition-all duration-200 relative group/clip`}
 title={`${clip.clip_id} (${clip.duration_seconds}s) ${isBroll ? '[SHOWRUNNER B-ROLL]' : ''}`}
 >
 {isBroll && <Sparkles className="w-2.5 h-2.5 mr-1 inline-block shrink-0 text-indigo-400" />}
 <span className="truncate">{clip.clip_id.replace("shot_", "").replace("_dialogue", "")}</span>
 <span className="ml-1 opacity-50">({clip.duration_seconds}s)</span>
 </div>
 );
 })}
 </div>

 {/* Minimal Legend */}
 <div className="flex items-center gap-4 mt-2.5 text-[10px] text-zinc-500 font-mono">
 <div className="flex items-center gap-1.5">
 <span className="w-2 h-2 rounded-sm bg-white/[0.1] border border-white/[0.06]" />
 <span>Narrative Shot</span>
 </div>
 <div className="flex items-center gap-1.5">
 <span className="w-2 h-2 rounded-sm bg-indigo-500/50 border border-indigo-500/60" />
 <span className="text-indigo-400">Veo B-Roll Injected</span>
 </div>
 <div className="flex items-center gap-1.5">
 <span className="w-2 h-2 rounded-sm bg-rose-500/50 border border-rose-500/60" />
 <span className="text-rose-400">Pacing Drop</span>
 </div>
 </div>
 </div>
 </div>
 );
};
