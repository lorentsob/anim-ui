/**
 * Timeline UI panel with keyframe editing and visual scrubbing
 * Provides comprehensive timeline controls for parameter automation
 */

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useTimelineStore } from "../store/useTimeline";
import { useEditorStore } from "../store/useEditor";
import { getEffect } from "../effects";
import type { Keyframe, ParameterTimeline } from "../store/useTimeline";

type TimelineProps = {
  className?: string;
  height?: number;
};

export default function Timeline({ className = "", height = 200 }: TimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, time: 0 });

  const {
    timelines,
    currentTime,
    zoom,
    selectedKeyframes,
    setCurrentTime,
    addKeyframe,
    removeKeyframe,
    updateKeyframe
  } = useTimelineStore();

  const { effectId, params, durationSec } = useEditorStore();

  // Get visible parameter keys with their current values
  const effect = getEffect(effectId);
  const visibleParams = effect ? effect.params : [];

  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (!timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const timelineWidth = rect.width - 120; // Account for parameter labels
    const normalizedTime = Math.max(0, Math.min(1, (x - 120) / timelineWidth));

    setCurrentTime(normalizedTime);
  }, [setCurrentTime]);

  const handleKeyframeDoubleClick = useCallback((paramKey: string, time: number) => {
    const currentValue = params[paramKey];
    addKeyframe(paramKey, time, currentValue);
  }, [addKeyframe, params]);

  const handleKeyframeDrag = useCallback((paramKey: string, oldTime: number, newTime: number) => {
    const timeline = timelines[paramKey];
    if (!timeline) return;

    const keyframe = timeline.keyframes.find(kf => Math.abs(kf.time - oldTime) < 0.0001);
    if (!keyframe) return;

    updateKeyframe(paramKey, oldTime, newTime, keyframe.value);
  }, [timelines, updateKeyframe]);

  const formatTime = useCallback((normalizedTime: number) => {
    const seconds = normalizedTime * durationSec;
    return `${seconds.toFixed(2)}s`;
  }, [durationSec]);

  return (
    <div className={`timeline-panel ${className}`}>
      {/* Timeline header */}
      <div className="timeline-header bg-gray-50 border-b border-gray-200 p-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">Timeline</h3>
          <div className="flex items-center space-x-2">
            <TimeIndicator currentTime={currentTime} duration={durationSec} />
            <TimelineControls />
          </div>
        </div>
      </div>

      {/* Timeline content */}
      <div
        ref={timelineRef}
        className="timeline-content relative bg-white overflow-hidden"
        style={{ height: `${height}px` }}
        data-testid="timeline-content"
        onClick={handleTimelineClick}
      >
        {/* Timeline ruler */}
        <TimelineRuler zoom={zoom} duration={durationSec} />

        {/* Parameter tracks */}
        <div className="parameter-tracks">
          {visibleParams.map((param) => (
            <ParameterTrack
              key={param.key}
              param={{ key: param.key, name: param.label, type: param.type }}
              timeline={timelines[param.key]}
              currentValue={params[param.key]}
              currentTime={currentTime}
              durationSec={durationSec}
              onKeyframeDoubleClick={handleKeyframeDoubleClick}
              onKeyframeDrag={handleKeyframeDrag}
              onKeyframeRemove={removeKeyframe}
            />
          ))}
        </div>

        {/* Current time indicator */}
        <div className="absolute left-[7.5rem] right-8 top-0 bottom-0 pointer-events-none">
          <CurrentTimeIndicator currentTime={currentTime} />
        </div>
      </div>
    </div>
  );
}

function TimeIndicator({ currentTime, duration }: { currentTime: number; duration: number }) {
  const currentSeconds = currentTime * duration;
  const totalSeconds = duration;

  return (
    <div className="time-indicator text-xs font-mono text-gray-600">
      {currentSeconds.toFixed(2)}s / {totalSeconds.toFixed(1)}s
    </div>
  );
}

function TimelineControls() {
  const { zoom, setZoom } = useTimelineStore();

  return (
    <div className="timeline-controls flex items-center space-x-1">
      <button
        className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
        onClick={() => setZoom(zoom - 1)}
        disabled={zoom <= 1}
      >
        -
      </button>
      <span className="text-xs text-gray-500 min-w-[3ch] text-center">{zoom}x</span>
      <button
        className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
        onClick={() => setZoom(zoom + 1)}
        disabled={zoom >= 10}
      >
        +
      </button>
    </div>
  );
}

