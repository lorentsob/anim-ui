import type p5 from "p5";

import type { Effect } from "@/effects/types";

type RippleState = {
  phases: number[];
};

const defaults = {
  rings: 12,
  spacing: 40,
  speed: 0.5,
  quantize: 4,
  jitter: 0.15,
  thickness: 6,
};

const ensureState = (state?: RippleState): RippleState => {
  if (state && Array.isArray(state.phases)) return state;
  return { phases: [] };
};

export const rippleQuantized: Effect = {
  id: "ripple-quantized",
  name: "Ripple Quantized",
  params: [
    { key: "rings", type: "int", label: "Rings", min: 2, max: 32, step: 1 },
    { key: "spacing", type: "number", label: "Spacing", min: 20, max: 120, step: 2 },
    { key: "speed", type: "number", label: "Speed", min: 0, max: 2, step: 0.05 },
    { key: "quantize", type: "int", label: "Quantize", min: 1, max: 12, step: 1 },
    { key: "jitter", type: "number", label: "Jitter", min: 0, max: 1, step: 0.05 },
    { key: "thickness", type: "number", label: "Thickness", min: 2, max: 24, step: 1 },
  ],
  defaults,
  init(p, ctx, params) {
    const state = ensureState(ctx.data as RippleState | undefined);
    const rings = Math.max(2, Math.round(Number(params.rings ?? defaults.rings)));
    state.phases = Array.from({ length: rings }, () => ctx.rng());
    ctx.data = state;
    p.noSmooth();
    p.pixelDensity(1);
  },
  update() {},
  render(p, ctx, t, _frame, params) {
    const state = ensureState(ctx.data as RippleState | undefined);
    const rings = Math.max(2, Math.round(Number(params.rings ?? defaults.rings)));
    const spacing = Number(params.spacing ?? defaults.spacing);
    const speed = Number(params.speed ?? defaults.speed);
    const quantize = Math.max(1, Math.round(Number(params.quantize ?? defaults.quantize)));
    const jitter = Number(params.jitter ?? defaults.jitter);
    const thickness = Number(params.thickness ?? defaults.thickness);

    if (state.phases.length !== rings) {
      state.phases = Array.from({ length: rings }, () => ctx.rng());
    }

    const ink = ctx.colors.ink;
    const paper = ctx.colors.paper;
    const maxRadius = Math.min(p.width, p.height) / 2;

    p.background(paper);
    p.push();
    p.translate(p.width / 2, p.height / 2);
    p.stroke(ink);
    p.noFill();
    p.strokeWeight(thickness);

    for (let i = 0; i < rings; i += 1) {
      const basePhase = state.phases[i];
      const rawRadius = i * spacing + (Math.sin(t * speed * 2 * Math.PI + basePhase) * spacing) / 2;
      const quantStep = spacing / quantize;
      const quantized = Math.round(rawRadius / quantStep) * quantStep;
      const noisy = quantized + (ctx.rng() - 0.5) * jitter * spacing;
      const radius = Math.max(10, Math.min(maxRadius, noisy));
      p.ellipse(0, 0, radius * 2, radius * 2);
    }

    p.pop();
  },
};
