import type p5 from "p5";
import type { BlendMode, BlendContext } from "@/effects/types";

export function applyBlendMode(p: p5, context: BlendContext): void {
  const { sourceGraphics, targetGraphics, resultGraphics, blendMode, opacity } = context;

  resultGraphics.clear();
  resultGraphics.tint(255, opacity * 255);

  switch (blendMode) {
    case "normal":
      resultGraphics.image(targetGraphics, 0, 0);
      resultGraphics.image(sourceGraphics, 0, 0);
      break;

    case "multiply":
      resultGraphics.blendMode(p.MULTIPLY);
      resultGraphics.image(targetGraphics, 0, 0);
      resultGraphics.image(sourceGraphics, 0, 0);
      break;

    case "add":
      resultGraphics.blendMode(p.ADD);
      resultGraphics.image(targetGraphics, 0, 0);
      resultGraphics.image(sourceGraphics, 0, 0);
      break;

    case "subtract":
      resultGraphics.blendMode(p.DIFFERENCE);
      resultGraphics.image(targetGraphics, 0, 0);
      resultGraphics.image(sourceGraphics, 0, 0);
      break;

    case "xor":
      resultGraphics.blendMode(p.EXCLUSION);
      resultGraphics.image(targetGraphics, 0, 0);
      resultGraphics.image(sourceGraphics, 0, 0);
      break;

    case "overlay":
      resultGraphics.blendMode(p.OVERLAY);
      resultGraphics.image(targetGraphics, 0, 0);
      resultGraphics.image(sourceGraphics, 0, 0);
      break;
  }

  resultGraphics.blendMode(p.BLEND);
  resultGraphics.noTint();
}

export function createBlendGraphics(p: p5, width: number, height: number): {
  layer1: p5.Graphics;
  layer2: p5.Graphics;
  result: p5.Graphics;
} {
  return {
    layer1: p.createGraphics(width, height),
    layer2: p.createGraphics(width, height),
    result: p.createGraphics(width, height),
  };
}

export const BLEND_MODES: { value: BlendMode; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "multiply", label: "Multiply" },
  { value: "add", label: "Add" },
  { value: "subtract", label: "Subtract" },
  { value: "xor", label: "XOR" },
  { value: "overlay", label: "Overlay" },
];