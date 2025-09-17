import type p5 from "p5";

export type ParamDef =
  | {
      key: string;
      type: "number" | "int";
      label: string;
      min: number;
      max: number;
      step?: number;
    }
  | { key: string; type: "boolean"; label: string }
  | { key: string; type: "select"; label: string; options: string[] }
  | { key: string; type: "text"; label: string }
  | { key: string; type: "seed"; label: string }
  | {
      key: string;
      type: "color";
      label: string;
      monochrome?: boolean;
    }
  | {
      key: string;
      type: "vector2";
      label: string;
      min?: number;
      max?: number;
    }
  | {
      key: string;
      type: "curve";
      label: string;
      points: { x: number; y: number }[];
    }
  | {
      key: string;
      type: "range";
      label: string;
      min: number;
      max: number;
      step?: number;
    };

export type BlendMode = "normal" | "multiply" | "add" | "subtract" | "xor" | "overlay";

export interface EffectLayer {
  id: string;
  effectId: string;
  opacity: number;
  blendMode: BlendMode;
  enabled: boolean;
  params: ParamValues;
}

export type ParamValue =
  | number
  | string
  | boolean
  | { x: number; y: number }
  | { min: number; max: number }
  | { x: number; y: number }[];
export type ParamValues = Record<string, ParamValue>;

export interface EffectContext {
  rng: () => number;
  data: Record<string, unknown>;
  seedHash: number;
  colors: {
    paper: number;
    ink: number;
  };
}

export interface Effect {
  id: string;
  name: string;
  params: ParamDef[];
  defaults: ParamValues;
  init(p: p5, ctx: EffectContext, params: ParamValues): void;
  update(p: p5, ctx: EffectContext, t: number, frame: number, params: ParamValues): void;
  render(p: p5, ctx: EffectContext, t: number, frame: number, params: ParamValues): void;
}

export interface BlendContext {
  sourceGraphics: p5.Graphics;
  targetGraphics: p5.Graphics;
  resultGraphics: p5.Graphics;
  blendMode: BlendMode;
  opacity: number;
}
