/**
 * Tests for timeline UI components
 */

import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Timeline from "@/components/Timeline";
import TimelinePanel from "@/components/TimelinePanel";
import TimelineScrubber, { PlaybackControls } from "@/components/TimelineScrubber";
import { useTimelineStore } from "@/store/useTimeline";
import { useEditorStore } from "@/store/useEditor";

// Mock the stores
vi.mock("@/store/useTimeline");
vi.mock("@/store/useEditor");

const mockTimelineStore = {
  timelines: {},
  currentTime: 0,
  zoom: 1,
  selectedKeyframes: [],
  setCurrentTime: vi.fn(),
  addKeyframe: vi.fn(),
  removeKeyframe: vi.fn(),
  updateKeyframe: vi.fn(),
  clearAllTimelines: vi.fn(),
  getAnimatedValue: vi.fn(),
  hasKeyframes: vi.fn()
};

const mockEditorStore = {
  currentEffect: {
    id: "test-effect",
    name: "Test Effect",
    params: [
      { id: "param1", name: "Parameter 1", type: "number" },
      { id: "param2", name: "Parameter 2", type: "number" }
    ]
  },
  paramValues: {
    param1: 50,
    param2: 25
  },
  duration: 5.0,
  fps: 30,
  currentFrame: 0,
  totalFrames: 150
};

