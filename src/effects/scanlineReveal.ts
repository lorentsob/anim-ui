import type p5 from "p5";
import type { Effect } from "./types";

type ScanlineState = {
  prepared: boolean;
};

const defaults = {
  bandWidth: 160,
  angle: 35,
  speed: 0.45,
  repeat: 3,
  noise: 0.25,
  mirror: true,
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export const scanlineReveal: Effect = {
  id: "scanline-reveal",
  name: "Scanline Reveal",
  params: [
    {
      key: "bandWidth",
      type: "number",
      label: "Band Width",
      min: 8,
      max: 512,
      step: 1,
    },
    {
      key: "angle",
      type: "number",
      label: "Angle",
      min: 0,
      max: 180,
      step: 1,
    },
    {
      key: "speed",
      type: "number",
      label: "Speed",
      min: 0.05,
      max: 2,
      step: 0.01,
    },
    {
      key: "repeat",
      type: "int",
      label: "Repeats",
      min: 1,
      max: 12,
      step: 1,
    },
    {
      key: "noise",
      type: "number",
      label: "Noise",
      min: 0,
      max: 1,
      step: 0.01,
    },
    {
      key: "mirror",
      type: "boolean",
      label: "Mirror",
    },
  ],
  defaults,
  init(p, _ctx, _params) {
    const state: ScanlineState = { prepared: true };
    p.rectMode(p.CENTER);
    p.strokeWeight(1);
    p.noSmooth();
    _ctx.data = state;
  },
  update() {
    // Animation handled in render.
  },
  render(p, ctx, t, _frame, params) {
    const colors = ctx.colors;
    const width = p.width;
    const height = p.height;
    const diag = Math.sqrt(width * width + height * height);
    const stripeSpacing = 6;

    const bandWidth = clamp(Number(params.bandWidth ?? defaults.bandWidth), 8, 512);
    const angleDeg = Number(params.angle ?? defaults.angle);
    const speed = Number(params.speed ?? defaults.speed);
    const repeat = clamp(Math.round(Number(params.repeat ?? defaults.repeat)), 1, 12);
    const noise = clamp(Number(params.noise ?? defaults.noise), 0, 1);
    const mirror = Boolean(params.mirror ?? defaults.mirror);

    const spacing = diag / repeat;
    const travel = ((t * speed) % 1) * spacing;
    const angleRad = (angleDeg * Math.PI) / 180;

    p.push();
    p.translate(width / 2, height / 2);
    p.rotate(angleRad);

    // Background scanlines
    p.stroke(colors.ink);
    p.noFill();
    for (let y = -diag; y <= diag; y += stripeSpacing) {
      p.line(-diag, y, diag, y);
    }

    // Animated band(s)
    p.noStroke();
    p.fill(colors.paper);
    const bandHeight = diag * 1.6;

    for (let k = -repeat - 2; k <= repeat + 2; k += 1) {
      const base = k * spacing + travel - spacing / 2;
      const jitter = (ctx.rng() - 0.5) * noise * bandWidth;
      const widthAdjusted = clamp(bandWidth + jitter, 4, diag);
      p.rect(base, 0, widthAdjusted, bandHeight);
      if (mirror) {
        p.rect(-base, 0, widthAdjusted, bandHeight);
      }
    }

    // Outline edges of the animated band to bring back the ink color.
    p.noFill();
    p.stroke(colors.ink);
    const outlineBandWidth = bandWidth * 0.6;
    for (let k = -repeat - 2; k <= repeat + 2; k += 1) {
      const base = k * spacing + travel - spacing / 2;
      const jitter = (ctx.rng() - 0.5) * noise * outlineBandWidth;
      const w = clamp(outlineBandWidth + jitter, 4, diag);
      p.rect(base, 0, w, bandHeight * 1.02);
      if (mirror) {
        p.rect(-base, 0, w, bandHeight * 1.02);
      }
    }

    p.pop();
  },
};
