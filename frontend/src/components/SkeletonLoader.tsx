import React from "react";

export const ShimmerBar: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`relative overflow-hidden bg-white/[0.04] rounded ${className}`}>
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent animate-shimmer" />
  </div>
);

export const ChartSkeleton: React.FC = () => (
  <div className="w-full h-full flex flex-col p-4 space-y-4">
    {/* KPI Bar Skeletons */}
    <div className="grid grid-cols-4 gap-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-black/60 border border-white/[0.06] rounded-lg p-2.5 space-y-2">
          <ShimmerBar className="h-3 w-16" />
          <ShimmerBar className="h-5 w-24" />
        </div>
      ))}
    </div>

    {/* Champion Banner Skeleton */}
    <div className="bg-black/60 border border-white/[0.06] rounded-lg p-3 space-y-2">
      <div className="flex justify-between items-center">
        <ShimmerBar className="h-4 w-48" />
        <ShimmerBar className="h-3 w-28" />
      </div>
      <div className="grid grid-cols-2 gap-2 pt-1">
        <ShimmerBar className="h-12 w-full" />
        <ShimmerBar className="h-12 w-full" />
      </div>
    </div>

    {/* Graph Area Skeleton */}
    <div className="flex-1 bg-black/40 border border-white/[0.05] rounded-lg p-4 flex flex-col justify-between min-h-[200px]">
      <div className="flex justify-between items-center">
        <ShimmerBar className="h-3 w-32" />
        <ShimmerBar className="h-3 w-20" />
      </div>
      <div className="space-y-3 py-6">
        <ShimmerBar className="h-px w-full" />
        <ShimmerBar className="h-px w-full" />
        <ShimmerBar className="h-px w-full" />
      </div>
      <div className="flex justify-between">
        <ShimmerBar className="h-2 w-12" />
        <ShimmerBar className="h-2 w-12" />
        <ShimmerBar className="h-2 w-12" />
        <ShimmerBar className="h-2 w-12" />
      </div>
    </div>
  </div>
);

export const VideoSkeleton: React.FC = () => (
  <div className="w-full h-full flex flex-col p-4 space-y-3">
    {/* Player Header */}
    <div className="flex justify-between items-center">
      <ShimmerBar className="h-4 w-36" />
      <ShimmerBar className="h-4 w-20" />
    </div>

    {/* Video Screen */}
    <div className="flex-1 bg-black/80 border border-white/[0.06] rounded-xl relative overflow-hidden flex items-center justify-center min-h-[240px]">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent animate-shimmer" />
      <div className="w-12 h-12 rounded-full border border-white/[0.08] flex items-center justify-center bg-white/[0.02]">
        <div className="w-4 h-4 rounded-sm bg-white/[0.1]" />
      </div>
    </div>

    {/* Shot Track Breakdown */}
    <div className="space-y-2 pt-1">
      <div className="flex justify-between">
        <ShimmerBar className="h-3 w-28" />
        <ShimmerBar className="h-3 w-16" />
      </div>
      <div className="grid grid-cols-5 gap-1.5 h-10">
        {[1, 2, 3, 4, 5].map((i) => (
          <ShimmerBar key={i} className="h-full rounded-md" />
        ))}
      </div>
    </div>
  </div>
);
