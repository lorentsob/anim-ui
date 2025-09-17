"use client";

import { useState } from "react";

interface ColorControlProps {
  value: string;
  onChange: (value: string) => void;
  monochrome?: boolean;
  label: string;
}

export function ColorControl({ value, onChange, monochrome = false, label }: ColorControlProps) {
  const handleColorChange = (color: string) => {
    if (monochrome) {
      // Convert to grayscale value (0-255)
      const gray = Math.round(parseInt(color.substring(1), 16) / 16777215 * 255);
      onChange(gray.toString());
    } else {
      onChange(color);
    }
  };

  const displayValue = monochrome
    ? `#${Math.round((parseInt(value) || 0) / 255 * 16777215).toString(16).padStart(6, '0')}`
    : value || "#000000";

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] uppercase tracking-[0.2em] opacity-80">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={displayValue}
          onChange={(e) => handleColorChange(e.target.value)}
          className="w-8 h-8 border border-ink cursor-pointer"
        />
        <input
          type="text"
          value={monochrome ? value || "0" : displayValue}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 border border-ink bg-paper px-3 py-1 text-xs font-mono"
          placeholder={monochrome ? "0-255" : "#000000"}
        />
      </div>
    </div>
  );
}

interface Vector2ControlProps {
  value: { x: number; y: number };
  onChange: (value: { x: number; y: number }) => void;
  min?: number;
  max?: number;
  label: string;
}

export function Vector2Control({ value, onChange, min = -100, max = 100, label }: Vector2ControlProps) {
  const handleXChange = (x: number) => {
    onChange({ ...value, x: Math.max(min, Math.min(max, x)) });
  };

  const handleYChange = (y: number) => {
    onChange({ ...value, y: Math.max(min, Math.min(max, y)) });
  };

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] uppercase tracking-[0.2em] opacity-80">{label}</span>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] opacity-60">X</span>
          <input
            type="number"
            value={value.x || 0}
            min={min}
            max={max}
            step={0.1}
            onChange={(e) => handleXChange(parseFloat(e.target.value) || 0)}
            className="border border-ink bg-paper px-2 py-1 text-xs"
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] opacity-60">Y</span>
          <input
            type="number"
            value={value.y || 0}
            min={min}
            max={max}
            step={0.1}
            onChange={(e) => handleYChange(parseFloat(e.target.value) || 0)}
            className="border border-ink bg-paper px-2 py-1 text-xs"
          />
        </div>
      </div>
    </div>
  );
}

interface CurveControlProps {
  value: { x: number; y: number }[];
  onChange: (value: { x: number; y: number }[]) => void;
  label: string;
}

export function CurveControl({ value, onChange, label }: CurveControlProps) {
  const [editingPoint, setEditingPoint] = useState<number | null>(null);

  const addPoint = () => {
    const newPoint = { x: 0.5, y: 0.5 };
    const newPoints = [...value, newPoint].sort((a, b) => a.x - b.x);
    onChange(newPoints);
  };

  const removePoint = (index: number) => {
    if (value.length > 2) { // Keep at least 2 points
      const newPoints = value.filter((_, i) => i !== index);
      onChange(newPoints);
    }
  };

  const updatePoint = (index: number, updates: Partial<{ x: number; y: number }>) => {
    const newPoints = value.map((point, i) =>
      i === index ? { ...point, ...updates } : point
    );
    onChange(newPoints.sort((a, b) => a.x - b.x));
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[0.2em] opacity-80">{label}</span>
        <button
          onClick={addPoint}
          className="px-2 py-1 text-xs border border-ink bg-paper hover:bg-ink hover:text-paper"
        >
          + Point
        </button>
      </div>

      {/* Simple curve visualization */}
      <div className="border border-ink bg-paper p-2 h-20 relative">
        <svg width="100%" height="100%" viewBox="0 0 100 100" className="absolute inset-0">
          {/* Grid */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.3"/>
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />

          {/* Curve line */}
          <polyline
            points={value.map(p => `${p.x * 100},${(1 - p.y) * 100}`).join(' ')}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />

          {/* Points */}
          {value.map((point, index) => (
            <circle
              key={index}
              cx={point.x * 100}
              cy={(1 - point.y) * 100}
              r="3"
              fill="currentColor"
              className="cursor-pointer hover:r-4"
              onClick={() => setEditingPoint(editingPoint === index ? null : index)}
            />
          ))}
        </svg>
      </div>

      {/* Point editor */}
      {editingPoint !== null && editingPoint < value.length && (
        <div className="border border-ink bg-stone-50 p-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs">Point {editingPoint + 1}</span>
            {value.length > 2 && (
              <button
                onClick={() => {
                  removePoint(editingPoint);
                  setEditingPoint(null);
                }}
                className="text-xs text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs">X</label>
              <input
                type="number"
                min={0}
                max={1}
                step={0.01}
                value={value[editingPoint].x}
                onChange={(e) => updatePoint(editingPoint, { x: parseFloat(e.target.value) })}
                className="w-full border border-ink px-2 py-1 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs">Y</label>
              <input
                type="number"
                min={0}
                max={1}
                step={0.01}
                value={value[editingPoint].y}
                onChange={(e) => updatePoint(editingPoint, { y: parseFloat(e.target.value) })}
                className="w-full border border-ink px-2 py-1 text-xs"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface RangeControlProps {
  value: { min: number; max: number };
  onChange: (value: { min: number; max: number }) => void;
  min: number;
  max: number;
  step?: number;
  label: string;
}

export function RangeControl({ value, onChange, min, max, step = 1, label }: RangeControlProps) {
  const handleMinChange = (newMin: number) => {
    const clampedMin = Math.max(min, Math.min(value.max, newMin));
    onChange({ ...value, min: clampedMin });
  };

  const handleMaxChange = (newMax: number) => {
    const clampedMax = Math.min(max, Math.max(value.min, newMax));
    onChange({ ...value, max: clampedMax });
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] uppercase tracking-[0.2em] opacity-80">{label}</span>

      {/* Visual range slider */}
      <div className="relative h-6 bg-stone-200 border border-ink">
        <div
          className="absolute h-full bg-ink opacity-30"
          style={{
            left: `${((value.min - min) / (max - min)) * 100}%`,
            width: `${((value.max - value.min) / (max - min)) * 100}%`
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value.min}
          onChange={(e) => handleMinChange(parseFloat(e.target.value))}
          className="absolute w-full h-full opacity-0 cursor-pointer"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value.max}
          onChange={(e) => handleMaxChange(parseFloat(e.target.value))}
          className="absolute w-full h-full opacity-0 cursor-pointer"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] opacity-60">Min</span>
          <input
            type="number"
            min={min}
            max={value.max}
            step={step}
            value={value.min}
            onChange={(e) => handleMinChange(parseFloat(e.target.value))}
            className="border border-ink bg-paper px-2 py-1 text-xs"
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] opacity-60">Max</span>
          <input
            type="number"
            min={value.min}
            max={max}
            step={step}
            value={value.max}
            onChange={(e) => handleMaxChange(parseFloat(e.target.value))}
            className="border border-ink bg-paper px-2 py-1 text-xs"
          />
        </div>
      </div>
    </div>
  );
}