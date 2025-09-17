import type p5 from "p5";
import type { Effect } from "./types";

const defaults = {
  shapeCount: 8,
  shapeSize: 60,
  animSpeed: 1.0,
  rotationSpeed: 0.5,
  symmetry: 6,
  complexity: 3,
  mode: "mandala" as const,
  shape: "polygon" as const,
  layering: "overlay" as const,
};

type GeometricMode = "mandala" | "spiral" | "tessellation" | "fractal" | "kaleidoscope" | "crystalline";
type ShapeType = "polygon" | "circle" | "star" | "flower" | "gear" | "diamond";
type LayeringMode = "overlay" | "subtract" | "multiply" | "screen";

type GeometricShape = {
  x: number;
  y: number;
  size: number;
  rotation: number;
  sides: number;
  layer: number;
  phase: number;
  alpha: number;
};

type GeometricState = {
  shapes: GeometricShape[];
  prepared: boolean;
  lastShapeCount: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const createShape = (
  p: p5,
  rng: () => number,
  layer: number,
  centerX: number,
  centerY: number,
  baseSize: number,
  complexity: number
): GeometricShape => {
  const angle = rng() * Math.PI * 2;
  const radius = layer * baseSize * 0.5;

  return {
    x: centerX + Math.cos(angle) * radius,
    y: centerY + Math.sin(angle) * radius,
    size: baseSize * (0.5 + rng() * 0.5),
    rotation: rng() * Math.PI * 2,
    sides: Math.floor(3 + rng() * complexity),
    layer,
    phase: rng() * Math.PI * 2,
    alpha: 0.3 + rng() * 0.4,
  };
};

const drawPolygon = (p: p5, sides: number, size: number) => {
  p.beginShape();
  for (let i = 0; i < sides; i++) {
    const angle = (i * Math.PI * 2) / sides;
    const x = Math.cos(angle) * size;
    const y = Math.sin(angle) * size;
    p.vertex(x, y);
  }
  p.endShape(p.CLOSE);
};

const drawStar = (p: p5, points: number, size: number) => {
  const outerRadius = size;
  const innerRadius = size * 0.4;

  p.beginShape();
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    p.vertex(x, y);
  }
  p.endShape(p.CLOSE);
};

const drawFlower = (p: p5, petals: number, size: number) => {
  for (let i = 0; i < petals; i++) {
    p.push();
    p.rotate((i * Math.PI * 2) / petals);
    p.ellipse(size * 0.3, 0, size * 0.6, size * 0.3);
    p.pop();
  }
};

const drawGear = (p: p5, teeth: number, size: number) => {
  const innerRadius = size * 0.7;
  const outerRadius = size;

  p.beginShape();
  for (let i = 0; i < teeth * 4; i++) {
    const angle = (i * Math.PI * 2) / (teeth * 4);
    const radius = i % 4 < 2 ? outerRadius : innerRadius;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    p.vertex(x, y);
  }
  p.endShape(p.CLOSE);
};

