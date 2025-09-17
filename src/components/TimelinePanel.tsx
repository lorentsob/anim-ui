/**
 * Complete timeline panel integrating scrubber, controls, and keyframe editing
 * The main timeline interface for BW Animator
 */

import { useState, useCallback } from "react";
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
  const [selectedTab, setSelectedTab] = useState<"timeline" | "keyframes">("timeline");
  const [timelineHeight, setTimelineHeight] = useState(200);

  const { timelines, currentTime, clearAllTimelines } = useTimelineStore();
  const { durationSec, fps } = useEditorStore();

  const totalKeyframes = Object.values(timelines).reduce(
    (total, timeline) => total + timeline.keyframes.length,
    0
  );

  const handleScrub = useCallback((time: number) => {
    // Optional: Trigger preview update during scrubbing
  }, []);

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
    <div className={`timeline-panel bg-white border-t border-gray-200 ${className}`}>
      {/* Timeline header */}
      <div className="timeline-panel-header bg-gray-50 border-b border-gray-200 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-sm font-medium text-gray-700">Timeline</h3>
            <TimelineStats timelines={timelines} duration={durationSec} />
          </div>

          <div className="flex items-center space-x-2">
            <TimelineTabs
              selectedTab={selectedTab}
              onTabChange={setSelectedTab}
              keyframeCount={totalKeyframes}
            />
            <TimelineActions onClearAll={clearAllTimelines} />
            <button
              onClick={onToggle}
              className="p-1 text-gray-500 hover:text-gray-700"
              title="Collapse timeline"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Playback controls */}
      <div className="playback-section bg-white border-b border-gray-100 p-3">
        <div className="flex items-center justify-between">
          <PlaybackControls />
          <TimelineZoomControls />
        </div>
      </div>

      {/* Timeline scrubber */}
      <div className="timeline-scrubber-section bg-white border-b border-gray-100 p-3">
        <TimelineScrubber onScrub={handleScrub} showPreview />
      </div>

      {/* Main timeline content */}
      <div className="timeline-main-content">
        {selectedTab === "timeline" ? (
          <>
            <Timeline height={timelineHeight} />
            <TimelineResizeHandle
              height={timelineHeight}
              onHeightChange={setTimelineHeight}
            />
          </>
        ) : (
          <KeyframeList timelines={timelines} />
        )}
      </div>
    </div>
  );
}

function TimelineStats({
  timelines,
  duration
}: {
  timelines: Record<string, any>;
  duration: number;
}) {
  const stats = Object.values(timelines).reduce(
    (acc, timeline: any) => ({
      keyframes: acc.keyframes + timeline.keyframes.length,
      parameters: acc.parameters + (timeline.keyframes.length > 0 ? 1 : 0)
    }),
    { keyframes: 0, parameters: 0 }
  );

  return (
    <div className="flex items-center space-x-3 text-xs text-gray-500">
      <span>{stats.parameters} animated params</span>
      <span>{stats.keyframes} keyframes</span>
      <span>{duration.toFixed(1)}s duration</span>
    </div>
  );
}

function TimelineTabs({
  selectedTab,
  onTabChange,
  keyframeCount
}: {
  selectedTab: string;
  onTabChange: (tab: "timeline" | "keyframes") => void;
  keyframeCount: number;
}) {
  return (
    <div className="flex border border-gray-200 rounded overflow-hidden">
      <button
        onClick={() => onTabChange("timeline")}
        className={`px-3 py-1 text-xs ${
          selectedTab === "timeline"
            ? "bg-blue-500 text-white"
            : "bg-white text-gray-600 hover:bg-gray-50"
        }`}
      >
        Timeline
      </button>
      <button
        onClick={() => onTabChange("keyframes")}
        className={`px-3 py-1 text-xs ${
          selectedTab === "keyframes"
            ? "bg-blue-500 text-white"
            : "bg-white text-gray-600 hover:bg-gray-50"
        }`}
      >
        Keyframes ({keyframeCount})
      </button>
    </div>
  );
}

function TimelineActions({ onClearAll }: { onClearAll: () => void }) {
  return (
    <div className="flex items-center space-x-1">
      <button
        onClick={onClearAll}
        className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
        title="Clear all keyframes"
      >
        Clear All
      </button>
    </div>
  );
}

function TimelineZoomControls() {
  const { zoom, setZoom } = useTimelineStore();

  return (
    <div className="flex items-center space-x-1">
      <span className="text-xs text-gray-500">Zoom:</span>
      <div className="flex items-center border border-gray-200 rounded overflow-hidden">
        <button
          onClick={() => setZoom(zoom - 1)}
          className="px-2 py-1 text-xs bg-white hover:bg-gray-50 disabled:opacity-50"
          disabled={zoom <= 1}
        >
          -
        </button>
        <span className="px-2 py-1 text-xs bg-gray-50 min-w-[3ch] text-center">
          {zoom}x
        </span>
        <button
          onClick={() => setZoom(zoom + 1)}
          className="px-2 py-1 text-xs bg-white hover:bg-gray-50 disabled:opacity-50"
          disabled={zoom >= 10}
        >
          +
        </button>
      </div>
    </div>
  );
}

