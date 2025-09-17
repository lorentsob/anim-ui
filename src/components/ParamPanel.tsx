"use client";

import { getEffect } from "@/effects";
import { NumericField } from "@/components/NumericField";
import { PresetManager } from "@/components/PresetManager";
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
    <aside className="flex w-full max-w-[320px] flex-col border border-ink bg-paper p-4 text-xs uppercase tracking-[0.12em] lg:h-full">
      <h2 className="mb-3 border-b border-line pb-2 text-sm font-semibold normal-case">
        {effect.name}
      </h2>
      <div className="flex flex-col gap-3 normal-case">
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
                <NumericField
                  key={key}
                  label={param.label}
                  value={Number(current ?? effect.defaults[key] ?? 0)}
                  min={param.min}
                  max={param.max}
                  step={param.step}
                  integer={param.type === "int"}
                  onChange={(next) =>
                    setParam(key, param.type === "int" ? Math.round(next) : Number(next.toFixed(6)))
                  }
                />
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
            default:
              return null;
          }
        })}
      </div>
      <PresetManager />
    </aside>
  );
}
