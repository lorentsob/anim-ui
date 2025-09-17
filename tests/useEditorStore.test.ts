import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, beforeEach } from "vitest";

import { useEditorStore } from "@/store/useEditor";

const resetStore = () => {
  const initial = useEditorStore.getState();
  useEditorStore.setState(initial, true);
};

describe("useEditorStore", () => {
  beforeEach(() => {
    useEditorStore.setState((state) => ({
      ...state,
      effectId: "square-drift",
      width: 640,
      height: 640,
      fps: 12,
      durationSec: 6,
      seed: "TEST-SEED",
      background: "white",
      invert: false,
      qualityMode: "preview",
      enableWarnings: true,
      playing: true,
      currentFrame: 0,
    }));
  });

  it("changes effect and resets params", () => {
    const { result } = renderHook(() => useEditorStore());

    act(() => {
      result.current.setEffectId("ascii-dither");
    });

    expect(result.current.effectId).toBe("ascii-dither");
    expect(result.current.params).toMatchObject({ charset: expect.any(String) });
    expect(result.current.currentFrame).toBe(0);
  });

  it("sanitizes dimensions and fps", () => {
    const { result } = renderHook(() => useEditorStore());

    act(() => {
      result.current.setSize(10, 5000);
      result.current.setFps(100);
    });

    expect(result.current.width).toBeGreaterThanOrEqual(32);
    expect(result.current.height).toBeLessThanOrEqual(8192);
    expect(result.current.fps).toBeLessThanOrEqual(120);
  });

  it("toggles playback state", () => {
    const { result } = renderHook(() => useEditorStore());

    act(() => {
      result.current.togglePlaying();
    });

    expect(result.current.playing).toBe(false);
  });
});
