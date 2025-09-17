"use client";

import { useEffect, useRef } from "react";
import type p5 from "p5";

import { getEffect } from "@/effects";
import type { ParamValues } from "@/effects/types";
import { createRng, hashSeed } from "@/lib/rng";
import { useEditorStore, type Background } from "@/store/useEditor";

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
  const setCurrentFrame = useEditorStore((state) => state.setCurrentFrame);

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
      const { default: P5Constructor } = await import("p5");
      if (!mounted || !containerRef.current) return;

      const sketch = (p: p5) => {
        let frameIndex = 0;
        let accumulator = 0;
        let lastTime = performance.now();
        let currentEffect = getEffect(runtimeRef.current.effectId);
        let colors = computeColors(runtimeRef.current.background, runtimeRef.current.invert);

        const resetCtx = () => {
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
        };

        p.setup = () => {
          const runtime = runtimeRef.current;
          p.createCanvas(runtime.width, runtime.height);
          resetCtx();
        };

        p.draw = () => {
          const runtime = runtimeRef.current;
          if (!runtime) return;

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

          if (runtime.playing) {
            accumulator += deltaSec;
            if (accumulator >= frameDuration) {
              const steps = Math.max(1, Math.floor(accumulator / frameDuration));
              accumulator -= steps * frameDuration;
              frameIndex = (frameIndex + steps) % totalFrames;
            }
          }

          const ctxColors = computeColors(runtime.background, runtime.invert);
          const ctxSeed = `${effectCtxRef.current.baseSeed}-frame-${frameIndex}`;
          const ctx = {
            rng: createRng(ctxSeed),
            data: effectCtxRef.current.data,
            seedHash: effectCtxRef.current.seedHash,
            colors: ctxColors,
          };

          p.background(ctxColors.paper);
          currentEffect.update(p, ctx, frameIndex / targetFps, frameIndex, runtime.params);
          currentEffect.render(p, ctx, frameIndex / targetFps, frameIndex, runtime.params);

          if (frameIndex !== lastFrameReported) {
            lastFrameReported = frameIndex;
            setCurrentFrame(frameIndex);
          }
        };
      };

      instance = new P5Constructor(sketch, containerRef.current);
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
