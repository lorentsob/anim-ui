import type p5 from "p5";
import type { Effect } from "./types";

type SquareDriftState = {
  cache: Array<{ x: number; y: number; offset: number }>;
};

const defaults = {
  gridCols: 24,
  gridRows: 24,
  speed: 0.4,
  noiseScale: 0.005,
  threshold: 0.5,
  jitter: 0.15,
};

function ensureState(ctx: SquareDriftState | undefined): SquareDriftState {
  if (ctx && ctx.cache) {
    return ctx;
  }
  return { cache: [] };
}

export const squareDrift: Effect = {
  id: "square-drift",
  name: "Square Drift",
  params: [
    {
      key: "gridCols",
      type: "int",
      label: "Grid Columns",
      min: 4,
      max: 96,
      step: 1,
    },
    {
      key: "gridRows",
      type: "int",
      label: "Grid Rows",
      min: 4,
      max: 96,
      step: 1,
    },
    {
      key: "speed",
      type: "number",
      label: "Speed",
      min: 0,
      max: 2,
      step: 0.05,
    },
    {
      key: "noiseScale",
      type: "number",
      label: "Noise Scale",
      min: 0.001,
      max: 0.05,
      step: 0.001,
    },
    {
      key: "threshold",
      type: "number",
      label: "Threshold",
      min: 0,
      max: 1,
      step: 0.01,
    },
    {
      key: "jitter",
      type: "number",
      label: "Jitter",
      min: 0,
      max: 1,
      step: 0.01,
    },
  ],
  defaults,
  init(p, ctx, params) {
    const state = ensureState(ctx.data as SquareDriftState | undefined);
    const cols = Number(params.gridCols ?? defaults.gridCols);
    const rows = Number(params.gridRows ?? defaults.gridRows);

    state.cache = [];
    const cellW = p.width / cols;
    const cellH = p.height / rows;

    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        state.cache.push({
          x: x * cellW,
          y: y * cellH,
          offset: ctx.rng(),
        });
      }
    }

    ctx.data = state;
    p.pixelDensity(1);
    p.rectMode(p.CENTER);
    p.noiseSeed(ctx.seedHash);
  },
  update() {
    // No-op for now; animation handled in render.
  },
  render(p, ctx, t, _frame, params) {
    const state = ensureState(ctx.data as SquareDriftState | undefined);
    const cols = Number(params.gridCols ?? defaults.gridCols);
    const rows = Number(params.gridRows ?? defaults.gridRows);
    const speed = Number(params.speed ?? defaults.speed);
    const noiseScale = Number(params.noiseScale ?? defaults.noiseScale);
    const threshold = Number(params.threshold ?? defaults.threshold);
    const jitter = Number(params.jitter ?? defaults.jitter);

    if (!state.cache.length) {
      return;
    }

    const cellW = p.width / cols;
    const cellH = p.height / rows;
    const jitterScale = Math.min(cellW, cellH) * jitter * 0.5;
    const ink = ctx.colors.ink;

    p.noStroke();
    p.fill(ink);

    const time = t * speed;

    for (let i = 0; i < state.cache.length; i += 1) {
      const cell = state.cache[i];
      const cx = cell.x + cellW / 2;
      const cy = cell.y + cellH / 2;
      const noiseValue = p.noise(
        (cx + cell.offset * 10) * noiseScale,
        (cy - cell.offset * 10) * noiseScale,
        time * noiseScale,
      );

      if (noiseValue > threshold) {
        const jitterX = (ctx.rng() - 0.5) * 2 * jitterScale;
        const jitterY = (ctx.rng() - 0.5) * 2 * jitterScale;
        p.rect(cx + jitterX, cy + jitterY, cellW - 1, cellH - 1);
      }
    }
  },
};
