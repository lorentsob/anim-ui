"use client";

import { create } from "zustand";
import { effects } from "@/effects";
import type { EffectLayer, BlendMode } from "@/effects/types";
import { generateSeed } from "@/lib/rng";

type BlendingState = {
  blendingEnabled: boolean;
  layers: EffectLayer[];
  addLayer: () => void;
  removeLayer: (id: string) => void;
  updateLayer: (id: string, updates: Partial<Omit<EffectLayer, "id">>) => void;
  reorderLayer: (fromIndex: number, toIndex: number) => void;
  toggleBlending: () => void;
  setBlendingEnabled: (enabled: boolean) => void;
  duplicateLayer: (id: string) => void;
  clearAllLayers: () => void;
};

const createLayer = (index: number): EffectLayer => {
  const effect = effects[0];
  return {
    id: `layer-${Date.now()}-${index}`,
    effectId: effect.id,
    opacity: 1.0,
    blendMode: "normal",
    enabled: true,
    params: { ...effect.defaults },
  };
};

export const useBlendingStore = create<BlendingState>((set, get) => ({
  blendingEnabled: false,
  layers: [createLayer(0)],

  addLayer: () => {
    const { layers } = get();
    const newLayer = createLayer(layers.length);
    set({ layers: [...layers, newLayer] });
  },

  removeLayer: (id) => {
    set((state) => ({
      layers: state.layers.filter((layer) => layer.id !== id),
    }));
  },

  updateLayer: (id, updates) => {
    set((state) => ({
      layers: state.layers.map((layer) =>
        layer.id === id ? { ...layer, ...updates } : layer
      ),
    }));
  },

  reorderLayer: (fromIndex, toIndex) => {
    set((state) => {
      const newLayers = [...state.layers];
      const [moved] = newLayers.splice(fromIndex, 1);
      newLayers.splice(toIndex, 0, moved);
      return { layers: newLayers };
    });
  },

  toggleBlending: () => {
    set((state) => ({ blendingEnabled: !state.blendingEnabled }));
  },

  setBlendingEnabled: (enabled) => {
    set({ blendingEnabled: enabled });
  },

  duplicateLayer: (id) => {
    const { layers } = get();
    const layer = layers.find((l) => l.id === id);
    if (layer) {
      const duplicate: EffectLayer = {
        ...layer,
        id: `layer-${Date.now()}-duplicate`,
      };
      const index = layers.findIndex((l) => l.id === id);
      const newLayers = [...layers];
      newLayers.splice(index + 1, 0, duplicate);
      set({ layers: newLayers });
    }
  },

  clearAllLayers: () => {
    set({ layers: [createLayer(0)] });
  },
}));