import type p5 from "p5";

import type { Effect } from "@/effects/types";

type OrbitingBarsState = {
  offsets: number[];
};

const defaults = {
  count: 8,
  radius: 180,
  thickness: 24,
  speed: 0.4,
  wobble: 0.2,
  barLength: 240,
};

const ensureState = (state?: OrbitingBarsState): OrbitingBarsState => {
  if (state && Array.isArray(state.offsets)) {
    return state;
  }
  return { offsets: [] };
};

export const orbitingBars: Effect = {
  id: "orbiting-bars",
  name: "Orbiting Bars",
  params: [
    { key: "count", type: "int", label: "Bars", min: 2, max: 24, step: 1 },
    { key: "radius", type: "number", label: "Radius", min: 40, max: 320, step: 5 },
    { key: "barLength", type: "number", label: "Length", min: 40, max: 400, step: 5 },
    { key: "thickness", type: "number", label: "Thickness", min: 4, max: 80, step: 2 },
    { key: "speed", type: "number", label: "Speed", min: -2, max: 2, step: 0.05 },
    { key: "wobble", type: "number", label: "Wobble", min: 0, max: 1, step: 0.05 },
  ],
  defaults,
  init(p, ctx, params) {
    const state = ensureState(ctx.data as OrbitingBarsState | undefined);
    const count = Math.max(2, Math.round(Number(params.count ?? defaults.count)));

    // Precompute deterministic phase offsets per bar.
    state.offsets = Array.from({ length: count }, () => ctx.rng());
    ctx.data = state;

    p.noSmooth();
    p.pixelDensity(1);
  },
  update() {
    // No intermediate state updates required; everything driven in render.
  },
  render(p, ctx, t, _frame, params) {
    const state = ensureState(ctx.data as OrbitingBarsState | undefined);
    const count = Math.max(2, Math.round(Number(params.count ?? defaults.count)));

    if (state.offsets.length !== count) {
      // Rebuild offsets if count changed outside of init.
      state.offsets = Array.from({ length: count }, () => ctx.rng());
    }

    const radius = Number(params.radius ?? defaults.radius);
    const barLength = Number(params.barLength ?? defaults.barLength);
    const thickness = Number(params.thickness ?? defaults.thickness);
    const speed = Number(params.speed ?? defaults.speed);
    const wobble = Number(params.wobble ?? defaults.wobble);

    const ink = ctx.colors.ink;
    const paper = ctx.colors.paper;

    p.background(paper);
    p.push();
    p.translate(p.width / 2, p.height / 2);
    p.stroke(ink);
    p.fill(ink);
    p.rectMode(p.CENTER);

    for (let i = 0; i < count; i += 1) {
      const baseAngle = (i / count) * Math.PI * 2;
      const phase = state.offsets[i] * Math.PI * 2;
      const angle = baseAngle + phase + t * speed * Math.PI * 2;
      const wobbleOffset = Math.sin(t * speed * 2 + phase) * wobble * radius;
      const currentRadius = radius + wobbleOffset;

      const x = Math.cos(angle) * currentRadius;
      const y = Math.sin(angle) * currentRadius;

      p.push();
      p.translate(x, y);
      p.rotate(angle);
      p.rect(0, 0, barLength, thickness);
      p.pop();
    }

    p.pop();
  },
};
