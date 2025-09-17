import { describe, expect, it, beforeEach } from "vitest";
import { useTimelineStore } from "@/store/useTimeline";

describe("useTimelineStore", () => {
  beforeEach(() => {
    useTimelineStore.getState().clearAllTimelines();
  });

  it("starts with empty timelines", () => {
    const { timelines, currentTime } = useTimelineStore.getState();
    expect(timelines).toEqual({});
    expect(currentTime).toBe(0);
  });

  it("adds keyframes correctly", () => {
    const { addKeyframe } = useTimelineStore.getState();

    addKeyframe("testParam", 0.5, 100);
    addKeyframe("testParam", 0.0, 50);
    addKeyframe("testParam", 1.0, 150);

    const { timelines } = useTimelineStore.getState();
    const timeline = timelines.testParam;
    expect(timeline).toBeDefined();
    expect(timeline.keyframes).toHaveLength(3);

    // Should be sorted by time
    expect(timeline.keyframes[0].time).toBe(0.0);
    expect(timeline.keyframes[1].time).toBe(0.5);
    expect(timeline.keyframes[2].time).toBe(1.0);
  });

  it("replaces keyframes at same time", () => {
    const { addKeyframe } = useTimelineStore.getState();

    addKeyframe("testParam", 0.5, 100);
    addKeyframe("testParam", 0.5, 200); // Should replace previous

    const { timelines } = useTimelineStore.getState();
    const timeline = timelines.testParam;
    expect(timeline.keyframes).toHaveLength(1);
    expect(timeline.keyframes[0].value).toBe(200);
  });

  it("interpolates values correctly", () => {
    const { addKeyframe, getAnimatedValue } = useTimelineStore.getState();

    addKeyframe("testParam", 0.0, 0);
    addKeyframe("testParam", 1.0, 100);

    // Linear interpolation
    expect(getAnimatedValue("testParam", 0.5, 0)).toBe(50);
    expect(getAnimatedValue("testParam", 0.25, 0)).toBe(25);
    expect(getAnimatedValue("testParam", 0.75, 0)).toBe(75);
  });

  it("returns default value when no keyframes", () => {
    const { getAnimatedValue } = useTimelineStore.getState();

    expect(getAnimatedValue("nonExistent", 0.5, 42)).toBe(42);
  });

  it("handles edge cases correctly", () => {
    const { addKeyframe, getAnimatedValue } = useTimelineStore.getState();

    addKeyframe("testParam", 0.5, 100);

    // Before first keyframe
    expect(getAnimatedValue("testParam", 0.0, 0)).toBe(100);

    // After last keyframe
    expect(getAnimatedValue("testParam", 1.0, 0)).toBe(100);
  });

  it("removes keyframes correctly", () => {
    const { addKeyframe, removeKeyframe } = useTimelineStore.getState();

    addKeyframe("testParam", 0.0, 0);
    addKeyframe("testParam", 0.5, 50);
    addKeyframe("testParam", 1.0, 100);

    removeKeyframe("testParam", 0.5);

    const { timelines } = useTimelineStore.getState();
    const timeline = timelines.testParam;
    expect(timeline.keyframes).toHaveLength(2);
    expect(timeline.keyframes.map(kf => kf.time)).toEqual([0.0, 1.0]);
  });

  it("removes timeline when no keyframes left", () => {
    const { addKeyframe, removeKeyframe } = useTimelineStore.getState();

    addKeyframe("testParam", 0.5, 100);
    removeKeyframe("testParam", 0.5);

    const { timelines } = useTimelineStore.getState();
    expect(timelines.testParam).toBeUndefined();
  });

  it("checks for keyframes existence correctly", () => {
    const { addKeyframe, hasKeyframes } = useTimelineStore.getState();

    expect(hasKeyframes("testParam")).toBe(false);

    addKeyframe("testParam", 0.5, 100);
    expect(hasKeyframes("testParam")).toBe(true);
  });

  it("handles non-numeric values correctly", () => {
    const { addKeyframe, getAnimatedValue } = useTimelineStore.getState();

    addKeyframe("testParam", 0.0, "start");
    addKeyframe("testParam", 1.0, "end");

    // Should use step interpolation for non-numeric values
    expect(getAnimatedValue("testParam", 0.4, "default")).toBe("start");
    expect(getAnimatedValue("testParam", 0.6, "default")).toBe("end");
  });
});