"use client";

import { useEffect, useRef } from "react";
import type p5 from "p5";

import { getEffect } from "@/effects";
import type { ParamValues } from "@/effects/types";
import { AppError, createCanvasError, createAnimationError, safeOperation, errorManager } from "@/lib/errorHandling";
import { createRng, hashSeed } from "@/lib/rng";
import { useEditorStore, type Background } from "@/store/useEditor";
import { useNotificationStore } from "@/store/useNotifications";
import { useTimelineStore } from "@/store/useTimeline";

type RuntimeData = {
  width: number;
  height: number;
  fps: number;
  durationSec: number;
  playing: boolean;
  effectId: string;
  params: ParamValues;
  seed: string;
  background: Background;
  invert: boolean;
  qualityMode: "preview" | "render";
  needsReset: boolean;
};

type EffectRuntime = {
  data: Record<string, unknown>;
  seedHash: number;
  baseSeed: string;
};

const DEFAULT_RUNTIME: RuntimeData = {
  width: 640,
  height: 640,
  fps: 12,
  durationSec: 6,
  playing: true,
  effectId: "square-drift",
  params: {},
  seed: "",
  background: "white",
  invert: false,
  qualityMode: "preview",
  needsReset: true,
};

const computeColors = (background: Background, invert: boolean) => {
  const basePaper = background === "white" ? 255 : 0;
  const baseInk = basePaper === 255 ? 0 : 255;
  if (invert) {
    return { paper: baseInk, ink: basePaper };
  }
  return { paper: basePaper, ink: baseInk };
};

const cloneParams = (params: ParamValues) => ({ ...params });

