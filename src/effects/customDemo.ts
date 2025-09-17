import type p5 from "p5";
import type { Effect, EffectContext, ParamValues } from "./types";

export const customDemo: Effect = {
  id: "custom-demo",
  name: "Custom Parameters Demo",
  params: [
    {
      key: "intensity",
      type: "range",
      label: "Intensity Range",
      min: 0,
      max: 100,
      step: 1,
    },
    {
      key: "position",
      type: "vector2",
      label: "Center Position",
      min: -100,
      max: 100,
    },
    {
      key: "tintColor",
      type: "color",
      label: "Tint Color",
      monochrome: true,
    },
    {
      key: "animationCurve",
      type: "curve",
      label: "Animation Curve",
      points: [
        { x: 0, y: 0 },
        { x: 0.3, y: 0.8 },
        { x: 0.7, y: 0.2 },
        { x: 1, y: 1 },
      ],
    },
    {
      key: "gridSize",
      type: "int",
      label: "Grid Size",
      min: 5,
      max: 50,
      step: 1,
    },
    {
      key: "enableRotation",
      type: "boolean",
      label: "Enable Rotation",
    },
  ],
  defaults: {
    intensity: { min: 10, max: 90 },
    position: { x: 0, y: 0 },
    tintColor: "128",
    animationCurve: [
      { x: 0, y: 0 },
      { x: 0.3, y: 0.8 },
      { x: 0.7, y: 0.2 },
      { x: 1, y: 1 },
    ],
    gridSize: 20,
    enableRotation: false,
  },

  init(p: p5, ctx: EffectContext, params: ParamValues): void {
    p.stroke(ctx.colors.ink);
    p.fill(ctx.colors.ink);
  },

  update(p: p5, ctx: EffectContext, t: number, frame: number, params: ParamValues): void {
    // Animation logic based on custom curve
    const curve = params.animationCurve as { x: number; y: number }[];
    const normalizedTime = (t % 10) / 10; // 10-second loop

    let animationValue = 0;
    if (curve && curve.length >= 2) {
      // Simple linear interpolation between curve points
      for (let i = 0; i < curve.length - 1; i++) {
        const p1 = curve[i];
        const p2 = curve[i + 1];
        if (normalizedTime >= p1.x && normalizedTime <= p2.x) {
          const localT = (normalizedTime - p1.x) / (p2.x - p1.x);
          animationValue = p1.y + (p2.y - p1.y) * localT;
          break;
        }
      }
    }

    ctx.data.animationValue = animationValue;
  },

  render(p: p5, ctx: EffectContext, t: number, frame: number, params: ParamValues): void {
    const intensity = params.intensity as { min: number; max: number };
    const position = params.position as { x: number; y: number };
    const tintColor = parseInt(params.tintColor as string) || 128;
    const gridSize = params.gridSize as number;
    const enableRotation = params.enableRotation as boolean;
    const animationValue = (ctx.data.animationValue as number) || 0;

    // Apply tint
    const tintedColor = Math.round(ctx.colors.ink * (tintColor / 255));
    p.stroke(tintedColor);
    p.fill(tintedColor);

    // Center point with position offset
    const centerX = p.width / 2 + position.x;
    const centerY = p.height / 2 + position.y;

    // Rotation based on animation curve
    if (enableRotation) {
      p.push();
      p.translate(centerX, centerY);
      p.rotate(animationValue * p.TWO_PI);
      p.translate(-centerX, -centerY);
    }

    // Draw grid pattern with intensity-based variation
    const minIntensity = intensity.min / 100;
    const maxIntensity = intensity.max / 100;
    const intensityRange = maxIntensity - minIntensity;

    for (let x = 0; x < p.width; x += gridSize) {
      for (let y = 0; y < p.height; y += gridSize) {
        const distFromCenter = p.dist(x, y, centerX, centerY);
        const normalizedDist = Math.min(1, distFromCenter / (p.width / 2));

        // Apply intensity variation
        const localIntensity = minIntensity + intensityRange * (1 - normalizedDist);
        const animatedIntensity = localIntensity * animationValue;

        if (animatedIntensity > 0.1) {
          const size = gridSize * animatedIntensity;
          p.rectMode(p.CENTER);
          p.rect(x + gridSize / 2, y + gridSize / 2, size, size);
        }
      }
    }

    if (enableRotation) {
      p.pop();
    }

    // Draw curve visualization in corner
    p.push();
    p.translate(p.width - 100, 20);
    p.stroke(ctx.colors.ink);
    p.noFill();
    p.rect(0, 0, 80, 60);

    const curve = params.animationCurve as { x: number; y: number }[];
    if (curve && curve.length >= 2) {
      p.beginShape();
      p.noFill();
      for (let i = 0; i < curve.length; i++) {
        const point = curve[i];
        p.vertex(point.x * 80, (1 - point.y) * 60);
      }
      p.endShape();

      // Show current position on curve
      const normalizedTime = (t % 10) / 10;
      p.fill(ctx.colors.ink);
      p.circle(normalizedTime * 80, (1 - animationValue) * 60, 4);
    }
    p.pop();
  },
};