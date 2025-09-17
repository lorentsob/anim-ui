import type p5 from "p5";
import type { Effect } from "./types";

const defaults = {
  cell: 14,
  charset: "@#=+;:.- ",
  contrast: 1,
  gamma: 1,
  jitter: 0.25,
  scrollSpeed: 0.6,
  mode: "noise" as const,
};

type Mode = "noise" | "checker" | "stripe";

type AsciiState = {
  chars: string[];
  cell: number;
  prepared: boolean;
};

const normalizeCharset = (charset: string) => {
  const trimmed = charset.replace(/\s+/g, " ").trim();
  const unique = Array.from(new Set(trimmed.split("")));
  return unique.length > 0 ? unique : defaults.charset.split("");
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export const asciiDither: Effect = {
  id: "ascii-dither",
  name: "ASCII Dither",
  params: [
    { key: "cell", type: "int", label: "Cell Size", min: 6, max: 32, step: 1 },
    { key: "charset", type: "text", label: "Charset" },
    { key: "contrast", type: "number", label: "Contrast", min: 0.4, max: 2.5, step: 0.05 },
    { key: "gamma", type: "number", label: "Gamma", min: 0.5, max: 2, step: 0.05 },
    { key: "jitter", type: "number", label: "Jitter", min: 0, max: 1, step: 0.05 },
    {
      key: "scrollSpeed",
      type: "number",
      label: "Scroll Speed",
      min: -4,
      max: 4,
      step: 0.1,
    },
    {
      key: "mode",
      type: "select",
      label: "Mode",
      options: ["noise", "checker", "stripe"],
    },
  ],
  defaults,
  init(p, ctx, params) {
    const cell = clamp(Number(params.cell ?? defaults.cell), 6, 32);
    const charset = normalizeCharset(String(params.charset ?? defaults.charset));
    const state: AsciiState = {
      chars: charset,
      cell,
      prepared: true,
    };
    p.pixelDensity(1);
    p.noStroke();
    p.textFont("monospace");
    p.textAlign(p.CENTER, p.CENTER);
    p.noSmooth();
    p.noiseSeed(ctx.seedHash);
    ctx.data = state;
  },
  update() {
    // No-op; all work done in render.
  },
  render(p, ctx, t, _frame, params) {
    const state = ctx.data as AsciiState | undefined;
    if (!state || !state.prepared) return;

    const width = p.width;
    const height = p.height;
    const cell = clamp(Number(params.cell ?? defaults.cell), 6, 32);
    const cols = Math.max(1, Math.floor(width / cell));
    const rows = Math.max(1, Math.floor(height / cell));

    if (state.cell !== cell) {
      state.cell = cell;
    }

    const charset = normalizeCharset(String(params.charset ?? defaults.charset));
    state.chars = charset;

    const contrast = clamp(Number(params.contrast ?? defaults.contrast), 0.4, 2.5);
    const gamma = clamp(Number(params.gamma ?? defaults.gamma), 0.5, 2);
    const jitter = clamp(Number(params.jitter ?? defaults.jitter), 0, 1);
    const scrollSpeed = Number(params.scrollSpeed ?? defaults.scrollSpeed);
    const mode = (params.mode ?? defaults.mode) as Mode;

    const offsetX = (width - cols * cell) / 2 + cell / 2;
    const offsetY = (height - rows * cell) / 2 + cell / 2;

    const noiseScale = 0.02;
    const jitterScale = (cell / 2) * jitter;

    p.background(ctx.colors.paper);
    p.fill(ctx.colors.ink);
    p.textSize(cell * 0.88);

    const len = charset.length - 1;
    const scroll = t * scrollSpeed * 0.5;

    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        let value = 0;
        if (mode === "noise") {
          value = p.noise(
            (x * cell + ctx.seedHash) * noiseScale,
            (y * cell + scroll) * noiseScale,
            scroll * 0.5,
          );
        } else if (mode === "checker") {
          value = ((x + y + Math.floor(scroll)) % 2 === 0 ? 1 : 0.2) + ctx.rng() * 0.1;
        } else {
          value = ((Math.sin((y + scroll * rows) * 0.4) + 1) / 2) * 0.8 + 0.1;
        }

        value = clamp(value, 0, 1);
        value = Math.pow(value, gamma);
        value = clamp(0.5 + (value - 0.5) * contrast, 0, 1);

        const index = Math.min(len, Math.max(0, Math.round(value * len)));
        const char = charset[index] ?? "";
        const jitterX = (ctx.rng() - 0.5) * 2 * jitterScale;
        const jitterY = (ctx.rng() - 0.5) * 2 * jitterScale;
        const posX = offsetX + x * cell + jitterX;
        const posY = offsetY + y * cell + jitterY;
        p.text(char, posX, posY);
      }
    }
  },
};
