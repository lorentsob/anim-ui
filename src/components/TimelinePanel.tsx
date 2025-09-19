/**
 * Complete timeline panel integrating scrubber, controls, and keyframe editing
 * The main timeline interface for BW Animator
 */

import React, { useState, useCallback, useEffect } from "react";
import Timeline from "./Timeline";
import TimelineScrubber, { PlaybackControls } from "./TimelineScrubber";
import { useTimelineStore } from "../store/useTimeline";
import { useEditorStore } from "../store/useEditor";
import { easingOptions, type EasingType } from "../lib/easing";

type TimelinePanelProps = {
  className?: string;
  isVisible?: boolean;
  onToggle?: () => void;
};

export default function TimelinePanel({
  className = "",
  isVisible = true,
  onToggle
}: TimelinePanelProps) {
  const [timelineHeight, setTimelineHeight] = useState(180);

  const { timelines, currentTime, clearAllTimelines, setCurrentTime } = useTimelineStore();
  const editorState = useEditorStore();

  const durationSec = typeof editorState.durationSec === "number"
    ? editorState.durationSec
    : (editorState as any).duration ?? 1;

  const fps = typeof editorState.fps === "number"
    ? editorState.fps
    : (editorState as any).framesPerSecond ?? 30;

  const setCurrentFrame = typeof editorState.setCurrentFrame === "function"
    ? editorState.setCurrentFrame
    : () => {};

  const totalKeyframes = Object.values(timelines).reduce(
    (total, timeline) => total + timeline.keyframes.length,
    0
  );

  const handleScrub = useCallback((time: number) => {
    // Real-time timeline scrubbing - update timeline and editor stores directly
    setCurrentTime(time);

    // Calculate frame and update editor store for immediate viewport response
    const totalFrames = Math.max(1, Math.round(durationSec * fps));
    const maxFrameIndex = Math.max(0, totalFrames - 1);
    const frameIndex = maxFrameIndex > 0 ? Math.round(time * maxFrameIndex) : 0;
    setCurrentFrame(frameIndex);
  }, [setCurrentTime, setCurrentFrame, durationSec, fps]);

  if (!isVisible) {
    return (
      <div className={`timeline-panel-collapsed ${className}`}>
        <button
          onClick={onToggle}
          className="w-full p-2 bg-gray-100 border-t border-gray-200 text-sm text-gray-600 hover:bg-gray-200 flex items-center justify-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
          Timeline ({totalKeyframes} keyframes)
        </button>
      </div>
    );
  }

  return (
    <div className={`timeline-panel bg-white border border-ink ${className}`}>
      {/* Compact header with controls */}
      <div className="flex items-center justify-between bg-gray-50 border-b border-ink px-2 py-1">
        {/* Left side - playback controls */}
        <div className="flex items-center gap-2">
          <PlaybackControls className="compact" />
        </div>
        
        {/* Center - timeline info */}
        <div className="flex items-center gap-3 text-xs text-gray-600">
          <span>{totalKeyframes} keyframes</span>
          <span>{durationSec.toFixed(1)}s</span>
        </div>
        
        {/* Right side - actions */}
        <div className="flex items-center gap-2">
          <TimelineZoomControls />
          <button
            onClick={clearAllTimelines}
            className="text-xs text-red-600 hover:text-red-800"
            title="Clear all keyframes"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Timeline scrubber and tracks */}
      <div className="p-2">
        <TimelineScrubber onScrub={handleScrub} className="mb-2" />
        <Timeline height={timelineHeight} />
      </div>
    </div>
  );
}

// Simplified - removed unused tab components

function TimelineZoomControls() {
  const { zoom, setZoom } = useTimelineStore();

  return (
    <div className="flex items-center border border-gray-300 rounded text-xs">
      <button
        onClick={() => setZoom(zoom - 1)}
        className="px-1 hover:bg-gray-100 disabled:opacity-50"
        disabled={zoom <= 1}
      >
        -
      </button>
      <span className="px-1 min-w-[2ch] text-center">
        {zoom}x
      </span>
      <button
        onClick={() => setZoom(zoom + 1)}
        className="px-1 hover:bg-gray-100 disabled:opacity-50"
        disabled={zoom >= 10}
      >
        +
      </button>
    </div>
  );
}