export function CanvasHost() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const runtimeRef = useRef<RuntimeData>({ ...DEFAULT_RUNTIME });
  const effectCtxRef = useRef<EffectRuntime>({ data: {}, seedHash: hashSeed("init"), baseSeed: "init" });

  const width = useEditorStore((state) => state.width);
  const height = useEditorStore((state) => state.height);
  const fps = useEditorStore((state) => state.fps);
  const durationSec = useEditorStore((state) => state.durationSec);
  const playing = useEditorStore((state) => state.playing);
  const effectId = useEditorStore((state) => state.effectId);
  const params = useEditorStore((state) => state.params);
  const seed = useEditorStore((state) => state.seed);
  const background = useEditorStore((state) => state.background);
  const invert = useEditorStore((state) => state.invert);
  const qualityMode = useEditorStore((state) => state.qualityMode);
  const timelineMode = useEditorStore((state) => state.timelineMode);
  const setCurrentFrame = useEditorStore((state) => state.setCurrentFrame);
  const addNotification = useNotificationStore((state) => state.addNotification);
  const getAnimatedValue = useTimelineStore((state) => state.getAnimatedValue);
  const setCurrentTime = useTimelineStore((state) => state.setCurrentTime);
  const timelineCurrentTime = useTimelineStore((state) => state.currentTime);

  // Track timeline time for change detection
  const lastTimelineTime = useRef<number>(0);

  useEffect(() => {
    runtimeRef.current.width = width;
    runtimeRef.current.height = height;
    runtimeRef.current.needsReset = true;
  }, [width, height]);

  useEffect(() => {
    runtimeRef.current.fps = fps;
  }, [fps]);

  useEffect(() => {
    runtimeRef.current.durationSec = durationSec;
  }, [durationSec]);

  useEffect(() => {
    runtimeRef.current.playing = playing;
  }, [playing]);

  useEffect(() => {
    runtimeRef.current.effectId = effectId;
    runtimeRef.current.params = cloneParams(params);
    runtimeRef.current.needsReset = true;
  }, [effectId]);

  useEffect(() => {
    runtimeRef.current.params = cloneParams(params);
    runtimeRef.current.needsReset = true;
  }, [params]);

  useEffect(() => {
    runtimeRef.current.seed = seed;
    runtimeRef.current.needsReset = true;
  }, [seed]);

  useEffect(() => {
    runtimeRef.current.background = background;
    runtimeRef.current.needsReset = true;
  }, [background]);

  useEffect(() => {
    runtimeRef.current.invert = invert;
    runtimeRef.current.needsReset = true;
  }, [invert]);

  useEffect(() => {
    runtimeRef.current.qualityMode = qualityMode;
    runtimeRef.current.needsReset = true;
  }, [qualityMode]);

  useEffect(() => {
    let mounted = true;
    let instance: p5 | null = null;
    let lastFrameReported = -1;

    const setupP5 = async () => {
      try {
        const { default: P5Constructor } = await import("p5");
        if (!mounted || !containerRef.current) return;

          const sketch = (p: p5) => {
        let frameIndex = 0;
        let accumulator = 0;
        let lastTime = performance.now();
        let currentEffect = getEffect(runtimeRef.current.effectId);
        let colors = computeColors(runtimeRef.current.background, runtimeRef.current.invert);

        const resetCtx = () => {
          try {
            const runtime = runtimeRef.current;
            currentEffect = getEffect(runtime.effectId);
            const seedHash = hashSeed(runtime.seed);
            const baseData: Record<string, unknown> = {};
            effectCtxRef.current = {
              data: baseData,
              seedHash,
              baseSeed: runtime.seed,
            };
            colors = computeColors(runtime.background, runtime.invert);
            frameIndex = 0;
            accumulator = 0;
            lastTime = performance.now();
            lastFrameReported = -1;
            setCurrentFrame(0);

            // Reset frame tracking
            frameIndex = 0;
            accumulator = 0;
            runtime.needsReset = false;
            if (p.width !== runtime.width || p.height !== runtime.height) {
              p.resizeCanvas(runtime.width, runtime.height);
            }
            p.noSmooth();
            p.pixelDensity(1);
            p.background(colors.paper);
            const initContext = {
              rng: createRng(`${effectCtxRef.current.baseSeed}-init`),
              data: baseData,
              seedHash,
              colors,
            };
            currentEffect.init(p, initContext, runtime.params);
            effectCtxRef.current.data = initContext.data ?? baseData;
          } catch (error) {
            const appError = createAnimationError("effect-init", error as Error, { effectId: runtimeRef.current.effectId });
            errorManager.handleError(appError);
            addNotification("Animation initialization failed. Trying to recover...", "error");

            // Try to recover with default parameters
            try {
              const runtime = runtimeRef.current;
              const defaultEffect = getEffect("square-drift"); // fallback to known working effect
              currentEffect = defaultEffect;
              const initContext = {
                rng: createRng(`fallback-init`),
                data: {},
                seedHash: hashSeed("fallback"),
                colors: { paper: 255, ink: 0 },
              };
              defaultEffect.init(p, initContext, {});
              addNotification("Recovered with fallback effect", "info");
            } catch (recoveryError) {
              console.error("Failed to recover from effect initialization error:", recoveryError);
            }
          }
        };

        p.setup = () => {
          const runtime = runtimeRef.current;
          p.createCanvas(runtime.width, runtime.height);
          resetCtx();
        };

        p.draw = () => {
          const runtime = runtimeRef.current;
          if (!runtime) return;


          try {
            if (runtime.needsReset) {
              resetCtx();
            }

            const now = performance.now();
            const deltaSec = (now - lastTime) / 1000;
            lastTime = now;

            const targetFps = Math.max(
              1,
              runtime.qualityMode === "preview" ? Math.min(runtime.fps, 12) : runtime.fps,
            );
            const totalFrames = Math.max(1, Math.round(runtime.durationSec * targetFps));
            const frameDuration = 1 / targetFps;

            // Handle timeline synchronization FIRST
            let normalizedTime: number;

            if (timelineMode) {
              // Check if timeline was manually scrubbed (user interaction)
              const timelineChanged = Math.abs(timelineCurrentTime - lastTimelineTime.current) > 0.001;

              if (timelineChanged && !runtime.playing) {
                // User scrubbed timeline while paused - use timeline time
                normalizedTime = timelineCurrentTime;
                frameIndex = Math.round(normalizedTime * totalFrames) % totalFrames;
                lastTimelineTime.current = timelineCurrentTime;
                console.log('CanvasHost: Timeline scrubbed to:', normalizedTime, 'frame:', frameIndex);
              } else if (runtime.playing) {
                // Animation is playing - advance frames and update timeline
                accumulator += deltaSec;
                if (accumulator >= frameDuration) {
                  const steps = Math.max(1, Math.floor(accumulator / frameDuration));
                  accumulator -= steps * frameDuration;
                  frameIndex = (frameIndex + steps) % totalFrames;
                }
                normalizedTime = frameIndex / totalFrames;

                // Update timeline to match animation
                setCurrentTime(normalizedTime);
                lastTimelineTime.current = normalizedTime;
                console.log('CanvasHost: Timeline updated to:', normalizedTime, 'frame:', frameIndex);
              } else {
                // Paused - use current timeline position
                normalizedTime = timelineCurrentTime;
                frameIndex = Math.round(normalizedTime * totalFrames) % totalFrames;
              }
            } else {
              // No timeline mode - normal playback
              if (runtime.playing) {
                accumulator += deltaSec;
                if (accumulator >= frameDuration) {
                  const steps = Math.max(1, Math.floor(accumulator / frameDuration));
                  accumulator -= steps * frameDuration;
                  frameIndex = (frameIndex + steps) % totalFrames;
                }
              }
              normalizedTime = frameIndex / totalFrames;
            }

            const ctxColors = computeColors(runtime.background, runtime.invert);
            const ctxSeed = `${effectCtxRef.current.baseSeed}-frame-${frameIndex}`;
            const ctx = {
              rng: createRng(ctxSeed),
              data: effectCtxRef.current.data,
              seedHash: effectCtxRef.current.seedHash,
              colors: ctxColors,
            };

            // Use animated parameters if timeline mode is enabled
            let effectParams = runtime.params;
            if (timelineMode) {
              const animatedParams: ParamValues = {};
              Object.keys(runtime.params).forEach(paramKey => {
                const animatedValue = getAnimatedValue(
                  paramKey,
                  normalizedTime,
                  runtime.params[paramKey]
                );
                animatedParams[paramKey] = animatedValue;
                console.log(`CanvasHost: Animating ${paramKey}:`, runtime.params[paramKey], '->', animatedValue, 'at time', normalizedTime);
              });
              effectParams = animatedParams;
            }

            p.background(ctxColors.paper);
            currentEffect.update(p, ctx, frameIndex / targetFps, frameIndex, effectParams);
            currentEffect.render(p, ctx, frameIndex / targetFps, frameIndex, effectParams);

            if (frameIndex !== lastFrameReported) {
              lastFrameReported = frameIndex;
              setCurrentFrame(frameIndex);
            }
          } catch (error) {
            // Graceful error handling during animation
            const appError = createAnimationError("animation-render", error as Error, {
              effectId: runtime.effectId,
              frameIndex,
              targetFps: Math.max(
                1,
                runtime.qualityMode === "preview" ? Math.min(runtime.fps, 12) : runtime.fps,
              )
            });
            errorManager.handleError(appError);

            // Try to continue with simplified rendering
            try {
              p.background(255);
              p.fill(0);
              p.textAlign(p.CENTER, p.CENTER);
              p.text("Animation Error", p.width / 2, p.height / 2);
            } catch (fallbackError) {
              console.error("Complete rendering failure:", fallbackError);
            }
          }
        };
      };

        instance = new P5Constructor(sketch, containerRef.current);
      } catch (error) {
        const appError = createCanvasError("p5-setup", error as Error);
        await errorManager.handleError(appError);
        addNotification("Canvas setup failed. Please refresh the page.", "error");
      }
    };

    setupP5();

    return () => {
      mounted = false;
      if (instance) {
        instance.remove();
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative flex h-full w-full items-center justify-center bg-paper"
    />
  );
}

export type ExportConfig = {
  width: number;
  height: number;
  fps: number;
  durationSec: number;
  effectId: string;
  params: ParamValues;
  seed: string;
  background: Background;
  invert: boolean;
};

export async function createExportSketch(
  config: ExportConfig,
  container: HTMLElement,
): Promise<p5> {
  const { default: P5Constructor } = await import("p5");
  const effect = getEffect(config.effectId);
  const colors = computeColors(config.background, config.invert);
  const seedHash = hashSeed(config.seed);
  let effectData: Record<string, unknown> = {};

  const sketch = (p: p5) => {
    const targetFps = Math.max(1, config.fps);

    const runInit = () => {
      effectData = {};
      p.noSmooth();
      p.pixelDensity(1);
      p.background(colors.paper);
      effect.init(
        p,
        {
          rng: createRng(`${config.seed}-init`),
          data: effectData,
          seedHash,
          colors,
        },
        config.params,
      );
    };

    const renderFrame = (frameIndex: number) => {
      const ctx = {
        rng: createRng(`${config.seed}-frame-${frameIndex}`),
        data: effectData,
        seedHash,
        colors,
      };
      const time = frameIndex / targetFps;
      p.background(colors.paper);
      effect.update(p, ctx, time, frameIndex, config.params);
      effect.render(p, ctx, time, frameIndex, config.params);
    };

    (p as unknown as { renderFrame: (frame: number) => void }).renderFrame = renderFrame;

    p.setup = () => {
      p.createCanvas(config.width, config.height);
      runInit();
    };

    p.draw = () => {
      // no-op; frames rendered manually during export
      p.noLoop();
    };
  };

  return new P5Constructor(sketch, container);
}
