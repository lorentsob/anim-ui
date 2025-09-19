/**
 * Focused tests for the timeline UI stack.
 * We exercise the real Zustand stores and rely on lightweight DOM
 * interactions to confirm the critical bidirectional sync behaviours.
 */

import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import Timeline from "@/components/Timeline";
import TimelinePanel from "@/components/TimelinePanel";
import TimelineScrubber, { PlaybackControls } from "@/components/TimelineScrubber";
import { useTimelineStore } from "@/store/useTimeline";
import { useEditorStore } from "@/store/useEditor";
import { getEffect } from "@/effects";

const baseEffect = getEffect("square-drift");

const resetStores = () => {
  useTimelineStore.setState({
    timelines: {},
    currentTime: 0,
    zoom: 1,
    selectedKeyframes: [],
  });

  useEditorStore.setState({
    effectId: baseEffect.id,
    params: { ...baseEffect.defaults },
    durationSec: 5,
    duration: 5,
    fps: 30,
    currentFrame: 0,
    playing: false,
    timelineMode: true,
  });
};

const mockBoundingClientRect = (element: HTMLElement, width = 200) => {
  element.getBoundingClientRect = () => ({
    width,
    height: 40,
    top: 0,
    left: 0,
    bottom: 40,
    right: width,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  });
};

beforeEach(() => {
  resetStores();
});

describe("Timeline", () => {
  it("renders the active effect parameters", () => {
    render(<Timeline />);

    // Square Drift exposes Grid Columns/Rows params by default
    expect(screen.getByText("Grid Columns")).toBeInTheDocument();
    expect(screen.getByText("Grid Rows")).toBeInTheDocument();
  });
});

describe("TimelineScrubber", () => {
  it("shows the current frame and time", () => {
    render(<TimelineScrubber />);
    expect(screen.getByText(/Frame 1 \/ 150/)).toBeInTheDocument();
    expect(screen.getByText(/0.00s \/ 5.0s/)).toBeInTheDocument();
  });

  it("updates the timeline store when scrubbed", () => {
    render(<TimelineScrubber />);
    const scrubber = screen.getByTestId("timeline-scrubber-track");
    mockBoundingClientRect(scrubber);

    fireEvent.mouseDown(scrubber, { clientX: 100 });

    const { currentTime } = useTimelineStore.getState();
    expect(currentTime).toBeGreaterThan(0);
    expect(currentTime).toBeLessThan(1);
  });

  it("renders keyframe indicators when present", () => {
    const timelineState = useTimelineStore.getState();
    timelineState.addKeyframe("gridCols", 0.5, 32);

    render(<TimelineScrubber />);

    const indicators = screen.getAllByTestId("timeline-keyframe-indicator");
    expect(indicators.length).toBeGreaterThan(0);
  });
});

describe("PlaybackControls", () => {
  it("toggles play state", () => {
    render(<PlaybackControls />);

    const playButton = screen.getByTitle("Play");
    fireEvent.click(playButton);
    expect(useEditorStore.getState().playing).toBe(true);

    const pauseButton = screen.getByTitle("Pause");
    fireEvent.click(pauseButton);
    expect(useEditorStore.getState().playing).toBe(false);
  });

  it("steps the timeline forward and backward", () => {
    render(<PlaybackControls />);

    const nextButton = screen.getByTitle("Next frame");
    fireEvent.click(nextButton);
    expect(useTimelineStore.getState().currentTime).toBeGreaterThan(0);

    const prevButton = screen.getByTitle("Previous frame");
    fireEvent.click(prevButton);
    expect(useTimelineStore.getState().currentTime).toBeGreaterThanOrEqual(0);
  });

  it("toggles play state with the space bar", () => {
    render(<PlaybackControls />);

    fireEvent.keyDown(window, { code: "Space" });
    expect(useEditorStore.getState().playing).toBe(true);

    fireEvent.keyDown(window, { code: "Space" });
    expect(useEditorStore.getState().playing).toBe(false);
  });
});

describe("TimelinePanel", () => {
  it("shows keyframe counts and duration", () => {
    const timelineState = useTimelineStore.getState();
    timelineState.addKeyframe("gridCols", 0.2, 24);
    timelineState.addKeyframe("gridRows", 0.6, 24);

    render(<TimelinePanel isVisible />);

    expect(screen.getByText("2 keyframes")).toBeInTheDocument();
    expect(screen.getAllByText("5.0s").length).toBeGreaterThan(0);
  });

  it("clears keyframes via the clear action", () => {
    const timelineState = useTimelineStore.getState();
    timelineState.addKeyframe("gridCols", 0.2, 24);

    render(<TimelinePanel isVisible />);

    fireEvent.click(screen.getByText("Clear"));
    expect(useTimelineStore.getState().timelines).toEqual({});
  });
});
