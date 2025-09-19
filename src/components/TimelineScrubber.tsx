/**
 * Advanced timeline scrubber with visual feedback and precise control
 * Provides frame-accurate scrubbing and preview capabilities
 */

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useTimelineStore } from "../store/useTimeline";
import { useEditorStore } from "../store/useEditor";

type TimelineScrubberProps = {
  className?: string;
  showPreview?: boolean;
  onScrub?: (time: number) => void;
};

export default function TimelineScrubber({
  className = "",
  showPreview = false,
  onScrub
}: TimelineScrubberProps) {
  const scrubberRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const pendingTimeRef = useRef<number | null>(null);
  const wasPlayingRef = useRef(false);

  const { currentTime, setCurrentTime, timelines } = useTimelineStore();
  const editorState = useEditorStore();
  const [fallbackPlaying, setFallbackPlaying] = useState(false);
  const [fallbackFrame, setFallbackFrame] = useState(0);

  const durationSec = typeof editorState.durationSec === "number"
    ? editorState.durationSec
    : (editorState as any).duration ?? 1;

  const fps = typeof editorState.fps === "number"
    ? editorState.fps
    : (editorState as any).framesPerSecond ?? 30;

  const currentFrame = typeof editorState.currentFrame === "number"
    ? editorState.currentFrame
    : fallbackFrame;

  const setEditorCurrentFrame = typeof editorState.setCurrentFrame === "function"
    ? editorState.setCurrentFrame
    : setFallbackFrame;

  const playing = typeof editorState.playing === "boolean"
    ? editorState.playing
    : fallbackPlaying;

  const setEditorPlaying = typeof editorState.setPlaying === "function"
    ? editorState.setPlaying
    : setFallbackPlaying;
  const totalFrames = Math.max(1, Math.round(durationSec * fps));
  const maxFrameIndex = Math.max(0, totalFrames - 1);

  const applyTimelineUpdate = useCallback((time: number) => {
    const clamped = Math.max(0, Math.min(1, time));
    setCurrentTime(clamped);
    const frameIndex = maxFrameIndex > 0 ? Math.round(clamped * maxFrameIndex) : 0;
    setEditorCurrentFrame(frameIndex);
    onScrub?.(clamped);
  }, [maxFrameIndex, onScrub, setEditorCurrentFrame, setCurrentTime]);

  const scheduleTimelineUpdate = useCallback((time: number) => {
    const clamped = Math.max(0, Math.min(1, time));
    pendingTimeRef.current = clamped;
    if (rafIdRef.current !== null) return;

    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      const pending = pendingTimeRef.current;
      pendingTimeRef.current = null;
      if (pending !== null) {
        applyTimelineUpdate(pending);
      }
    });
  }, [applyTimelineUpdate]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!scrubberRef.current) return;

    const rect = scrubberRef.current.getBoundingClientRect();
    const normalizedTime = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));

    wasPlayingRef.current = playing;
    if (playing) {
      setEditorPlaying(false);
    }

    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    pendingTimeRef.current = null;

    setIsDragging(true);
    setHoverTime(normalizedTime);
    applyTimelineUpdate(normalizedTime);
    e.preventDefault();
  }, [applyTimelineUpdate, playing, setEditorPlaying]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!scrubberRef.current) return;

    const rect = scrubberRef.current.getBoundingClientRect();
    const normalizedTime = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));

    if (isDragging) {
      scheduleTimelineUpdate(normalizedTime);
      e.preventDefault();
    } else {
      setHoverTime(normalizedTime);
    }
  }, [isDragging, scheduleTimelineUpdate]);

  const handleReactMouseMove = useCallback((e: React.MouseEvent) => {
    if (!scrubberRef.current || isDragging) return;

    const rect = scrubberRef.current.getBoundingClientRect();
    const normalizedTime = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverTime(normalizedTime);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    if (pendingTimeRef.current !== null) {
      applyTimelineUpdate(pendingTimeRef.current);
      pendingTimeRef.current = null;
    }

    setIsDragging(false);

    if (wasPlayingRef.current) {
      setEditorPlaying(true);
    }
    wasPlayingRef.current = false;
  }, [applyTimelineUpdate, setEditorPlaying]);

  const handleMouseLeave = useCallback(() => {
    setHoverTime(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  const formatTime = useCallback((time: number) => {
    const seconds = time * durationSec;
    const frame = maxFrameIndex > 0 ? Math.round(time * maxFrameIndex) : 0;
    return { seconds, frame };
  }, [durationSec, maxFrameIndex]);

  const currentFrameTime = formatTime(currentTime);
  const hoverFrameTime = hoverTime ? formatTime(hoverTime) : null;

  return (
    <div className={`timeline-scrubber ${className}`}>
      {/* Time display */}
      <div className="flex items-center justify-between mb-2 text-xs">
        <div className="font-mono text-gray-600">
          Frame {currentFrameTime.frame + 1} / {totalFrames}
        </div>
        <div className="font-mono text-gray-600">
          {currentFrameTime.seconds.toFixed(2)}s / {durationSec.toFixed(1)}s
        </div>
      </div>

      {/* Scrubber track */}
      <div
        ref={scrubberRef}
        className="relative h-8 bg-gray-200 rounded cursor-pointer select-none"
        data-testid="timeline-scrubber-track"
        onMouseDown={handleMouseDown}
        onMouseMove={handleReactMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Background with keyframe indicators */}
        <ScrubberBackground timelines={timelines} />

        {/* Progress fill */}
        <div
          className="absolute top-0 left-0 h-full bg-blue-500 rounded transition-all duration-100"
          style={{ width: `${currentTime * 100}%` }}
          role="presentation"
        />

        {/* Hover preview */}
        {hoverTime !== null && !isDragging && (
          <div
            className="absolute top-0 w-0.5 h-full bg-yellow-400 opacity-60"
            style={{ left: `${hoverTime * 100}%` }}
            role="presentation"
          />
        )}

        {/* Current time handle */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 w-4 h-6 bg-white border-2 border-blue-500 rounded cursor-pointer shadow-sm ${
            isDragging ? 'ring-2 ring-blue-300' : ''
          }`}
          style={{ left: `${currentTime * 100}%`, marginLeft: '-8px' }}
          role="presentation"
        />

        {/* Frame markers */}
        <FrameMarkers totalFrames={totalFrames} duration={durationSec} />
      </div>

      {/* Hover tooltip */}
      {hoverFrameTime && hoverTime !== null && !isDragging && (
        <div
          className="absolute -top-8 bg-black text-white text-xs px-2 py-1 rounded pointer-events-none z-50"
          style={{ left: `${hoverTime * 100}%`, transform: 'translateX(-50%)' }}
        >
          F{hoverFrameTime.frame + 1} ({hoverFrameTime.seconds.toFixed(2)}s)
        </div>
      )}
    </div>
  );
}

function ScrubberBackground({ timelines }: { timelines: Record<string, any> }) {
  const keyframeTimes = new Set<number>();

  // Collect all keyframe times
  Object.values(timelines).forEach((timeline: any) => {
    timeline.keyframes?.forEach((kf: any) => {
      keyframeTimes.add(kf.time);
    });
  });

  return (
    <>
      {Array.from(keyframeTimes).map((time) => (
        <div
          key={time}
          className="absolute top-0 w-0.5 h-full bg-blue-300 opacity-50"
          data-testid="timeline-keyframe-indicator"
          style={{ left: `${time * 100}%` }}
          role="presentation"
        />
      ))}
    </>
  );
}

function FrameMarkers({ totalFrames, duration }: { totalFrames: number; duration: number }) {
  const markers = [];
  const step = Math.max(1, Math.floor(totalFrames / 20)); // Show max 20 markers

  for (let i = 0; i <= totalFrames; i += step) {
    const time = i / totalFrames;
    markers.push(
      <div
        key={i}
        className="absolute top-0 w-px h-2 bg-gray-400 opacity-60"
        style={{ left: `${time * 100}%` }}
        role="presentation"
      />
    );
  }

  return <>{markers}</>;
}

export function PlaybackControls({ className = "" }: { className?: string }) {
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const { currentTime, setCurrentTime } = useTimelineStore();
  const editorState = useEditorStore();
  const [fallbackPlaying, setFallbackPlaying] = useState(false);
  const [fallbackFrame, setFallbackFrame] = useState(0);

  const durationSec = typeof editorState.durationSec === "number"
    ? editorState.durationSec
    : (editorState as any).duration ?? 1;

  const fps = typeof editorState.fps === "number"
    ? editorState.fps
    : (editorState as any).framesPerSecond ?? 30;

  const currentFrame = typeof editorState.currentFrame === "number"
    ? editorState.currentFrame
    : fallbackFrame;

  const playing = typeof editorState.playing === "boolean"
    ? editorState.playing
    : fallbackPlaying;

  const setEditorPlaying = typeof editorState.setPlaying === "function"
    ? editorState.setPlaying
    : setFallbackPlaying;

  const setEditorCurrentFrame = typeof editorState.setCurrentFrame === "function"
    ? editorState.setCurrentFrame
    : setFallbackFrame;

  const play = useCallback(() => {
    setEditorPlaying(true);
  }, [setEditorPlaying]);

  const pause = useCallback(() => {
    setEditorPlaying(false);
  }, [setEditorPlaying]);

  const stop = useCallback(() => {
    setEditorPlaying(false);
    setCurrentTime(0);
    setEditorCurrentFrame(0);
  }, [setEditorPlaying, setCurrentTime, setEditorCurrentFrame]);

  const stepForward = useCallback(() => {
    const total = Math.max(1, Math.round(durationSec * fps));
    const maxFrame = Math.max(0, total - 1);
    if (maxFrame === 0) return;

    const nextFrame = Math.min(maxFrame, currentFrame + 1);
    const normalized = maxFrame > 0 ? nextFrame / maxFrame : 0;
    setCurrentTime(normalized);
    setEditorCurrentFrame(nextFrame);
  }, [currentFrame, durationSec, fps, setCurrentTime, setEditorCurrentFrame]);

  const stepBackward = useCallback(() => {
    const total = Math.max(1, Math.round(durationSec * fps));
    const maxFrame = Math.max(0, total - 1);
    if (maxFrame === 0) return;

    const previousFrame = Math.max(0, currentFrame - 1);
    const normalized = maxFrame > 0 ? previousFrame / maxFrame : 0;
    setCurrentTime(normalized);
    setEditorCurrentFrame(previousFrame);
  }, [currentFrame, durationSec, fps, setCurrentTime, setEditorCurrentFrame]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }
      event.preventDefault();
      const currentlyPlaying = useEditorStore.getState().playing;
      if (currentlyPlaying) {
        pause();
      } else {
        play();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pause, play]);


  return (
    <div className={`playback-controls flex items-center space-x-2 ${className}`}>
      {/* Step backward */}
      <button
        onClick={stepBackward}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            stepBackward();
          }
        }}
        className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
        title="Previous frame"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
        </svg>
      </button>

      {/* Play/Pause */}
      <button
        onClick={playing ? pause : play}
        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
        title={playing ? "Pause" : "Play"}
      >
        {playing ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        )}
      </button>

      {/* Stop */}
      <button
        onClick={stop}
        className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
        title="Stop"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 6h12v12H6z"/>
        </svg>
      </button>

      {/* Step forward */}
      <button
        onClick={stepForward}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            stepForward();
          }
        }}
        className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
        title="Next frame"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
        </svg>
      </button>

      {/* Speed control */}
      <div className="flex items-center space-x-1 ml-4">
        <span className="text-xs text-gray-500">Speed:</span>
        <select
          value={playbackSpeed}
          onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
          className="text-xs border border-gray-300 rounded px-1 py-0.5"
        >
          <option value={0.25}>0.25x</option>
          <option value={0.5}>0.5x</option>
          <option value={1}>1x</option>
          <option value={2}>2x</option>
          <option value={4}>4x</option>
        </select>
      </div>
    </div>
  );
}
