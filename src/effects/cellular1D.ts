import type p5 from "p5";
import type { Effect } from "./types";

const defaults = {
  rule: 30,
  density: 0.45,
  wrap: true,
  stepsPerFrame: 2,
  lineHeight: 2,
};

type CellularState = {
  cells: Uint8Array;
  next: Uint8Array;
  currentRow: number;
  lineHeight: number;
  image: p5.Graphics;
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export const cellular1D: Effect = {
  id: "cellular-1d",
  name: "Cellular Automata",
  params: [
    { key: "rule", type: "int", label: "Rule", min: 0, max: 255, step: 1 },
    { key: "density", type: "number", label: "Density", min: 0, max: 1, step: 0.01 },
    { key: "wrap", type: "boolean", label: "Wrap" },
    { key: "stepsPerFrame", type: "int", label: "Steps/Frame", min: 1, max: 8, step: 1 },
    { key: "lineHeight", type: "int", label: "Line Height", min: 1, max: 4, step: 1 },
  ],
  defaults,
  init(p, ctx, params) {
    const lineHeight = clamp(Math.round(Number(params.lineHeight ?? defaults.lineHeight)), 1, 4);
    const width = p.width;
    const height = p.height;

    const previous = ctx.data as CellularState | undefined;
    if (previous?.image) {
      previous.image.remove();
    }

    const image = p.createGraphics(width, height);
    image.pixelDensity(1);
    image.noSmooth();
    image.background(ctx.colors.paper);
    image.noStroke();

    const cols = width;
    const cells = new Uint8Array(cols);
    const next = new Uint8Array(cols);
    for (let x = 0; x < cols; x += 1) {
      cells[x] = ctx.rng() < Number(params.density ?? defaults.density) ? 1 : 0;
    }

    const state: CellularState = {
      cells,
      next,
      currentRow: 0,
      lineHeight,
      image,
    };

    ctx.data = state;
  },
  update() {},
  render(p, ctx, _t, _frame, params) {
    const state = ctx.data as CellularState | undefined;
    if (!state) return;

    const width = p.width;
    const height = p.height;
    const cols = width;

    if (state.cells.length !== cols) {
      // Canvas size changed; re-init via init.
      return;
    }

    const wrap = Boolean(params.wrap ?? defaults.wrap);
    const stepsPerFrame = clamp(
      Math.round(Number(params.stepsPerFrame ?? defaults.stepsPerFrame)),
      1,
      8,
    );
    const lineHeight = clamp(Math.round(Number(params.lineHeight ?? defaults.lineHeight)), 1, 4);
    if (state.lineHeight !== lineHeight) {
      state.lineHeight = lineHeight;
    }

    const rule = clamp(Math.round(Number(params.rule ?? defaults.rule)), 0, 255);
    const density = clamp(Number(params.density ?? defaults.density), 0, 1);

    const totalRows = Math.max(1, Math.floor(height / state.lineHeight));

    const image = state.image;
    image.fill(ctx.colors.ink);

    const ensureRow = () => {
      if (state.currentRow * state.lineHeight >= height) {
        state.currentRow = 0;
        image.background(ctx.colors.paper);
      }
    };

    for (let step = 0; step < stepsPerFrame; step += 1) {
      ensureRow();
      const y = state.currentRow * state.lineHeight;

      for (let x = 0; x < cols; x += 1) {
        if (state.cells[x]) {
          image.rect(x, y, 1, state.lineHeight);
        }
      }

      // compute next row
      for (let x = 0; x < cols; x += 1) {
        const leftIndex = x === 0 ? (wrap ? cols - 1 : -1) : x - 1;
        const rightIndex = x === cols - 1 ? (wrap ? 0 : -1) : x + 1;
        const left = leftIndex === -1 ? 0 : state.cells[leftIndex];
        const center = state.cells[x];
        const right = rightIndex === -1 ? 0 : state.cells[rightIndex];
        const pattern = (left << 2) | (center << 1) | right;
        state.next[x] = (rule >> pattern) & 1;
      }

      // if density very low, re-inject random cells occasionally for interest
      if (density > 0 && step === stepsPerFrame - 1) {
        for (let x = 0; x < cols; x += 1) {
          if (state.next[x] === 0 && ctx.rng() < density * 0.005) {
            state.next[x] = 1;
          }
        }
      }

      const temp = state.cells;
      state.cells = state.next;
      state.next = temp;
      state.currentRow = (state.currentRow + 1) % totalRows;
    }

    p.background(ctx.colors.paper);
    p.image(image, 0, 0);
  },
};