function TimelineRuler({ zoom, duration }: { zoom: number; duration: number }) {
  const markerCount = Math.min(20, Math.max(5, 10 * zoom));

  const markers = Array.from({ length: markerCount + 1 }).map((_, index) => {
    const fraction = index / markerCount;
    const seconds = fraction * duration;
    const translate = fraction === 0 ? "translateX(0)" : fraction === 1 ? "translateX(-100%)" : "translateX(-50%)";

    return (
      <div
        key={index}
        className="absolute top-0 flex flex-col items-center"
        style={{ left: `${fraction * 100}%`, transform: translate }}
      >
        <div className="h-3 w-px bg-gray-300" />
        <span className="mt-1 text-[10px] font-mono text-gray-500">
          {seconds.toFixed(1)}s
        </span>
      </div>
    );
  });

  return (
    <div className="timeline-ruler relative flex h-8 items-center bg-gray-50 border-b border-gray-200">
      <div className="w-28 h-full border-r border-gray-200 bg-gray-50 flex items-center justify-center text-xs uppercase tracking-[0.2em] text-gray-500">
        Time
      </div>
      <div className="relative h-full flex-1">
        {markers}
      </div>
    </div>
  );
}

function CurrentTimeIndicator({ currentTime }: { currentTime: number }) {
  return (
    <div className="relative h-full">
      <div
        className="absolute top-0 bottom-0 w-px bg-red-500 pointer-events-none z-20 shadow-[0_0_4px_rgba(239,68,68,0.35)]"
        style={{ left: `${currentTime * 100}%`, transform: 'translateX(-50%)' }}
      >
        <div className="absolute -top-2 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-red-500" />
      </div>
    </div>
  );
}

type ParameterTrackProps = {
  param: { key: string; name: string; type: string };
  timeline?: ParameterTimeline;
  currentValue: any;
  currentTime: number;
  durationSec: number;
  onKeyframeDoubleClick: (paramKey: string, time: number) => void;
  onKeyframeDrag: (paramKey: string, oldTime: number, newTime: number) => void;
  onKeyframeRemove: (paramKey: string, time: number) => void;
};

