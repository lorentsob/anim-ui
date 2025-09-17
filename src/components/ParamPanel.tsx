"use client";

import { getEffect } from "@/effects";
import { NumericField } from "@/components/NumericField";
import { PresetManager } from "@/components/PresetManager";
import { ColorControl, Vector2Control, CurveControl, RangeControl } from "@/components/CustomParamControls";
import { useEditorStore } from "@/store/useEditor";

function ParamRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] uppercase tracking-[0.2em] opacity-80">{label}</span>
      {children}
    </div>
  );
}

function BooleanControl({ value, onToggle }: { value: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`border border-ink px-3 py-1 ${value ? "bg-ink text-paper" : "bg-paper"}`}
    >
      {value ? "On" : "Off"}
    </button>
  );
}

export function ParamPanel() {
  const effectId = useEditorStore((state) => state.effectId);
  const params = useEditorStore((state) => state.params);
  const setParam = useEditorStore((state) => state.setParam);

  const effect = getEffect(effectId);

  return (
    <aside className="flex w-full max-w-[320px] flex-col border border-ink bg-paper text-xs uppercase tracking-[0.12em] h-full overflow-hidden">
      <div className="border-b border-ink p-4 flex-shrink-0">
        <h2 className="text-sm font-semibold normal-case">
          {effect.name}
        </h2>
      </div>
      <div className="flex flex-col gap-3 normal-case p-4 overflow-y-auto flex-1">
        {effect.params.length === 0 && (
          <p className="text-xs uppercase tracking-[0.2em] text-ink opacity-60">
            No parameters for this effect.
          </p>
        )}
        {effect.params.map((param) => {
          const key = param.key;
          const current = params[key];

          switch (param.type) {
            case "number":
            case "int":
              return (
                <div key={key}>
                  <NumericField
                    label={param.label}
                    value={Number(current ?? effect.defaults[key] ?? 0)}
                    min={param.min}
                    max={param.max}
                    step={param.step}
                    integer={param.type === "int"}
                    disabled={false}
                    onChange={(next) => {
                      const value = param.type === "int" ? Math.round(next) : Number(next.toFixed(6));
                      setParam(key, value);
                    }}
                  />
                </div>
              );
            case "boolean":
              return (
                <ParamRow key={key} label={param.label}>
                  <BooleanControl
                    value={Boolean(current)}
                    onToggle={() => setParam(key, !Boolean(current))}
                  />
                </ParamRow>
              );
            case "select":
              return (
                <ParamRow key={key} label={param.label}>
                  <select
                    value={String(current)}
                    onChange={(event) => setParam(key, event.target.value)}
                    className="border border-ink bg-paper px-3 py-1 capitalize"
                  >
                    {param.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </ParamRow>
              );
            case "text":
            case "seed":
              return (
                <ParamRow key={key} label={param.label}>
                  <input
                    value={String(current ?? "")}
                    onChange={(event) => setParam(key, event.target.value)}
                    className="border border-ink bg-paper px-3 py-1"
                  />
                </ParamRow>
              );
            case "color":
              return (
                <div key={key}>
                  <ColorControl
                    value={String(current ?? "#000000")}
                    onChange={(value) => setParam(key, value)}
                    monochrome={param.monochrome}
                    label={param.label}
                  />
                </div>
              );
            case "vector2":
              const vec2Value = typeof current === 'object' && current !== null
                ? current as { x: number; y: number }
                : { x: 0, y: 0 };
              return (
                <div key={key}>
                  <Vector2Control
                    value={vec2Value}
                    onChange={(value) => setParam(key, value)}
                    min={param.min}
                    max={param.max}
                    label={param.label}
                  />
                </div>
              );
            case "curve":
              const curveValue = Array.isArray(current)
                ? current as { x: number; y: number }[]
                : param.points || [{ x: 0, y: 0 }, { x: 1, y: 1 }];
              return (
                <div key={key}>
                  <CurveControl
                    value={curveValue}
                    onChange={(value) => setParam(key, value)}
                    label={param.label}
                  />
                </div>
              );
            case "range":
              const rangeValue = typeof current === 'object' && current !== null
                ? current as { min: number; max: number }
                : { min: param.min, max: param.max };
              return (
                <div key={key}>
                  <RangeControl
                    value={rangeValue}
                    onChange={(value) => setParam(key, value)}
                    min={param.min}
                    max={param.max}
                    step={param.step}
                    label={param.label}
                  />
                </div>
              );
            default:
              return null;
          }
        })}
        <PresetManager />
      </div>
    </aside>
  );
}
