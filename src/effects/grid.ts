import type p5 from "p5";
import type { Effect } from "./types";

const defaults = {
  gridSize: 20,
  lineWeight: 2,
  animSpeed: 1.0,
  distortAmount: 10,
  mode: "breathing" as const,
  pattern: "square" as const,
  fillMode: "none" as const,
  fadeEdges: false,
};

type AnimationMode = "breathing" | "wave" | "rotate" | "expand" | "flicker" | "spiral";
type PatternType = "square" | "diagonal" | "hexagon" | "triangle" | "circle";
type FillMode = "none" | "alternate" | "random" | "gradient";

type GridState = {
  cells: Array<{ x: number; y: number; active: boolean; phase: number }>;
  cols: number;
  rows: number;
  prepared: boolean;
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const createGridCells = (p: p5, cols: number, rows: number, gridSize: number) => {
  const cells: Array<{ x: number; y: number; active: boolean; phase: number }> = [];
  const offsetX = (p.width - (cols - 1) * gridSize) / 2;
  const offsetY = (p.height - (rows - 1) * gridSize) / 2;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      cells.push({
        x: offsetX + x * gridSize,
        y: offsetY + y * gridSize,
        active: true,
        phase: (x + y) * 0.1, // Staggered animation phase
      });
    }
  }

  return cells;
};

