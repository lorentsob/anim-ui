"use client";

import { useCallback, useEffect, useRef } from "react";
import type p5 from "p5";

import { getEffect } from "@/effects";
import type { ParamValues, EffectLayer } from "@/effects/types";
import { createRng, hashSeed } from "@/lib/rng";
import { applyBlendMode, createBlendGraphics } from "@/lib/blending";
import { useEditorStore, type Background } from "@/store/useEditor";
import { useBlendingStore } from "@/store/useBlending";
import { useNotificationStore } from "@/store/useNotifications";
import { useTimelineStore } from "@/store/useTimeline";

type BlendedRuntimeData = {
  width: number;
  height: number;
  fps: number;
  durationSec: number;
  playing: boolean;
  layers: EffectLayer[];
  seed: string;
  background: Background;
  invert: boolean;
  qualityMode: "preview" | "render";
  needsReset: boolean;
};

type LayerRuntime = {
  data: Record<string, unknown>;
  seedHash: number;
  baseSeed: string;
};

const computeColors = (background: Background, invert: boolean) => {
  const basePaper = background === "white" ? 255 : 0;
  const baseInk = basePaper === 255 ? 0 : 255;
  if (invert) {
    return { paper: baseInk, ink: basePaper };
  }
  return { paper: basePaper, ink: baseInk };
};

