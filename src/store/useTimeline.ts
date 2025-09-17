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
  hasKeyframes: (paramKey: string) => boolean;
}

export const useTimelineStore = create<TimelineState>((set, get) => ({
  timelines: {},
  currentTime: 0,
  zoom: 1,
  selectedKeyframes: [],

  addKeyframe: (paramKey, time, value) => set(state => {
    const timeline = state.timelines[paramKey] || { paramKey, keyframes: [] };

    // Remove existing keyframe at this time if it exists
    const newKeyframes = timeline.keyframes.filter(kf => Math.abs(kf.time - time) > 0.001);

    // Add new keyframe and sort by time
    newKeyframes.push({ time, value, easing: "linear" });
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

    const newKeyframes = timeline.keyframes.filter(kf => Math.abs(kf.time - time) > 0.001);

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

    const keyframeIndex = timeline.keyframes.findIndex(kf => Math.abs(kf.time - oldTime) < 0.001);
    if (keyframeIndex === -1) return state;

    const newKeyframes = [...timeline.keyframes];
    newKeyframes[keyframeIndex] = { ...newKeyframes[keyframeIndex], time: newTime, value: newValue };
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

    const keyframeIndex = timeline.keyframes.findIndex(kf => Math.abs(kf.time - time) < 0.001);
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

  setCurrentTime: (time) => set({ currentTime: Math.max(0, Math.min(1, time)) }),

  setZoom: (zoom) => set({ zoom: Math.max(1, Math.min(10, zoom)) }),

  clearTimeline: (paramKey) => set(state => {
    const { [paramKey]: removed, ...remainingTimelines } = state.timelines;
    return { timelines: remainingTimelines };
  }),

  clearAllTimelines: () => set({ timelines: {} }),

  getAnimatedValue: (paramKey, time, defaultValue) => {
    const timeline = get().timelines[paramKey];
    if (!timeline || timeline.keyframes.length === 0) return defaultValue;

    // Find surrounding keyframes
    const keyframes = timeline.keyframes;
    // Use reverse iteration instead of findLast for compatibility
    let beforeFrame = null;
    for (let i = keyframes.length - 1; i >= 0; i--) {
      if (keyframes[i].time <= time) {
        beforeFrame = keyframes[i];
        break;
      }
    }
    const afterFrame = keyframes.find(kf => kf.time > time);

    if (!beforeFrame) return keyframes[0].value;
    if (!afterFrame) return beforeFrame.value;

    // Calculate normalized time between keyframes
    const t = (time - beforeFrame.time) / (afterFrame.time - beforeFrame.time);

    // Apply easing function from the beforeFrame's easing setting
    const easedT = applyEasing(beforeFrame.easing, t);

    if (typeof beforeFrame.value === "number" && typeof afterFrame.value === "number") {
      return beforeFrame.value + (afterFrame.value - beforeFrame.value) * easedT;
    }

    // For non-numeric values, use step interpolation
    return easedT < 0.5 ? beforeFrame.value : afterFrame.value;
  },

  hasKeyframes: (paramKey) => {
    const timeline = get().timelines[paramKey];
    return Boolean(timeline && timeline.keyframes.length > 0);
  },
}));
