/**
 * Advanced timeline scrubber with visual feedback and precise control
 * Provides frame-accurate scrubbing and preview capabilities
 */

import { useState, useRef, useCallback, useEffect } from "react";
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

  const { currentTime, setCurrentTime, timelines } = useTimelineStore();
  const { durationSec, fps, currentFrame, setCurrentFrame } = useEditorStore();
  const totalFrames = Math.ceil(durationSec * fps);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!scrubberRef.current) return;

    setIsDragging(true);
    const rect = scrubberRef.current.getBoundingClientRect();
    const normalizedTime = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));

    // Update timeline and frame immediately for responsive scrubbing
    setCurrentTime(normalizedTime);
    const frameIndex = Math.round(normalizedTime * totalFrames) % totalFrames;
    setCurrentFrame(frameIndex);
    console.log('TimelineScrubber: Scrubbing to time:', normalizedTime, 'frame:', frameIndex);
    onScrub?.(normalizedTime);
  }, [setCurrentTime, setCurrentFrame, totalFrames, onScrub]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!scrubberRef.current) return;

    const rect = scrubberRef.current.getBoundingClientRect();
    const normalizedTime = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));

    if (isDragging) {
      // Update timeline and frame immediately for continuous scrubbing
      setCurrentTime(normalizedTime);
      const frameIndex = Math.round(normalizedTime * totalFrames) % totalFrames;
      setCurrentFrame(frameIndex);
      console.log('TimelineScrubber: Continuous scrubbing to time:', normalizedTime, 'frame:', frameIndex);
      onScrub?.(normalizedTime);
    } else {
      setHoverTime(normalizedTime);
    }
  }, [isDragging, setCurrentTime, setCurrentFrame, totalFrames, onScrub]);

  const handleReactMouseMove = useCallback((e: React.MouseEvent) => {
    if (!scrubberRef.current || isDragging) return;

    const rect = scrubberRef.current.getBoundingClientRect();
    const normalizedTime = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverTime(normalizedTime);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

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

  // Calculate frame-based time snapping
  const snapToFrame = useCallback((time: number) => {
    const frameTime = 1 / totalFrames;
    return Math.round(time / frameTime) * frameTime;
  }, [totalFrames]);

  const formatTime = useCallback((time: number) => {
    const seconds = time * durationSec;
    const frame = Math.floor(time * totalFrames);
    return { seconds, frame };
  }, [durationSec, totalFrames]);

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
        />

        {/* Hover preview */}
        {hoverTime !== null && !isDragging && (
          <div
            className="absolute top-0 w-0.5 h-full bg-yellow-400 opacity-60"
            style={{ left: `${hoverTime * 100}%` }}
          />
        )}

        {/* Current time handle */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 w-4 h-6 bg-white border-2 border-blue-500 rounded cursor-pointer shadow-sm ${
            isDragging ? 'ring-2 ring-blue-300' : ''
          }`}
          style={{ left: `${currentTime * 100}%`, marginLeft: '-8px' }}
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
          style={{ left: `${time * 100}%` }}
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
      />
    );
  }

  return <>{markers}</>;
}

export function PlaybackControls({ className = "" }: { className?: string }) {
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const { currentTime, setCurrentTime } = useTimelineStore();
  const { durationSec, fps, playing, setPlaying, setCurrentFrame } = useEditorStore();

  const play = useCallback(() => {
    setPlaying(true);
  }, [setPlaying]);

  const pause = useCallback(() => {
    setPlaying(false);
  }, [setPlaying]);

  const stop = useCallback(() => {
    setPlaying(false);
    setCurrentTime(0);
    setCurrentFrame(0);
  }, [setPlaying, setCurrentTime, setCurrentFrame]);

  const stepForward = useCallback(() => {
    const totalFrames = durationSec * fps;
    const frameTime = 1 / totalFrames;
    const newTime = Math.min(1, currentTime + frameTime);
    setCurrentTime(newTime);
    const frameIndex = Math.round(newTime * totalFrames) % totalFrames;
    setCurrentFrame(frameIndex);
  }, [durationSec, fps, currentTime, setCurrentTime, setCurrentFrame]);

  const stepBackward = useCallback(() => {
    const totalFrames = durationSec * fps;
    const frameTime = 1 / totalFrames;
    const newTime = Math.max(0, currentTime - frameTime);
    setCurrentTime(newTime);
    const frameIndex = Math.round(newTime * totalFrames) % totalFrames;
    setCurrentFrame(frameIndex);
  }, [durationSec, fps, currentTime, setCurrentTime, setCurrentFrame]);


  return (
    <div className={`playback-controls flex items-center space-x-2 ${className}`}>
      {/* Step backward */}
      <button
        onClick={stepBackward}
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