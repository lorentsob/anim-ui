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
  | { key: string; type: "seed"; label: string };

export type ParamValue = number | string | boolean;
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
