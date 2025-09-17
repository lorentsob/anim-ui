"use client";

import { effects } from "@/effects";
import { BLEND_MODES } from "@/lib/blending";
import { useBlendingStore } from "@/store/useBlending";
import type { EffectLayer } from "@/effects/types";

interface LayerItemProps {
  layer: EffectLayer;
  index: number;
  isLast: boolean;
}

function LayerItem({ layer, index, isLast }: LayerItemProps) {
  const updateLayer = useBlendingStore((state) => state.updateLayer);
  const removeLayer = useBlendingStore((state) => state.removeLayer);
  const duplicateLayer = useBlendingStore((state) => state.duplicateLayer);

  const effect = effects.find((e) => e.id === layer.effectId) ?? effects[0];

  return (
    <div className="border border-stone-300 p-3 bg-white">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={layer.enabled}
            onChange={(e) => updateLayer(layer.id, { enabled: e.target.checked })}
            className="w-4 h-4"
          />
          <span className="font-mono text-sm">{effect.name}</span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => duplicateLayer(layer.id)}
            className="px-2 py-1 text-xs bg-stone-200 hover:bg-stone-300 transition-colors"
            title="Duplicate layer"
          >
            ⧉
          </button>
          {!isLast && (
            <button
              onClick={() => removeLayer(layer.id)}
              className="px-2 py-1 text-xs bg-red-200 hover:bg-red-300 transition-colors"
              title="Remove layer"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <label className="block mb-1 font-mono">Effect</label>
          <select
            value={layer.effectId}
            onChange={(e) => {
              const newEffect = effects.find((eff) => eff.id === e.target.value) ?? effects[0];
              updateLayer(layer.id, {
                effectId: newEffect.id,
                params: { ...newEffect.defaults },
              });
            }}
            className="w-full px-2 py-1 border border-stone-300 font-mono"
          >
            {effects.map((eff) => (
              <option key={eff.id} value={eff.id}>
                {eff.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1 font-mono">Blend</label>
          <select
            value={layer.blendMode}
            onChange={(e) => updateLayer(layer.id, { blendMode: e.target.value as any })}
            className="w-full px-2 py-1 border border-stone-300 font-mono"
            disabled={index === 0}
          >
            {BLEND_MODES.map((mode) => (
              <option key={mode.value} value={mode.value}>
                {mode.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-2">
        <label className="block mb-1 text-xs font-mono">
          Opacity: {Math.round(layer.opacity * 100)}%
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={layer.opacity}
          onChange={(e) => updateLayer(layer.id, { opacity: parseFloat(e.target.value) })}
          className="w-full"
          disabled={index === 0}
        />
      </div>
    </div>
  );
}

export default function LayerPanel() {
  const blendingEnabled = useBlendingStore((state) => state.blendingEnabled);
  const layers = useBlendingStore((state) => state.layers);
  const addLayer = useBlendingStore((state) => state.addLayer);
  const toggleBlending = useBlendingStore((state) => state.toggleBlending);
  const clearAllLayers = useBlendingStore((state) => state.clearAllLayers);

  if (!blendingEnabled) {
    return (
      <div className="p-4 bg-stone-100 border-l border-stone-300">
        <div className="text-center">
          <h3 className="font-mono text-sm mb-2">Effect Blending</h3>
          <button
            onClick={toggleBlending}
            className="px-3 py-2 bg-stone-800 text-white font-mono text-xs hover:bg-stone-700 transition-colors"
          >
            Enable Blending
          </button>
          <p className="text-xs text-stone-600 mt-2">
            Combine multiple effects with blend modes
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-stone-100 border-l border-stone-300 flex flex-col h-full">
      <div className="p-3 border-b border-stone-300">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-mono text-sm">Layers ({layers.length})</h3>
          <button
            onClick={toggleBlending}
            className="px-2 py-1 text-xs bg-stone-300 hover:bg-stone-400 transition-colors"
            title="Disable blending"
          >
            ×
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={addLayer}
            className="flex-1 px-2 py-1 bg-stone-800 text-white font-mono text-xs hover:bg-stone-700 transition-colors"
          >
            + Add Layer
          </button>
          <button
            onClick={clearAllLayers}
            className="px-2 py-1 bg-red-200 hover:bg-red-300 font-mono text-xs transition-colors"
            title="Clear all layers"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {layers.map((layer, index) => (
          <LayerItem
            key={layer.id}
            layer={layer}
            index={index}
            isLast={layers.length === 1}
          />
        ))}
      </div>

      <div className="p-2 border-t border-stone-300 text-xs text-stone-600 font-mono">
        Layers blend bottom-to-top
      </div>
    </div>
  );
}