"use client";

import { getEffect } from "@/effects";
import { NumericField } from "@/components/NumericField";
import { PresetManager } from "@/components/PresetManager";
import { ColorControl, Vector2Control, CurveControl, RangeControl } from "@/components/CustomParamControls";
import { useEditorStore } from "@/store/useEditor";
import { useTimelineStore } from "@/store/useTimeline";
import { KeyframeButton } from "@/components/KeyframeButton";

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
  const timelineMode = useEditorStore((state) => state.timelineMode);
  const currentTime = useTimelineStore((state) => state.currentTime);
  const addKeyframe = useTimelineStore((state) => state.addKeyframe);
  const hasKeyframes = useTimelineStore((state) => state.hasKeyframes);
  const getAnimatedValue = useTimelineStore((state) => state.getAnimatedValue);
  const timelines = useTimelineStore((state) => state.timelines);

  const getKeyframeCount = (paramKey: string) => {
    const timeline = timelines[paramKey];
    return timeline ? timeline.keyframes.length : 0;
  };

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
          const baseValue = params[key];
          const current = timelineMode && hasKeyframes(key)
            ? getAnimatedValue(key, currentTime, baseValue)
            : baseValue;

          switch (param.type) {
            case "number":
            case "int":
              const paramHasKeyframes = hasKeyframes(key);
              const handleAddKeyframe = () => {
                // Use the displayed value (which could be animated or base value)
                const value = Number(current ?? effect.defaults[key] ?? 0);
                addKeyframe(key, currentTime, value);
              };

              const isAnimated = paramHasKeyframes;
              const handleChange = (next: number) => {
                const value = param.type === "int" ? Math.round(next) : Number(next.toFixed(6));
                if (timelineMode && isAnimated) {
                  // Update or add keyframe at current time
                  addKeyframe(key, currentTime, value);
                } else {
                  // Normal parameter update
                  setParam(key, value);
                }
              };
              
              return (
                <div key={key} className="flex items-end gap-2">
                  <div className="flex-1">
                    <NumericField
                      label={param.label}
                      value={Number(current ?? effect.defaults[key] ?? 0)}
                      min={param.min}
                      max={param.max}
                      step={param.step}
                      integer={param.type === "int"}
                      disabled={false}
                      onChange={handleChange}
                    />
                    {timelineMode && isAnimated && (
                      <div className="text-xs text-blue-600 mt-1">
                        Editing keyframe at {(currentTime * 100).toFixed(0)}%
                      </div>
                    )}
                  </div>
                  <KeyframeButton 
                    paramKey={key}
                    value={current}
                    className="ml-2"
                  />
                </div>
              );
            case "boolean":
              return (
                <div key={key} className="flex items-center gap-2">
                  <ParamRow label={param.label}>
                    <BooleanControl
                      value={Boolean(current)}
                      onToggle={() => setParam(key, !Boolean(current))}
                    />
                  </ParamRow>
                  <KeyframeButton 
                    paramKey={key}
                    value={current}
                    className="mt-4"
                  />
                </div>
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
