"use client";

import { create } from "zustand";
import { applyEasing, type EasingType } from "@/lib/easing";

export interface Keyframe {
  time: number;        // 0-1 (normalized time)
  value: number | string | boolean;
  easing: EasingType;
}

export interface ParameterTimeline {
  paramKey: string;
  keyframes: Keyframe[];
}

const clamp01 = (value: number) => {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
};

const TIME_EPSILON = 0.0001;

interface TimelineState {
  // Timeline data
  timelines: Record<string, ParameterTimeline>; // paramKey -> timeline
  currentTime: number;  // 0-1 normalized

  // Timeline UI state
  zoom: number;         // 1-10 (timeline zoom level)
  selectedKeyframes: string[]; // keyframe IDs

  // Actions
  addKeyframe: (paramKey: string, time: number, value: any) => void;
  removeKeyframe: (paramKey: string, time: number) => void;
  updateKeyframe: (paramKey: string, oldTime: number, newTime: number, newValue: any) => void;
  updateKeyframeEasing: (paramKey: string, time: number, easing: EasingType) => void;
  setCurrentTime: (time: number) => void;
  setZoom: (zoom: number) => void;
  clearTimeline: (paramKey: string) => void;
  clearAllTimelines: () => void;

  // Interpolation
  getAnimatedValue: (paramKey: string, time: number, defaultValue: any) => any;
  getKeyframesForParam: (paramKey: string) => Keyframe[];
  hasKeyframes: (paramKey: string) => boolean;
}

export const useTimelineStore = create<TimelineState>((set, get) => ({
  timelines: {},
  currentTime: 0,
  zoom: 1,
  selectedKeyframes: [],

  addKeyframe: (paramKey, time, value) => set(state => {
    const clampedTime = clamp01(time);
    const timeline = state.timelines[paramKey] || { paramKey, keyframes: [] };

    // Remove existing keyframe at this time if it exists
    const newKeyframes = timeline.keyframes.filter(kf => Math.abs(kf.time - clampedTime) > TIME_EPSILON);

    // Add new keyframe and sort by time
    newKeyframes.push({ time: clampedTime, value, easing: "linear" });
    newKeyframes.sort((a, b) => a.time - b.time);

    return {
      timelines: {
        ...state.timelines,
        [paramKey]: { ...timeline, keyframes: newKeyframes }
      }
    };
  }),

  removeKeyframe: (paramKey, time) => set(state => {
    const timeline = state.timelines[paramKey];
    if (!timeline) return state;

    const targetTime = clamp01(time);
    const newKeyframes = timeline.keyframes.filter(kf => Math.abs(kf.time - targetTime) > TIME_EPSILON);

    if (newKeyframes.length === 0) {
      const { [paramKey]: removed, ...remainingTimelines } = state.timelines;
      return { timelines: remainingTimelines };
    }

    return {
      timelines: {
        ...state.timelines,
        [paramKey]: { ...timeline, keyframes: newKeyframes }
      }
    };
  }),

  updateKeyframe: (paramKey, oldTime, newTime, newValue) => set(state => {
    const timeline = state.timelines[paramKey];
    if (!timeline) return state;

    const keyframeIndex = timeline.keyframes.findIndex(kf => Math.abs(kf.time - oldTime) < TIME_EPSILON);
    if (keyframeIndex === -1) return state;

    const newKeyframes = [...timeline.keyframes];
    const clampedTime = clamp01(newTime);
    newKeyframes[keyframeIndex] = { ...newKeyframes[keyframeIndex], time: clampedTime, value: newValue };
    newKeyframes.sort((a, b) => a.time - b.time);

    return {
      timelines: {
        ...state.timelines,
        [paramKey]: { ...timeline, keyframes: newKeyframes }
      }
    };
  }),

  updateKeyframeEasing: (paramKey, time, easing) => set(state => {
    const timeline = state.timelines[paramKey];
    if (!timeline) return state;

    const keyframeIndex = timeline.keyframes.findIndex(kf => Math.abs(kf.time - time) < TIME_EPSILON);
    if (keyframeIndex === -1) return state;

    const newKeyframes = [...timeline.keyframes];
    newKeyframes[keyframeIndex] = { ...newKeyframes[keyframeIndex], easing };

    return {
      timelines: {
        ...state.timelines,
        [paramKey]: { ...timeline, keyframes: newKeyframes }
      }
    };
  }),

  setCurrentTime: (time) => set(state => {
    const clamped = clamp01(time);
    if (Math.abs(clamped - state.currentTime) < TIME_EPSILON) {
      return state;
    }
    return { currentTime: clamped };
  }),

  setZoom: (zoom) => set({ zoom: Math.max(1, Math.min(10, zoom)) }),

  clearTimeline: (paramKey) => set(state => {
    const { [paramKey]: removed, ...remainingTimelines } = state.timelines;
    return { timelines: remainingTimelines };
  }),

  clearAllTimelines: () => set({ timelines: {} }),

  getAnimatedValue: (paramKey, time, defaultValue) => {
    const timeline = get().timelines[paramKey];
    if (!timeline || timeline.keyframes.length === 0) return defaultValue;

    const clampedTime = clamp01(time);
    // Find surrounding keyframes
    const keyframes = timeline.keyframes;
    // Use reverse iteration instead of findLast for compatibility
    let beforeFrame = null;
    for (let i = keyframes.length - 1; i >= 0; i--) {
      if (keyframes[i].time <= clampedTime) {
        beforeFrame = keyframes[i];
        break;
      }
    }
    const afterFrame = keyframes.find(kf => kf.time > clampedTime);

    if (!beforeFrame) return keyframes[0].value;
    if (!afterFrame) return beforeFrame.value;

    // Calculate normalized time between keyframes
    const t = (clampedTime - beforeFrame.time) / (afterFrame.time - beforeFrame.time);

    // Apply easing function from the beforeFrame's easing setting
    const easedT = applyEasing(beforeFrame.easing, t);

    if (typeof beforeFrame.value === "number" && typeof afterFrame.value === "number") {
      return beforeFrame.value + (afterFrame.value - beforeFrame.value) * easedT;
    }

    // For non-numeric values, use step interpolation
    return easedT < 0.5 ? beforeFrame.value : afterFrame.value;
  },

  getKeyframesForParam: (paramKey) => {
    const timeline = get().timelines[paramKey];
    return timeline ? [...timeline.keyframes] : [];
  },

  hasKeyframes: (paramKey) => {
    const timeline = get().timelines[paramKey];
    return Boolean(timeline && timeline.keyframes.length > 0);
  },
}));