export function BlendedCanvasHost() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const runtimeRef = useRef<BlendedRuntimeData>({
    width: 640,
    height: 640,
    fps: 12,
    durationSec: 6,
    playing: true,
    layers: [],
    seed: "",
    background: "white",
    invert: false,
    qualityMode: "preview",
    needsReset: true,
  });

  const layerRuntimesRef = useRef<Map<string, LayerRuntime>>(new Map());
  const p5InstanceRef = useRef<p5 | null>(null);
  const playingRef = useRef(runtimeRef.current.playing);
  const timelineModeRef = useRef(false);
  const timelineTimeRef = useRef(0);
  const pendingRedrawRef = useRef(false);
  const lastTimelineBroadcastRef = useRef(0);

  const requestRedrawIfPaused = useCallback(() => {
    if (playingRef.current) return;
    const instance = p5InstanceRef.current;
    if (!instance) return;
    pendingRedrawRef.current = true;
    instance.redraw();
  }, []);

  const width = useEditorStore((state) => state.width);
  const height = useEditorStore((state) => state.height);
  const fps = useEditorStore((state) => state.fps);
  const durationSec = useEditorStore((state) => state.durationSec);
  const playing = useEditorStore((state) => state.playing);
  const seed = useEditorStore((state) => state.seed);
  const background = useEditorStore((state) => state.background);
  const invert = useEditorStore((state) => state.invert);
  const qualityMode = useEditorStore((state) => state.qualityMode);
  const setCurrentFrame = useEditorStore((state) => state.setCurrentFrame);
  const mainParams = useEditorStore((state) => state.params); // Main effect parameters
  const mainEffectId = useEditorStore((state) => state.effectId); // Main effect ID

  const layers = useBlendingStore((state) => state.layers);
  const timelineMode = useEditorStore((state) => state.timelineMode);
  const addNotification = useNotificationStore((state) => state.addNotification);
  const getAnimatedValue = useTimelineStore((state) => state.getAnimatedValue);
  const setCurrentTime = useTimelineStore((state) => state.setCurrentTime);
  const timelineCurrentTime = useTimelineStore((state) => state.currentTime);

  // Track if timeline time changed externally (from scrubbing)
  const lastTimelineTime = useRef<number>(0);


  // Sync state changes
  useEffect(() => {
    runtimeRef.current.width = width;
    runtimeRef.current.height = height;
    runtimeRef.current.needsReset = true;
    requestRedrawIfPaused();
  }, [width, height, requestRedrawIfPaused]);

  useEffect(() => { runtimeRef.current.fps = fps; requestRedrawIfPaused(); }, [fps, requestRedrawIfPaused]);
  useEffect(() => { runtimeRef.current.durationSec = durationSec; requestRedrawIfPaused(); }, [durationSec, requestRedrawIfPaused]);
  useEffect(() => {
    runtimeRef.current.playing = playing;
    playingRef.current = playing;
  }, [playing]);
  useEffect(() => {
    runtimeRef.current.seed = seed;
    runtimeRef.current.needsReset = true;
    requestRedrawIfPaused();
  }, [seed, requestRedrawIfPaused]);
  useEffect(() => {
    runtimeRef.current.background = background;
    runtimeRef.current.needsReset = true;
    requestRedrawIfPaused();
  }, [background, requestRedrawIfPaused]);
  useEffect(() => {
    runtimeRef.current.invert = invert;
    runtimeRef.current.needsReset = true;
    requestRedrawIfPaused();
  }, [invert, requestRedrawIfPaused]);
  useEffect(() => {
    runtimeRef.current.qualityMode = qualityMode;
    runtimeRef.current.needsReset = true;
    requestRedrawIfPaused();
  }, [qualityMode, requestRedrawIfPaused]);
  useEffect(() => {
    runtimeRef.current.layers = layers;
    runtimeRef.current.needsReset = true;
    requestRedrawIfPaused();
  }, [layers, requestRedrawIfPaused]);

  useEffect(() => {
    requestRedrawIfPaused();
  }, [mainParams, mainEffectId, requestRedrawIfPaused]);

  useEffect(() => {
    timelineModeRef.current = timelineMode;
  }, [timelineMode]);

  useEffect(() => {
    timelineTimeRef.current = timelineCurrentTime;
    if (timelineModeRef.current && !playingRef.current && p5InstanceRef.current) {
      pendingRedrawRef.current = true;
      p5InstanceRef.current.redraw();
    }
  }, [timelineCurrentTime]);

  useEffect(() => {
    const instance = p5InstanceRef.current;
    if (!instance) return;

    playingRef.current = playing;
    if (timelineModeRef.current) {
      if (playingRef.current) {
        instance.loop();
      } else {
        instance.noLoop();
        pendingRedrawRef.current = true;
        instance.redraw();
      }
    } else {
      if (playingRef.current) {
        instance.loop();
      } else {
        instance.noLoop();
      }
    }
  }, [timelineMode, playing]);

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
          let colors = computeColors(runtimeRef.current.background, runtimeRef.current.invert);
          let layerGraphics: Map<string, p5.Graphics> = new Map();
          let tempGraphics: p5.Graphics[] = [];

          const resetCtx = () => {
            try {
              const runtime = runtimeRef.current;
              colors = computeColors(runtime.background, runtime.invert);
              frameIndex = 0;
              accumulator = 0;
              lastTime = performance.now();
              lastFrameReported = -1;
              setCurrentFrame(0);
              lastTimelineTime.current = 0;
              lastTimelineBroadcastRef.current = 0;
              timelineTimeRef.current = 0;
              pendingRedrawRef.current = false;

              // Reset frame tracking  
              frameIndex = 0;
              accumulator = 0;

              // Clear layer graphics - p5.Graphics don't have remove(), just clear references
              layerGraphics.forEach(graphics => {
                if (graphics) {
                  try {
                    graphics.clear();
                  } catch (e) {
                    console.warn('Graphics clear failed:', e);
                  }
                }
              });
              layerGraphics.clear();
              // Clear temp graphics references
              tempGraphics.forEach(graphics => {
                if (graphics) {
                  try {
                    graphics.clear();
                  } catch (e) {
                    console.warn('Temp graphics clear failed:', e);
                  }
                }
              });
              tempGraphics = [];

              // Create graphics for each layer
              runtime.layers.forEach(layer => {
                if (layer.enabled) {
                  layerGraphics.set(layer.id, p.createGraphics(runtime.width, runtime.height));
                }
              });

              // Create temp graphics for blending
              if (runtime.layers.length > 1) {
                try {
                  tempGraphics = [
                    p.createGraphics(runtime.width, runtime.height),
                    p.createGraphics(runtime.width, runtime.height),
                    p.createGraphics(runtime.width, runtime.height),
                  ];
                  // Verify all graphics were created successfully
                  if (tempGraphics.some(g => !g)) {
                    console.warn('Some temp graphics failed to create, falling back to single layer mode');
                    tempGraphics = [];
                  }
                } catch (error) {
                  console.error('Failed to create temp graphics:', error);
                  tempGraphics = [];
                }
              }

              // Initialize each layer
              layerRuntimesRef.current.clear();
              runtime.layers.forEach(layer => {
                if (!layer.enabled) return;

                const effect = getEffect(layer.effectId);
                const seedHash = hashSeed(`${runtime.seed}-${layer.id}`);
                const baseData: Record<string, unknown> = {};

                layerRuntimesRef.current.set(layer.id, {
                  data: baseData,
                  seedHash,
                  baseSeed: `${runtime.seed}-${layer.id}`,
                });

                const graphics = layerGraphics.get(layer.id)!;
                graphics.noSmooth();
                graphics.pixelDensity(1);
                graphics.background(colors.paper);

                const initContext = {
                  rng: createRng(`${runtime.seed}-${layer.id}-init`),
                  data: baseData,
                  seedHash,
                  colors,
                };

                // Initialize effect with main p5 instance, then bind graphics
                try {
                  effect.init(p, initContext, layer.params);

                  // Store graphics reference for this layer
                  (initContext.data as any).__graphics = graphics;

                  // Ensure layer runtime exists and update data
                  const layerRuntime = layerRuntimesRef.current.get(layer.id);
                  if (layerRuntime) {
                    layerRuntime.data = initContext.data;
                  }
                } catch (error) {
                  console.error(`Failed to initialize effect ${layer.effectId} for layer ${layer.id}:`, error);
                  // Continue with other layers
                }
              });

              runtime.needsReset = false;

              if (p.width !== runtime.width || p.height !== runtime.height) {
                p.resizeCanvas(runtime.width, runtime.height);
              }
              p.noSmooth();
              p.pixelDensity(1);
              p.background(colors.paper);

            } catch (error) {
              console.error("Reset failed:", error);
              addNotification("Blending initialization failed. Trying to recover...", "error");
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

              const baseFps = Math.max(1, runtime.fps);
              const frameCount = Math.max(1, Math.round(runtime.durationSec * baseFps));
              const maxFrameIndex = Math.max(0, frameCount - 1);
              const isTimelineMode = timelineModeRef.current;
              const frameDuration = 1 / baseFps;

              // Handle playback and time calculation
              let normalizedTime: number;

              if (isTimelineMode) {
                if (runtime.playing) {
                  accumulator += deltaSec;
                  if (accumulator >= frameDuration) {
                    const steps = Math.max(1, Math.floor(accumulator / frameDuration));
                    accumulator -= steps * frameDuration;
                    frameIndex = (frameIndex + steps) % frameCount;
                  }
                  normalizedTime = maxFrameIndex > 0 ? frameIndex / maxFrameIndex : 0;

                  if (Math.abs(normalizedTime - lastTimelineBroadcastRef.current) > 0.0001) {
                    lastTimelineBroadcastRef.current = normalizedTime;
                    setCurrentTime(normalizedTime);
                  }
                  lastTimelineTime.current = normalizedTime;
                } else {
                  const externalTimelineTime = timelineTimeRef.current;
                  const timelineChanged = Math.abs(externalTimelineTime - lastTimelineTime.current) > 0.0001;

                  if (timelineChanged) {
                    const targetFrame = Math.min(
                      maxFrameIndex,
                      Math.max(0, Math.round(externalTimelineTime * maxFrameIndex))
                    );
                    frameIndex = targetFrame;
                    normalizedTime = maxFrameIndex > 0 ? frameIndex / maxFrameIndex : 0;
                    lastTimelineTime.current = normalizedTime;
                    lastTimelineBroadcastRef.current = normalizedTime;
                  } else {
                    normalizedTime = lastTimelineTime.current;
                  }
                }
              } else {
                if (runtime.playing) {
                  accumulator += deltaSec;
                  if (accumulator >= frameDuration) {
                    const steps = Math.max(1, Math.floor(accumulator / frameDuration));
                    accumulator -= steps * frameDuration;
                    frameIndex = (frameIndex + steps) % frameCount;
                  }
                }
                normalizedTime = maxFrameIndex > 0 ? frameIndex / maxFrameIndex : 0;
                lastTimelineTime.current = normalizedTime;
                lastTimelineBroadcastRef.current = normalizedTime;
              }

              const ctxColors = computeColors(runtime.background, runtime.invert);
              if (ctxColors && typeof ctxColors.paper !== 'undefined') {
                p.background(ctxColors.paper);
              } else {
                p.background(255); // fallback
              }

              if (runtime.layers.length === 0) {
                pendingRedrawRef.current = false;
                return;
              }

              // Render each enabled layer to its graphics buffer
              runtime.layers.forEach(layer => {
                if (!layer.enabled) return;

                const graphics = layerGraphics.get(layer.id);
                const layerRuntime = layerRuntimesRef.current.get(layer.id);
                if (!graphics || !layerRuntime) {
                  console.warn(`Missing graphics or runtime for layer ${layer.id}`);
                  return;
                }

                const effect = getEffect(layer.effectId);
                const ctxSeed = `${layerRuntime.baseSeed}-frame-${frameIndex}`;
                const ctx = {
                  rng: createRng(ctxSeed),
                  data: layerRuntime.data,
                  seedHash: layerRuntime.seedHash,
                  colors: ctxColors,
                };

                graphics.background(ctxColors.paper);

                // Temporarily override p5 drawing methods to use graphics
                const originalBackground = p.background;
                const originalFill = p.fill;
                const originalStroke = p.stroke;
                const originalRect = p.rect;
                const originalCircle = p.circle;
                const originalLine = p.line;
                const originalEllipse = p.ellipse;
                const originalTriangle = p.triangle;
                const originalPoint = p.point;
                const originalQuad = p.quad;
                const originalText = p.text;
                const originalImage = p.image;
                const originalBeginShape = p.beginShape;
                const originalEndShape = p.endShape;
                const originalVertex = p.vertex;
                const originalRectMode = p.rectMode;
                const originalEllipseMode = p.ellipseMode;
                const originalTextAlign = p.textAlign;

                // Override drawing methods to use graphics
                p.background = graphics.background.bind(graphics);
                p.fill = graphics.fill.bind(graphics);
                p.stroke = graphics.stroke.bind(graphics);
                p.rect = graphics.rect.bind(graphics);
                p.circle = graphics.circle.bind(graphics);
                p.line = graphics.line.bind(graphics);
                p.ellipse = graphics.ellipse.bind(graphics);
                p.triangle = graphics.triangle.bind(graphics);
                p.point = graphics.point.bind(graphics);
                p.quad = graphics.quad.bind(graphics);
                p.text = graphics.text.bind(graphics);
                p.image = graphics.image.bind(graphics);
                p.beginShape = graphics.beginShape.bind(graphics);
                p.endShape = graphics.endShape.bind(graphics);
                p.vertex = graphics.vertex.bind(graphics);
                p.rectMode = graphics.rectMode.bind(graphics);
                p.ellipseMode = graphics.ellipseMode.bind(graphics);
                p.textAlign = graphics.textAlign.bind(graphics);

                // Create a proxy to override width/height access
                const originalWidth = p.width;
                const originalHeight = p.height;
                const proxyP5 = new Proxy(p, {
                  get(target, prop) {
                    if (prop === 'width') return graphics.width;
                    if (prop === 'height') return graphics.height;
                    return target[prop as keyof typeof target];
                  }
                });

                // Determine which parameters to use
                let effectParams = layer.params; // Default to layer's own parameters

                // In timeline mode, check if this layer should use animated main parameters
                if (isTimelineMode && layer.effectId === mainEffectId) {
                  // This layer uses the main effect - apply animated parameters
                  const animatedParams: ParamValues = {};
                  Object.keys(mainParams).forEach(paramKey => {
                    const animatedValue = getAnimatedValue(
                      paramKey,
                      normalizedTime,
                      mainParams[paramKey]
                    );
                    animatedParams[paramKey] = animatedValue;
                  });
                  effectParams = animatedParams;
                } else if (layer.effectId === mainEffectId && !isTimelineMode) {
                  // This layer matches main effect and timeline is off, use main parameters
                  effectParams = mainParams;
                }

                try {
                  const frameTimeSec = frameIndex / baseFps;
                  effect.update(proxyP5 as any, ctx, frameTimeSec, frameIndex, effectParams);
                  effect.render(proxyP5 as any, ctx, frameTimeSec, frameIndex, effectParams);
                } finally {
                  // Restore original methods
                  p.background = originalBackground;
                  p.fill = originalFill;
                  p.stroke = originalStroke;
                  p.rect = originalRect;
                  p.circle = originalCircle;
                  p.line = originalLine;
                  p.ellipse = originalEllipse;
                  p.triangle = originalTriangle;
                  p.point = originalPoint;
                  p.quad = originalQuad;
                  p.text = originalText;
                  p.image = originalImage;
                  p.beginShape = originalBeginShape;
                  p.endShape = originalEndShape;
                  p.vertex = originalVertex;
                  p.rectMode = originalRectMode;
                  p.ellipseMode = originalEllipseMode;
                  p.textAlign = originalTextAlign;
                }
              });

              // Composite layers with blending
              const enabledLayers = runtime.layers.filter(layer => layer.enabled);
              if (enabledLayers.length === 1) {
                // Single layer - just draw directly
                const layer = enabledLayers[0];
                const graphics = layerGraphics.get(layer.id)!;
                p.tint(255, layer.opacity * 255);
                p.image(graphics, 0, 0);
                p.noTint();
              } else if (enabledLayers.length > 1 && tempGraphics.length >= 3 && tempGraphics[2]) {
                // Multi-layer blending
                let resultGraphics = tempGraphics[2];
                resultGraphics.clear();

                // Start with the first layer
                const firstLayer = enabledLayers[0];
                const firstGraphics = layerGraphics.get(firstLayer.id)!;
                resultGraphics.image(firstGraphics, 0, 0);

                // Blend subsequent layers
                for (let i = 1; i < enabledLayers.length; i++) {
                  const layer = enabledLayers[i];
                  const layerGraphics2 = layerGraphics.get(layer.id);

                  if (!layerGraphics2 || !tempGraphics[0]) {
                    console.warn(`Missing graphics for layer ${layer.id}, skipping blend`);
                    continue;
                  }

                  const blendContext = {
                    sourceGraphics: layerGraphics2,
                    targetGraphics: resultGraphics,
                    resultGraphics: tempGraphics[0],
                    blendMode: layer.blendMode,
                    opacity: layer.opacity,
                  };

                  try {
                    applyBlendMode(p, blendContext);

                    // Swap result buffers
                    const temp = resultGraphics;
                    resultGraphics = tempGraphics[0];
                    tempGraphics[0] = temp;
                  } catch (error) {
                    console.error(`Blend failed for layer ${layer.id}:`, error);
                  }
                }

                p.image(resultGraphics, 0, 0);
              }

              if (frameIndex !== lastFrameReported) {
                lastFrameReported = frameIndex;
                setCurrentFrame(frameIndex);
              }

              pendingRedrawRef.current = false;
            } catch (error) {
              console.error("Blend rendering failed:", error);
              p.background(255);
              p.fill(0);
              p.textAlign(p.CENTER, p.CENTER);
              p.text("Blending Error", p.width / 2, p.height / 2);
              pendingRedrawRef.current = false;
            }
          };
        };

        instance = new P5Constructor(sketch, containerRef.current);
        p5InstanceRef.current = instance;
      } catch (error) {
        console.error("P5 setup failed:", error);
        addNotification("Canvas setup failed. Please refresh the page.", "error");
      }
    };

    setupP5();

    return () => {
      mounted = false;
      if (instance) {
        instance.remove();
      }
      p5InstanceRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative flex h-full w-full items-center justify-center bg-paper"
    />
  );
}