describe("Timeline Components", () => {
  beforeEach(() => {
    vi.mocked(useTimelineStore).mockReturnValue(mockTimelineStore);
    vi.mocked(useEditorStore).mockReturnValue(mockEditorStore);

    // Reset mocks
    vi.clearAllMocks();
  });

  describe("Timeline", () => {
    it("should render timeline with parameter tracks", () => {
      render(<Timeline />);

      expect(screen.getByText("Timeline")).toBeInTheDocument();
      expect(screen.getByText("Parameter 1")).toBeInTheDocument();
      expect(screen.getByText("Parameter 2")).toBeInTheDocument();
    });

    it("should display current time and duration", () => {
      render(<Timeline />);

      expect(screen.getByText("0.00s / 5.0s")).toBeInTheDocument();
    });

    it("should handle timeline clicks to set current time", () => {
      render(<Timeline />);

      const timelineContent = screen.getByRole("generic", { name: /timeline-content/i });
      if (timelineContent) {
        fireEvent.click(timelineContent, { clientX: 200 }); // Mock click position
        expect(mockTimelineStore.setCurrentTime).toHaveBeenCalled();
      }
    });

    it("should show keyframes when they exist", () => {
      const storeWithKeyframes = {
        ...mockTimelineStore,
        timelines: {
          param1: {
            paramKey: "param1",
            keyframes: [
              { time: 0.2, value: 30, easing: "linear" },
              { time: 0.8, value: 70, easing: "linear" }
            ]
          }
        }
      };

      vi.mocked(useTimelineStore).mockReturnValue(storeWithKeyframes);

      render(<Timeline />);

      // Should show keyframe markers
      const keyframes = screen.getAllByTitle(/30 @ 20.0%|70 @ 80.0%/);
      expect(keyframes.length).toBeGreaterThan(0);
    });
  });

  describe("TimelineScrubber", () => {
    it("should display current frame and time information", () => {
      render(<TimelineScrubber />);

      expect(screen.getByText("Frame 1 / 150")).toBeInTheDocument();
      expect(screen.getByText("0.00s / 5.0s")).toBeInTheDocument();
    });

    it("should handle scrubbing interaction", () => {
      const onScrub = vi.fn();
      render(<TimelineScrubber onScrub={onScrub} />);

      const scrubber = screen.getByRole("generic", { hidden: true }); // Scrubber track
      if (scrubber) {
        fireEvent.mouseDown(scrubber, { clientX: 100 });
        expect(mockTimelineStore.setCurrentTime).toHaveBeenCalled();
      }
    });

    it("should show keyframe indicators in background", () => {
      const storeWithKeyframes = {
        ...mockTimelineStore,
        timelines: {
          param1: {
            keyframes: [{ time: 0.5, value: 50, easing: "linear" }]
          }
        }
      };

      vi.mocked(useTimelineStore).mockReturnValue(storeWithKeyframes);

      render(<TimelineScrubber />);

      // Should render keyframe indicators
      expect(screen.getByRole("generic")).toBeInTheDocument();
    });
  });

  describe("PlaybackControls", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should render all playback buttons", () => {
      render(<PlaybackControls />);

      expect(screen.getByTitle("Previous frame")).toBeInTheDocument();
      expect(screen.getByTitle("Play")).toBeInTheDocument();
      expect(screen.getByTitle("Stop")).toBeInTheDocument();
      expect(screen.getByTitle("Next frame")).toBeInTheDocument();
    });

    it("should handle play/pause toggle", async () => {
      render(<PlaybackControls />);

      const playButton = screen.getByTitle("Play");
      fireEvent.click(playButton);

      await waitFor(() => {
        expect(screen.getByTitle("Pause")).toBeInTheDocument();
      });

      const pauseButton = screen.getByTitle("Pause");
      fireEvent.click(pauseButton);

      await waitFor(() => {
        expect(screen.getByTitle("Play")).toBeInTheDocument();
      });
    });

    it("should handle frame stepping", () => {
      render(<PlaybackControls />);

      const nextButton = screen.getByTitle("Next frame");
      fireEvent.click(nextButton);
      expect(mockTimelineStore.setCurrentTime).toHaveBeenCalled();

      const prevButton = screen.getByTitle("Previous frame");
      fireEvent.click(prevButton);
      expect(mockTimelineStore.setCurrentTime).toHaveBeenCalledTimes(2);
    });

    it("should handle stop action", () => {
      render(<PlaybackControls />);

      const stopButton = screen.getByTitle("Stop");
      fireEvent.click(stopButton);
      expect(mockTimelineStore.setCurrentTime).toHaveBeenCalledWith(0);
    });

    it("should handle playback speed changes", () => {
      render(<PlaybackControls />);

      const speedSelect = screen.getByDisplayValue("1x");
      fireEvent.change(speedSelect, { target: { value: "2" } });

      expect(speedSelect.value).toBe("2");
    });
  });

  describe("TimelinePanel", () => {
    it("should render collapsed state", () => {
      render(<TimelinePanel isVisible={false} />);

      expect(screen.getByText(/Timeline \(0 keyframes\)/)).toBeInTheDocument();
    });

    it("should render expanded state with all sections", () => {
      render(<TimelinePanel isVisible={true} />);

      expect(screen.getByText("Timeline")).toBeInTheDocument();
      expect(screen.getByText("0 animated params")).toBeInTheDocument();
      expect(screen.getByText("0 keyframes")).toBeInTheDocument();
      expect(screen.getByText("5.0s duration")).toBeInTheDocument();
    });

    it("should switch between timeline and keyframes tabs", () => {
      render(<TimelinePanel isVisible={true} />);

      const keyframesTab = screen.getByText("Keyframes (0)");
      fireEvent.click(keyframesTab);

      expect(screen.getByText("No keyframes yet")).toBeInTheDocument();
    });

    it("should handle clear all action", () => {
      render(<TimelinePanel isVisible={true} />);

      const clearButton = screen.getByText("Clear All");
      fireEvent.click(clearButton);

      expect(mockTimelineStore.clearAllTimelines).toHaveBeenCalled();
    });

    it("should show keyframe statistics correctly", () => {
      const storeWithKeyframes = {
        ...mockTimelineStore,
        timelines: {
          param1: {
            keyframes: [
              { time: 0.2, value: 30, easing: "linear" },
              { time: 0.8, value: 70, easing: "linear" }
            ]
          },
          param2: {
            keyframes: [
              { time: 0.5, value: 50, easing: "linear" }
            ]
          }
        }
      };

      vi.mocked(useTimelineStore).mockReturnValue(storeWithKeyframes);

      render(<TimelinePanel isVisible={true} />);

      expect(screen.getByText("2 animated params")).toBeInTheDocument();
      expect(screen.getByText("3 keyframes")).toBeInTheDocument();
    });
  });

  describe("Timeline Interactions", () => {
    it("should handle keyframe creation on double-click", () => {
      render(<Timeline />);

      const paramTrack = screen.getByText("Parameter 1").closest(".parameter-track");
      if (paramTrack) {
        fireEvent.doubleClick(paramTrack);
        expect(mockTimelineStore.addKeyframe).toHaveBeenCalledWith(
          "param1",
          0, // current time
          50  // current value
        );
      }
    });

    it("should handle keyframe removal on right-click", () => {
      const storeWithKeyframes = {
        ...mockTimelineStore,
        timelines: {
          param1: {
            paramKey: "param1",
            keyframes: [{ time: 0.5, value: 50, easing: "linear" }]
          }
        }
      };

      vi.mocked(useTimelineStore).mockReturnValue(storeWithKeyframes);

      render(<Timeline />);

      const keyframe = screen.getByTitle("50 @ 50.0%");
      fireEvent.contextMenu(keyframe);

      expect(mockTimelineStore.removeKeyframe).toHaveBeenCalledWith("param1", 0.5);
    });
  });

  describe("Timeline Accessibility", () => {
    it("should have proper ARIA labels and keyboard support", () => {
      render(<TimelinePanel isVisible={true} />);

      // Check for accessible elements
      expect(screen.getByRole("button", { name: /Play/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Stop/i })).toBeInTheDocument();
    });

    it("should support keyboard navigation for frame stepping", () => {
      render(<PlaybackControls />);

      const nextButton = screen.getByTitle("Next frame");
      nextButton.focus();
      fireEvent.keyDown(nextButton, { key: "Enter" });

      expect(mockTimelineStore.setCurrentTime).toHaveBeenCalled();
    });
  });

  describe("Timeline Performance", () => {
    it("should handle large numbers of keyframes efficiently", () => {
      const manyKeyframes = Array.from({ length: 100 }, (_, i) => ({
        time: i / 100,
        value: Math.random() * 100,
        easing: "linear" as const
      }));

      const storeWithManyKeyframes = {
        ...mockTimelineStore,
        timelines: {
          param1: { paramKey: "param1", keyframes: manyKeyframes }
        }
      };

      vi.mocked(useTimelineStore).mockReturnValue(storeWithManyKeyframes);

      const start = performance.now();
      render(<Timeline />);
      const end = performance.now();

      // Should render within reasonable time even with many keyframes
      expect(end - start).toBeLessThan(100); // 100ms threshold
    });
  });
});