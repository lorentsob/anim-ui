import type p5 from "p5";
import type { Effect } from "./types";

const defaults = {
  text: "TYPE",
  fontSize: 120,
  letterSpacing: 1.2,
  animSpeed: 1.0,
  distortAmount: 50,
  noiseScale: 0.02,
  mode: "wave" as const,
  kerning: 0,
  baseline: "center" as const,
};

type AnimationMode = "wave" | "scatter" | "typewriter" | "glitch" | "morph";
type BaselineMode = "center" | "top" | "bottom";

type TypographicState = {
  textChars: string[];
  textMetrics: Array<{ x: number; y: number; width: number; height: number }>;
  prepared: boolean;
  lastText: string;
  typewriterIndex: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const calculateTextLayout = (
  p: p5,
  text: string,
  fontSize: number,
  letterSpacing: number,
  kerning: number
) => {
  p.textSize(fontSize);
  const chars = text.split("");
  const metrics: Array<{ x: number; y: number; width: number; height: number }> = [];

  let totalWidth = 0;
  for (const char of chars) {
    const charWidth = p.textWidth(char);
    totalWidth += charWidth * letterSpacing + kerning;
  }
  totalWidth -= kerning; // Remove last kerning

  const startX = (p.width - totalWidth) / 2;
  let currentX = startX;

  chars.forEach((char) => {
    const charWidth = p.textWidth(char);
    const charHeight = fontSize; // Approximate

    metrics.push({
      x: currentX,
      y: p.height / 2,
      width: charWidth,
      height: charHeight
    });

    currentX += charWidth * letterSpacing + kerning;
  });

  return metrics;
};

export const typographic: Effect = {
  id: "typographic",
  name: "Typographic",
  params: [
    { key: "text", type: "text", label: "Text" },
    { key: "fontSize", type: "int", label: "Font Size", min: 20, max: 300, step: 5 },
    { key: "letterSpacing", type: "number", label: "Letter Spacing", min: 0.5, max: 3, step: 0.1 },
    { key: "kerning", type: "number", label: "Kerning", min: -20, max: 50, step: 1 },
    { key: "animSpeed", type: "number", label: "Animation Speed", min: 0.1, max: 4, step: 0.1 },
    { key: "distortAmount", type: "number", label: "Distortion", min: 0, max: 200, step: 5 },
    { key: "noiseScale", type: "number", label: "Noise Scale", min: 0.005, max: 0.1, step: 0.005 },
    {
      key: "mode",
      type: "select",
      label: "Animation Mode",
      options: ["wave", "scatter", "typewriter", "glitch", "morph"],
    },
    {
      key: "baseline",
      type: "select",
      label: "Baseline",
      options: ["center", "top", "bottom"],
    },
  ],
  defaults,
  init(p, ctx, params) {
    const text = String(params.text ?? defaults.text);
    const fontSize = clamp(Number(params.fontSize ?? defaults.fontSize), 20, 300);
    const letterSpacing = clamp(Number(params.letterSpacing ?? defaults.letterSpacing), 0.5, 3);
    const kerning = clamp(Number(params.kerning ?? defaults.kerning), -20, 50);

    const state: TypographicState = {
      textChars: text.split(""),
      textMetrics: [],
      prepared: false,
      lastText: text,
      typewriterIndex: 0,
    };

    p.pixelDensity(1);
    p.noStroke();
    p.textAlign(p.LEFT, p.CENTER);
    p.textFont("monospace");
    p.noiseSeed(ctx.seedHash);

    // Calculate initial layout
    state.textMetrics = calculateTextLayout(p, text, fontSize, letterSpacing, kerning);
    state.prepared = true;

    ctx.data = state;
  },
  update() {
    // No-op; all work done in render.
  },
  render(p, ctx, t, _frame, params) {
    const state = ctx.data as TypographicState | undefined;
    if (!state || !state.prepared) return;

    const text = String(params.text ?? defaults.text);
    const fontSize = clamp(Number(params.fontSize ?? defaults.fontSize), 20, 300);
    const letterSpacing = clamp(Number(params.letterSpacing ?? defaults.letterSpacing), 0.5, 3);
    const kerning = clamp(Number(params.kerning ?? defaults.kerning), -20, 50);
    const animSpeed = clamp(Number(params.animSpeed ?? defaults.animSpeed), 0.1, 4);
    const distortAmount = clamp(Number(params.distortAmount ?? defaults.distortAmount), 0, 200);
    const noiseScale = clamp(Number(params.noiseScale ?? defaults.noiseScale), 0.005, 0.1);
    const mode = (params.mode ?? defaults.mode) as AnimationMode;
    const baseline = (params.baseline ?? defaults.baseline) as BaselineMode;

    // Recalculate layout if text changed
    if (state.lastText !== text) {
      state.textChars = text.split("");
      state.textMetrics = calculateTextLayout(p, text, fontSize, letterSpacing, kerning);
      state.lastText = text;
      state.typewriterIndex = 0;
    }

    p.background(ctx.colors.paper);
    p.fill(ctx.colors.ink);
    p.textSize(fontSize);

    // Set baseline alignment
    const baselineAlign = baseline === "top" ? p.TOP : baseline === "bottom" ? p.BOTTOM : p.CENTER;
    p.textAlign(p.LEFT, baselineAlign);

    // Adjust Y position based on baseline
    let baseY = p.height / 2;
    if (baseline === "top") {
      baseY = fontSize / 2 + 20;
    } else if (baseline === "bottom") {
      baseY = p.height - fontSize / 2 - 20;
    }

    const time = t * animSpeed;

    state.textChars.forEach((char, i) => {
      if (!state.textMetrics[i]) return;

      const metric = state.textMetrics[i];
      let x = metric.x;
      let y = baseY;
      let alpha = 255;

      switch (mode) {
        case "wave": {
          const waveOffset = Math.sin(time * 2 + i * 0.5) * distortAmount;
          const verticalWave = Math.cos(time * 1.5 + i * 0.3) * (distortAmount * 0.3);
          x += waveOffset;
          y += verticalWave;
          break;
        }

        case "scatter": {
          const noiseX = p.noise(i * noiseScale, time * 0.5) - 0.5;
          const noiseY = p.noise(i * noiseScale + 100, time * 0.5) - 0.5;
          x += noiseX * distortAmount * 2;
          y += noiseY * distortAmount * 2;
          break;
        }

        case "typewriter": {
          const typewriterProgress = (time * 5) % (state.textChars.length + 2);
          if (i > typewriterProgress) {
            alpha = 0;
          } else if (i === Math.floor(typewriterProgress)) {
            // Flickering cursor effect
            alpha = Math.sin(time * 20) > 0 ? 255 : 100;
          }
          break;
        }

        case "glitch": {
          if (ctx.rng() < 0.1) {
            x += (ctx.rng() - 0.5) * distortAmount * 2;
            y += (ctx.rng() - 0.5) * distortAmount;
          }
          // Random character replacement
          if (ctx.rng() < 0.05) {
            const glitchChars = "█▉▊▋▌▍▎▏▐░▒▓";
            char = glitchChars[Math.floor(ctx.rng() * glitchChars.length)];
          }
          break;
        }

        case "morph": {
          const morphPhase = (time + i * 0.2) % 4;
          const morphAmount = Math.sin(morphPhase * Math.PI) * distortAmount;

          // Create morphing effect by scaling and rotating
          p.push();
          p.translate(x + metric.width / 2, y);
          p.scale(1 + Math.sin(morphPhase) * 0.3, 1 + Math.cos(morphPhase) * 0.3);
          p.rotate(Math.sin(time + i * 0.5) * 0.2);
          p.translate(-metric.width / 2, 0);

          p.fill(ctx.colors.ink, alpha);
          p.text(char, 0, 0);
          p.pop();
          break;
        }
      }

      // Normal rendering for all modes except morph
      if (mode !== "morph") {
        p.fill(ctx.colors.ink, alpha);
        p.text(char, x, y);
      }
    });
  },
};