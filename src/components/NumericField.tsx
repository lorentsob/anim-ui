"use client";

import { useEffect, useRef } from "react";
import clsx from "clsx";

export type NumericFieldProps = {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  integer?: boolean;
  disabled?: boolean;
  onChange: (value: number) => void;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
};

const clampValue = (value: number, min?: number, max?: number) => {
  let next = value;
  if (typeof min === "number") {
    next = Math.max(min, next);
  }
  if (typeof max === "number") {
    next = Math.min(max, next);
  }
  return next;
};

export function NumericField({
  label,
  value,
  min,
  max,
  step,
  integer,
  disabled = false,
  onChange,
  className,
  labelClassName,
  inputClassName,
}: NumericFieldProps) {
  const valueRef = useRef(value);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (disabled) return;
    event.preventDefault();
    const pointerId = event.pointerId;
    const startX = event.clientX;
    const startValue = valueRef.current;
    const target = event.currentTarget;
    const originalUserSelect = document.body.style.userSelect;
    const effectiveStep = step ?? 1;

    document.body.style.userSelect = "none";
    target.setPointerCapture(pointerId);
    target.classList.add("bg-ink", "text-paper");

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const modifier = moveEvent.shiftKey ? 0.2 : 1;
      let next = startValue + deltaX * effectiveStep * modifier;
      if (integer) {
        next = Math.round(next);
      }
      next = clampValue(next, min, max);
      if (next !== valueRef.current) {
        onChange(next);
      }
    };

    const handlePointerUp = () => {
      target.releasePointerCapture(pointerId);
      target.removeEventListener("pointermove", handlePointerMove);
      target.removeEventListener("pointerup", handlePointerUp);
      target.removeEventListener("pointercancel", handlePointerUp);
      document.body.style.userSelect = originalUserSelect;
      target.classList.remove("bg-ink", "text-paper");
    };

    target.addEventListener("pointermove", handlePointerMove);
    target.addEventListener("pointerup", handlePointerUp);
    target.addEventListener("pointercancel", handlePointerUp);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const numeric = event.target.valueAsNumber;
    if (Number.isFinite(numeric)) {
      let next = numeric;
      if (integer) {
        next = Math.round(next);
      }
      onChange(clampValue(next, min, max));
    }
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    if (!Number.isFinite(event.target.valueAsNumber)) {
      event.target.value = String(valueRef.current);
      return;
    }
    let next = event.target.valueAsNumber;
    if (integer) {
      next = Math.round(next);
    }
    next = clampValue(next, min, max);
    if (next !== valueRef.current) {
      onChange(next);
    }
  };

  return (
    <div
      className={clsx(
        "flex items-center justify-between border border-ink bg-paper px-3 py-2 uppercase",
        className,
      )}
    >
      <button
        type="button"
        onPointerDown={handlePointerDown}
        className={clsx(
          "cursor-ew-resize bg-transparent text-[11px] font-semibold tracking-[0.18em] transition-colors",
          disabled && "opacity-50 cursor-not-allowed",
          labelClassName,
        )}
        disabled={disabled}
      >
        {label}
      </button>
      <input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        min={min}
        max={max}
        step={step ?? (integer ? 1 : undefined)}
        disabled={disabled}
        onChange={handleInputChange}
        onBlur={handleBlur}
        className={clsx(
          "w-[96px] border border-ink bg-paper px-3 py-1 text-right font-mono text-xs tracking-normal",
          disabled && "opacity-50 cursor-not-allowed bg-gray-100",
          inputClassName,
        )}
      />
    </div>
  );
}