export const geometric: Effect = {
  id: "geometric",
  name: "Geometric",
  params: [
    { key: "shapeCount", type: "int", label: "Shape Count", min: 3, max: 50, step: 1 },
    { key: "shapeSize", type: "number", label: "Shape Size", min: 10, max: 200, step: 5 },
    { key: "animSpeed", type: "number", label: "Animation Speed", min: 0.1, max: 3, step: 0.1 },
    { key: "rotationSpeed", type: "number", label: "Rotation Speed", min: 0, max: 2, step: 0.1 },
    { key: "symmetry", type: "int", label: "Symmetry", min: 2, max: 12, step: 1 },
    { key: "complexity", type: "int", label: "Complexity", min: 2, max: 8, step: 1 },
    {
      key: "mode",
      type: "select",
      label: "Pattern Mode",
      options: ["mandala", "spiral", "tessellation", "fractal", "kaleidoscope", "crystalline"],
    },
    {
      key: "shape",
      type: "select",
      label: "Base Shape",
      options: ["polygon", "circle", "star", "flower", "gear", "diamond"],
    },
    {
      key: "layering",
      type: "select",
      label: "Layer Mode",
      options: ["overlay", "subtract", "multiply", "screen"],
    },
  ],
  defaults,
  init(p, ctx, params) {
    const shapeCount = clamp(Number(params.shapeCount ?? defaults.shapeCount), 3, 50);
    const shapeSize = clamp(Number(params.shapeSize ?? defaults.shapeSize), 10, 200);
    const complexity = clamp(Number(params.complexity ?? defaults.complexity), 2, 8);

    const shapes: GeometricShape[] = [];
    const centerX = p.width / 2;
    const centerY = p.height / 2;

    for (let i = 0; i < shapeCount; i++) {
      const layer = Math.floor(i / 3) + 1;
      shapes.push(createShape(p, ctx.rng, layer, centerX, centerY, shapeSize, complexity));
    }

    const state: GeometricState = {
      shapes,
      prepared: true,
      lastShapeCount: shapeCount,
    };

    p.pixelDensity(1);
    p.noiseSeed(ctx.seedHash);

    ctx.data = state;
  },
  update() {
    // No-op; all work done in render.
  },
  render(p, ctx, t, _frame, params) {
    const state = ctx.data as GeometricState | undefined;
    if (!state || !state.prepared) return;

    const shapeCount = clamp(Number(params.shapeCount ?? defaults.shapeCount), 3, 50);
    const shapeSize = clamp(Number(params.shapeSize ?? defaults.shapeSize), 10, 200);
    const animSpeed = clamp(Number(params.animSpeed ?? defaults.animSpeed), 0.1, 3);
    const rotationSpeed = clamp(Number(params.rotationSpeed ?? defaults.rotationSpeed), 0, 2);
    const symmetry = clamp(Number(params.symmetry ?? defaults.symmetry), 2, 12);
    const complexity = clamp(Number(params.complexity ?? defaults.complexity), 2, 8);
    const mode = (params.mode ?? defaults.mode) as GeometricMode;
    const shape = (params.shape ?? defaults.shape) as ShapeType;
    const layering = (params.layering ?? defaults.layering) as LayeringMode;

    // Adjust shape count if changed
    if (state.lastShapeCount !== shapeCount) {
      const centerX = p.width / 2;
      const centerY = p.height / 2;

      if (shapeCount > state.shapes.length) {
        // Add shapes
        while (state.shapes.length < shapeCount) {
          const layer = Math.floor(state.shapes.length / 3) + 1;
          state.shapes.push(createShape(p, ctx.rng, layer, centerX, centerY, shapeSize, complexity));
        }
      } else {
        // Remove shapes
        state.shapes = state.shapes.slice(0, shapeCount);
      }
      state.lastShapeCount = shapeCount;
    }

    p.background(ctx.colors.paper);
    p.stroke(ctx.colors.ink);
    p.strokeWeight(2);

    const time = t * animSpeed;
    const centerX = p.width / 2;
    const centerY = p.height / 2;

    // Apply symmetry by drawing multiple rotated versions
    for (let sym = 0; sym < symmetry; sym++) {
      p.push();
      p.translate(centerX, centerY);
      p.rotate((sym * Math.PI * 2) / symmetry);
      p.translate(-centerX, -centerY);

      state.shapes.forEach((geoShape, i) => {
        let x = geoShape.x;
        let y = geoShape.y;
        let size = geoShape.size;
        let rotation = geoShape.rotation + time * rotationSpeed + geoShape.phase;
        let alpha = geoShape.alpha * 255;

        // Apply mode-specific transformations
        switch (mode) {
          case "mandala": {
            const pulse = Math.sin(time + geoShape.phase) * 0.3 + 0.7;
            size *= pulse;
            alpha *= pulse;
            break;
          }

          case "spiral": {
            const spiralAngle = time * 0.5 + i * 0.2;
            const spiralRadius = i * 20 + Math.sin(time + i) * 30;
            x = centerX + Math.cos(spiralAngle) * spiralRadius;
            y = centerY + Math.sin(spiralAngle) * spiralRadius;
            rotation += spiralAngle;
            break;
          }

          case "tessellation": {
            const gridX = (i % 4) - 1.5;
            const gridY = Math.floor(i / 4) - 1.5;
            x = centerX + gridX * shapeSize * 1.5 + Math.sin(time + i) * 20;
            y = centerY + gridY * shapeSize * 1.5 + Math.cos(time + i) * 20;
            break;
          }

          case "fractal": {
            const fractalScale = Math.pow(0.8, geoShape.layer);
            size *= fractalScale;
            const fractalOffset = Math.sin(time + geoShape.layer) * 30;
            x += fractalOffset;
            y += fractalOffset;
            break;
          }

          case "kaleidoscope": {
            const kaleidoAngle = time + i * 0.5;
            const kaleidoRadius = 50 + Math.sin(time * 0.5 + i) * 100;
            x = centerX + Math.cos(kaleidoAngle) * kaleidoRadius;
            y = centerY + Math.sin(kaleidoAngle) * kaleidoRadius;
            size *= Math.sin(time + i) * 0.5 + 0.5;
            break;
          }

          case "crystalline": {
            const crystalPhase = Math.sin(time * 0.3 + i * 0.1);
            const crystalScale = crystalPhase * 0.5 + 1;
            size *= crystalScale;
            alpha *= Math.abs(crystalPhase) + 0.3;
            break;
          }
        }

        // Set blend mode based on layering
        switch (layering) {
          case "subtract":
            // p.blendMode(p.DIFFERENCE); // Not available in all p5 versions
            alpha *= 0.5;
            break;
          case "multiply":
            alpha *= 0.7;
            break;
          case "screen":
            alpha *= 0.8;
            break;
          case "overlay":
          default:
            // Normal blending
            break;
        }

        p.fill(ctx.colors.ink, alpha * 0.3);
        p.stroke(ctx.colors.ink, alpha);

        p.push();
        p.translate(x, y);
        p.rotate(rotation);

        // Draw the shape
        switch (shape) {
          case "polygon":
            drawPolygon(p, geoShape.sides, size / 2);
            break;

          case "circle":
            p.ellipse(0, 0, size, size);
            break;

          case "star":
            drawStar(p, geoShape.sides, size / 2);
            break;

          case "flower":
            drawFlower(p, geoShape.sides, size / 2);
            break;

          case "gear":
            drawGear(p, geoShape.sides, size / 2);
            break;

          case "diamond":
            p.beginShape();
            p.vertex(0, -size / 2);
            p.vertex(size / 4, 0);
            p.vertex(0, size / 2);
            p.vertex(-size / 4, 0);
            p.endShape(p.CLOSE);
            break;
        }

        p.pop();
      });

      p.pop();
    }
  },
};