function ParameterTrack({
  param,
  timeline,
  currentValue,
  currentTime,
  durationSec,
  onKeyframeDoubleClick,
  onKeyframeDrag,
  onKeyframeRemove
}: ParameterTrackProps) {
  const setTimelineTime = useTimelineStore((state) => state.setCurrentTime);
  const [isDragging, setIsDragging] = useState<{ keyframe: Keyframe; offset: number } | null>(null);
  const timelineAreaRef = useRef<HTMLDivElement | null>(null);

  const handleKeyframeMouseDown = useCallback((e: React.MouseEvent, keyframe: Keyframe) => {
    e.stopPropagation();
    setTimelineTime(keyframe.time);
    const area = timelineAreaRef.current;
    if (!area) return;
    const rect = area.getBoundingClientRect();
    const offset = e.clientX - rect.left - keyframe.time * rect.width;
    setIsDragging({ keyframe, offset });
  }, [setTimelineTime]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const area = timelineAreaRef.current;
    if (!area) return;

    const rect = area.getBoundingClientRect();
    const x = e.clientX - rect.left - isDragging.offset;
    const newTime = Math.max(0, Math.min(1, x / rect.width));

    onKeyframeDrag(param.key, isDragging.keyframe.time, newTime);
  }, [isDragging, onKeyframeDrag, param.key]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
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

  return (
    <div
      className="parameter-track relative h-10 border-b border-gray-200 bg-white"
      data-param={param.key}
      onDoubleClick={() => onKeyframeDoubleClick(param.key, currentTime)}
    >
      {/* Parameter label */}
      <div className="absolute left-0 top-0 w-28 h-full flex items-center px-2 bg-gray-50 border-r border-gray-200">
        <span className="text-xs text-gray-700 truncate" title={param.name}>
          {param.name}
        </span>
      </div>

      {/* Current value indicator */}
      <div className="absolute right-2 top-0 h-full flex items-center">
        <span className="text-xs text-gray-500 font-mono">
          {typeof currentValue === 'number' ? currentValue.toFixed(2) : String(currentValue)}
        </span>
      </div>

      {/* Timeline lane */}
      <div
        ref={timelineAreaRef}
        className="absolute left-[7.5rem] right-8 top-0 bottom-0"
        data-timeline-area="true"
      >
        <TimelineLane durationSec={durationSec} />

        <div className="relative h-full">
          {timeline && timeline.keyframes.length > 1 && (
            <AnimationCurve timeline={timeline} />
          )}

          {timeline?.keyframes.map((keyframe, index) => (
            <KeyframeMarker
              key={`${keyframe.time}-${index}`}
              keyframe={keyframe}
              paramKey={param.key}
              isActive={Math.abs(keyframe.time - currentTime) < 0.0001}
              durationSec={durationSec}
              onMouseDown={handleKeyframeMouseDown}
              onRemove={onKeyframeRemove}
              isDragging={isDragging?.keyframe === keyframe}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function TimelineLane({ durationSec }: { durationSec: number }) {
  const divisions = Array.from({ length: 5 }, (_, index) => index / 4);

  const translateForFraction = (fraction: number) => {
    if (fraction <= 0) return "translateX(0)";
    if (fraction >= 1) return "translateX(-100%)";
    return "translateX(-50%)";
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute inset-y-2 inset-x-0 rounded-sm border border-gray-200/70 bg-gradient-to-b from-white via-gray-50 to-white shadow-inner" />
      {divisions.map((fraction) => (
        <div
          key={fraction}
          className="absolute top-2 bottom-2 w-px bg-gray-200"
          style={{ left: `${fraction * 100}%`, transform: translateForFraction(fraction) }}
        />
      ))}
      {divisions.slice(1).map((fraction) => (
        <span
          key={`label-${fraction}`}
          className="absolute -bottom-4 text-[10px] font-mono text-gray-400"
          style={{ left: `${fraction * 100}%`, transform: translateForFraction(fraction) }}
        >
          {(durationSec * fraction).toFixed(1)}s
        </span>
      ))}
      <div className="absolute inset-x-1 top-1/2 -translate-y-1/2 border-t border-dashed border-blue-100" />
    </div>
  );
}

type KeyframeMarkerProps = {
  keyframe: Keyframe;
  paramKey: string;
  isActive: boolean;
  durationSec: number;
  onMouseDown: (e: React.MouseEvent, keyframe: Keyframe) => void;
  onRemove: (paramKey: string, time: number) => void;
  isDragging: boolean;
};

function KeyframeMarker({
  keyframe,
  paramKey,
  isActive,
  durationSec,
  onMouseDown,
  onRemove,
  isDragging
}: KeyframeMarkerProps) {
  return (
    <div
      className="absolute inset-y-0 flex flex-col items-center justify-center"
      style={{ left: `${keyframe.time * 100}%`, transform: 'translateX(-50%)' }}
    >
      {isActive && (
        <span className="mb-2 rounded bg-white px-1 py-0.5 text-[10px] font-mono text-indigo-600 shadow-sm border border-indigo-100">
          {(keyframe.time * durationSec).toFixed(2)}s
        </span>
      )}

      <div
        className={`relative h-3 w-3 cursor-pointer rounded-sm border border-white shadow-sm transition-transform duration-150 ease-out transform -translate-y-1/2 rotate-45 bg-blue-500 hover:bg-blue-600 ${
          isDragging ? 'ring-2 ring-blue-300 scale-110' : ''
        } ${isActive ? 'bg-indigo-500 scale-110 shadow-md' : ''}`}
        onMouseDown={(e) => onMouseDown(e, keyframe)}
        onContextMenu={(e) => {
          e.preventDefault();
          onRemove(paramKey, keyframe.time);
        }}
        title={`${keyframe.value} @ ${(keyframe.time * 100).toFixed(1)}%`}
      />
    </div>
  );
}

function AnimationCurve({ timeline }: { timeline: ParameterTimeline }) {
  if (timeline.keyframes.length < 2) return null;

  const points = timeline.keyframes
    .map((keyframe) => `${Math.max(0, Math.min(100, keyframe.time * 100))},50`)
    .join(' ');

  return (
    <svg
      className="absolute inset-0 h-full w-full pointer-events-none"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <polyline
        points={points}
        stroke="#3b82f6"
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.45}
      />
    </svg>
  );
}
