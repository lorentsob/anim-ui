"use client";

import { useCallback, useMemo } from "react";
import { useTimelineStore } from "@/store/useTimeline";
import { useEditorStore } from "@/store/useEditor";

interface KeyframeButtonProps {
  paramKey: string;
  value: any;
  className?: string;
}

export function KeyframeButton({ paramKey, value, className = "" }: KeyframeButtonProps) {
  const { 
    timelines, 
    currentTime, 
    addKeyframe, 
    removeKeyframe,
    hasKeyframes 
  } = useTimelineStore();
  
  const timelineMode = useEditorStore(state => state.timelineMode);
  
  // Check if there's a keyframe at current time
  const hasKeyframeAtCurrentTime = useMemo(() => {
    const timeline = timelines[paramKey];
    if (!timeline) return false;
    
    return timeline.keyframes.some(kf => 
      Math.abs(kf.time - currentTime) < 0.001
    );
  }, [timelines, paramKey, currentTime]);
  
  // Check if this parameter has any keyframes
  const paramHasKeyframes = hasKeyframes(paramKey);
  
  const handleClick = useCallback(() => {
    if (hasKeyframeAtCurrentTime) {
      // Remove keyframe
      removeKeyframe(paramKey, currentTime);
    } else {
      // Add keyframe
      addKeyframe(paramKey, currentTime, value);
    }
  }, [paramKey, currentTime, value, hasKeyframeAtCurrentTime, addKeyframe, removeKeyframe]);
  
  if (!timelineMode) return null;
  
  return (
    <button
      type="button"
      onClick={handleClick}
      className={`
        keyframe-button 
        ${className}
        ${hasKeyframeAtCurrentTime ? 'has-keyframe' : ''}
        ${paramHasKeyframes ? 'param-animated' : ''}
      `}
      title={
        hasKeyframeAtCurrentTime 
          ? `Remove keyframe at ${(currentTime * 100).toFixed(0)}%`
          : `Add keyframe at ${(currentTime * 100).toFixed(0)}%`
      }
    >
      <svg 
        width="16" 
        height="16" 
        viewBox="0 0 16 16" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="keyframe-icon"
      >
        <path
          d="M8 2L13 8L8 14L3 8L8 2Z"
          className={hasKeyframeAtCurrentTime ? 'fill-yellow-500' : 'fill-gray-400'}
          stroke="currentColor"
          strokeWidth="1"
        />
      </svg>
      
      {paramHasKeyframes && (
        <span className="keyframe-count">
          {timelines[paramKey]?.keyframes.length || 0}
        </span>
      )}
    </button>
  );
}

// Companion component for timeline track visualization
export function KeyframeTrack({ paramKey, className = "" }: { paramKey: string; className?: string }) {
  const { timelines, currentTime, setCurrentTime } = useTimelineStore();
  const timeline = timelines[paramKey];
  
  if (!timeline || timeline.keyframes.length === 0) {
    return (
      <div className={`keyframe-track empty ${className}`}>
        <span className="text-xs text-gray-400">No keyframes</span>
      </div>
    );
  }
  
  return (
    <div className={`keyframe-track ${className}`}>
      {timeline.keyframes.map((keyframe, index) => (
        <button
          key={index}
          className={`
            keyframe-marker
            ${Math.abs(keyframe.time - currentTime) < 0.001 ? 'current' : ''}
          `}
          style={{ left: `${keyframe.time * 100}%` }}
          onClick={() => setCurrentTime(keyframe.time)}
          title={`Jump to ${(keyframe.time * 100).toFixed(0)}%`}
        >
          <svg 
            width="12" 
            height="12" 
            viewBox="0 0 12 12" 
            fill="none"
          >
            <path
              d="M6 1L10 6L6 11L2 6L6 1Z"
              className="fill-yellow-500"
              stroke="currentColor"
              strokeWidth="0.5"
            />
          </svg>
        </button>
      ))}
    </div>
  );
}