export const grid: Effect = {
  id: "grid",
  name: "Grid",
  params: [
    { key: "gridSize", type: "int", label: "Grid Size", min: 10, max: 100, step: 2 },
    { key: "lineWeight", type: "number", label: "Line Weight", min: 0.5, max: 10, step: 0.5 },
    { key: "animSpeed", type: "number", label: "Animation Speed", min: 0.1, max: 3, step: 0.1 },
    { key: "distortAmount", type: "number", label: "Distortion", min: 0, max: 50, step: 1 },
    {
      key: "mode",
      type: "select",
      label: "Animation Mode",
      options: ["breathing", "wave", "rotate", "expand", "flicker", "spiral"],
    },
    {
      key: "pattern",
      type: "select",
      label: "Pattern",
      options: ["square", "diagonal", "hexagon", "triangle", "circle"],
    },
    {
      key: "fillMode",
      type: "select",
      label: "Fill Mode",
      options: ["none", "alternate", "random", "gradient"],
    },
    { key: "fadeEdges", type: "boolean", label: "Fade Edges" },
  ],
  defaults,
  init(p, ctx, params) {
    const gridSize = clamp(Number(params.gridSize ?? defaults.gridSize), 10, 100);
    const cols = Math.floor(p.width / gridSize) + 1;
    const rows = Math.floor(p.height / gridSize) + 1;

    const state: GridState = {
      cells: createGridCells(p, cols, rows, gridSize),
      cols,
      rows,
      prepared: true,
    };

    p.pixelDensity(1);
    p.noiseSeed(ctx.seedHash);

    ctx.data = state;
  },
  update() {
    // No-op; all work done in render.
  },
  render(p, ctx, t, _frame, params) {
    const state = ctx.data as GridState | undefined;
    if (!state || !state.prepared) return;

    const gridSize = clamp(Number(params.gridSize ?? defaults.gridSize), 10, 100);
    const lineWeight = clamp(Number(params.lineWeight ?? defaults.lineWeight), 0.5, 10);
    const animSpeed = clamp(Number(params.animSpeed ?? defaults.animSpeed), 0.1, 3);
    const distortAmount = clamp(Number(params.distortAmount ?? defaults.distortAmount), 0, 50);
    const mode = (params.mode ?? defaults.mode) as AnimationMode;
    const pattern = (params.pattern ?? defaults.pattern) as PatternType;
    const fillMode = (params.fillMode ?? defaults.fillMode) as FillMode;
    const fadeEdges = Boolean(params.fadeEdges ?? defaults.fadeEdges);

    // Recalculate grid if size changed
    const cols = Math.floor(p.width / gridSize) + 1;
    const rows = Math.floor(p.height / gridSize) + 1;
    if (state.cols !== cols || state.rows !== rows) {
      state.cells = createGridCells(p, cols, rows, gridSize);
      state.cols = cols;
      state.rows = rows;
    }

    p.background(ctx.colors.paper);
    p.stroke(ctx.colors.ink);
    p.strokeWeight(lineWeight);

    if (fillMode === "none") {
      p.noFill();
    }

    const time = t * animSpeed;
    const center = { x: p.width / 2, y: p.height / 2 };

    state.cells.forEach((cell, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);

      let x = cell.x;
      let y = cell.y;
      let size = gridSize;
      let alpha = 255;
      let rotation = 0;

      // Distance from center for some effects
      const distFromCenter = Math.sqrt(
        Math.pow(x - center.x, 2) + Math.pow(y - center.y, 2)
      );

      switch (mode) {
        case "breathing": {
          const breathe = Math.sin(time * 2 + cell.phase) * 0.3 + 1;
          size *= breathe;
          alpha = (breathe * 200 + 55);
          break;
        }

        case "wave": {
          const waveOffset = Math.sin(time + col * 0.2 + row * 0.15) * distortAmount;
          y += waveOffset;
          const wavePhase = Math.cos(time * 0.8 + col * 0.1);
          alpha = (wavePhase * 128 + 127);
          break;
        }

        case "rotate": {
          rotation = time + cell.phase;
          const rotationScale = Math.sin(time * 0.5 + cell.phase) * 0.5 + 0.7;
          size *= rotationScale;
          break;
        }

        case "expand": {
          const expandPhase = (time + distFromCenter * 0.01) % 2;
          if (expandPhase < 1) {
            size *= expandPhase;
            alpha = expandPhase * 255;
          } else {
            size *= (2 - expandPhase);
            alpha = (2 - expandPhase) * 255;
          }
          break;
        }

        case "flicker": {
          if (p.noise(col * 0.1, row * 0.1, time * 2) > 0.6) {
            alpha = p.noise(col * 0.05, row * 0.05, time * 5) * 255;
          } else {
            alpha = 50;
          }
          break;
        }

        case "spiral": {
          const angle = Math.atan2(y - center.y, x - center.x);
          const spiralTime = time - distFromCenter * 0.01 + angle * 0.5;
          const spiralScale = Math.sin(spiralTime * 3) * 0.4 + 0.8;
          size *= spiralScale;
          rotation = spiralTime;
          break;
        }
      }

      // Apply fade edges
      if (fadeEdges) {
        const edgeDistX = Math.min(col, cols - col - 1) / cols;
        const edgeDistY = Math.min(row, rows - row - 1) / rows;
        const edgeFade = Math.min(edgeDistX, edgeDistY) * 4;
        alpha *= Math.min(1, edgeFade);
      }

      // Set fill based on fill mode
      if (fillMode !== "none") {
        let fillAlpha = alpha;
        switch (fillMode) {
          case "alternate":
            if ((col + row) % 2 === 0) {
              p.fill(ctx.colors.ink, fillAlpha * 0.3);
            } else {
              p.noFill();
            }
            break;
          case "random":
            if (p.noise(col * 0.1, row * 0.1) > 0.5) {
              p.fill(ctx.colors.ink, fillAlpha * 0.4);
            } else {
              p.noFill();
            }
            break;
          case "gradient":
            const gradientAlpha = (distFromCenter / Math.max(p.width, p.height)) * fillAlpha * 0.5;
            p.fill(ctx.colors.ink, gradientAlpha);
            break;
        }
      }

      p.stroke(ctx.colors.ink, alpha);

      p.push();
      p.translate(x, y);
      if (rotation !== 0) {
        p.rotate(rotation);
      }

      // Draw different patterns
      switch (pattern) {
        case "square":
          p.rect(-size / 2, -size / 2, size, size);
          break;

        case "diagonal":
          p.beginShape();
          p.vertex(-size / 2, 0);
          p.vertex(0, -size / 2);
          p.vertex(size / 2, 0);
          p.vertex(0, size / 2);
          p.endShape(p.CLOSE);
          break;

        case "hexagon":
          p.beginShape();
          for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const hx = (size / 2) * Math.cos(angle);
            const hy = (size / 2) * Math.sin(angle);
            p.vertex(hx, hy);
          }
          p.endShape(p.CLOSE);
          break;

        case "triangle":
          p.beginShape();
          p.vertex(0, -size / 2);
          p.vertex(-size / 2, size / 2);
          p.vertex(size / 2, size / 2);
          p.endShape(p.CLOSE);
          break;

        case "circle":
          p.ellipse(0, 0, size, size);
          break;
      }

      p.pop();
    });
  },
};