function TimelineResizeHandle({
  height,
  onHeightChange
}: {
  height: number;
  onHeightChange: (height: number) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    const startY = e.clientY;
    const startHeight = height;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - startY;
      const newHeight = Math.max(150, Math.min(400, startHeight + deltaY));
      onHeightChange(newHeight);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [height, onHeightChange]);

  return (
    <div
      className={`timeline-resize-handle h-1 bg-gray-200 hover:bg-gray-300 cursor-ns-resize ${
        isDragging ? 'bg-blue-300' : ''
      }`}
      onMouseDown={handleMouseDown}
    />
  );
}

function KeyframeList({ timelines }: { timelines: Record<string, any> }) {
  const { removeKeyframe, updateKeyframe, updateKeyframeEasing } = useTimelineStore();

  const allKeyframes = Object.entries(timelines).flatMap(([paramKey, timeline]: [string, any]) =>
    timeline.keyframes.map((kf: any, index: number) => ({
      ...kf,
      paramKey,
      id: `${paramKey}-${kf.time}-${index}`
    }))
  ).sort((a, b) => a.time - b.time);

  return (
    <div className="keyframe-list p-3 max-h-64 overflow-y-auto">
      <div className="space-y-2">
        {allKeyframes.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <p className="text-sm">No keyframes yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Double-click on parameter tracks to add keyframes
            </p>
          </div>
        ) : (
          allKeyframes.map((keyframe) => (
            <KeyframeItem
              key={keyframe.id}
              keyframe={keyframe}
              onRemove={() => removeKeyframe(keyframe.paramKey, keyframe.time)}
              onUpdate={(newValue) => updateKeyframe(keyframe.paramKey, keyframe.time, keyframe.time, newValue)}
              onUpdateEasing={(newEasing) => updateKeyframeEasing(keyframe.paramKey, keyframe.time, newEasing)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function KeyframeItem({
  keyframe,
  onRemove,
  onUpdate,
  onUpdateEasing
}: {
  keyframe: any;
  onRemove: () => void;
  onUpdate: (value: any) => void;
  onUpdateEasing: (easing: EasingType) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(keyframe.value));
  const [showEasingControls, setShowEasingControls] = useState(false);

  const handleSave = useCallback(() => {
    const value = isNaN(Number(editValue)) ? editValue : Number(editValue);
    onUpdate(value);
    setIsEditing(false);
  }, [editValue, onUpdate]);

  const handleCancel = useCallback(() => {
    setEditValue(String(keyframe.value));
    setIsEditing(false);
  }, [keyframe.value]);

  return (
    <div className="keyframe-item p-2 bg-gray-50 rounded">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium text-gray-700">
              {keyframe.paramKey}
            </span>
            <span className="text-xs text-gray-500">
              @ {(keyframe.time * 100).toFixed(1)}%
            </span>
          </div>

          <div className="mt-1 flex items-center space-x-2">
            {isEditing ? (
              <div className="flex items-center space-x-1">
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="text-xs border border-gray-300 rounded px-1 py-0.5 w-20"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave();
                    if (e.key === 'Escape') handleCancel();
                  }}
                  autoFocus
                />
                <button
                  onClick={handleSave}
                  className="text-xs text-green-600 hover:text-green-800"
                >
                  ✓
                </button>
                <button
                  onClick={handleCancel}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  ✗
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                {String(keyframe.value)}
              </button>
            )}

            <button
              onClick={() => setShowEasingControls(!showEasingControls)}
              className="text-xs text-purple-600 hover:text-purple-800 px-1 py-0.5 rounded bg-purple-50"
              title="Easing controls"
            >
              {keyframe.easing || 'linear'}
            </button>
          </div>

          {showEasingControls && (
            <div className="mt-2 p-2 bg-white border border-gray-200 rounded shadow-sm">
              <label className="text-xs text-gray-600 block mb-1">Easing Function:</label>
              <select
                value={keyframe.easing || 'linear'}
                onChange={(e) => onUpdateEasing(e.target.value as EasingType)}
                className="text-xs border border-gray-300 rounded px-1 py-0.5 w-full"
              >
                {easingOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="mt-1 flex justify-end">
                <button
                  onClick={() => setShowEasingControls(false)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onRemove}
          className="ml-2 text-xs text-red-600 hover:text-red-800"
          title="Remove keyframe"
        >
          ✗
        </button>
      </div>
    </div>
  );
}