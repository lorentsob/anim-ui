"use client";

import { create } from "zustand";
import { effects, getEffect } from "@/effects";
import type { ParamValues, ParamValue } from "@/effects/types";
import { generateSeed } from "@/lib/rng";
import type { StoredState } from "@/lib/storage";

export type Background = "white" | "black";

type EditorState = {
  effectId: string;
  params: ParamValues;
  width: number;
  height: number;
  fps: number;
  durationSec: number;
  seed: string;
  background: Background;
  invert: boolean;
  enableWarnings: boolean;
  playing: boolean;
  currentFrame: number;
  setSize: (width: number, height: number) => void;
  setFps: (fps: number) => void;
  setDuration: (seconds: number) => void;
  setEffectId: (id: string) => void;
  setParam: (key: string, value: ParamValue) => void;
  setPlaying: (playing: boolean) => void;
  togglePlaying: () => void;
  setSeed: (seed: string) => void;
  randomizeSeed: () => void;
  setBackground: (value: Background) => void;
  toggleInvert: () => void;
  toggleWarnings: () => void;
  setCurrentFrame: (frame: number) => void;
  loadFromStoredState: (snapshot: StoredState) => void;
};

const initialEffect = effects[0];

const sanitizeDimension = (value: number, fallback: number) => {
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return Math.round(Math.max(32, Math.min(8192, value)));
};

const sanitizeFps = (value: number, fallback: number) => {
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return Math.max(1, Math.min(120, Math.round(value)));
};

const sanitizeDuration = (value: number, fallback: number) => {
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return Math.max(1, Math.min(300, Math.round(value)));
};

export const useEditorStore = create<EditorState>((set, get) => ({
  effectId: initialEffect.id,
  params: { ...initialEffect.defaults },
  width: 640,
  height: 640,
  fps: 12,
  durationSec: 6,
  seed: generateSeed(),
  background: "white",
  invert: false,
  enableWarnings: true,
  playing: true,
  currentFrame: 0,
  setSize: (width, height) => {
    const newWidth = sanitizeDimension(width, get().width);
    const newHeight = sanitizeDimension(height, get().height);

    set({
      width: newWidth,
      height: newHeight,
    });
  },
  setFps: (fps) => {
    const newFps = sanitizeFps(fps, get().fps);

    set({
      fps: newFps,
    });
  },
  setDuration: (seconds) => {
    set({ durationSec: sanitizeDuration(seconds, get().durationSec) });
  },
  setEffectId: (id) => {
    const effect = getEffect(id);
    set({
      effectId: effect.id,
      params: { ...effect.defaults },
      currentFrame: 0,
    });
  },
  setParam: (key, value) => {
    set((state) => ({
      params: {
        ...state.params,
        [key]: value,
      },
    }));
  },
  setPlaying: (playing) => set({ playing }),
  togglePlaying: () => set((state) => ({ playing: !state.playing })),
  setSeed: (seed) => {
    set({ seed: seed.toUpperCase().trim() || generateSeed(), currentFrame: 0 });
  },
  randomizeSeed: () => {
    set({ seed: generateSeed(), currentFrame: 0 });
  },
  setBackground: (value) => set({ background: value }),
  toggleInvert: () => set((state) => ({ invert: !state.invert })),
  toggleWarnings: () => set((state) => ({ enableWarnings: !state.enableWarnings })),
  setCurrentFrame: (frame) => set({ currentFrame: frame }),
  loadFromStoredState: (snapshot) => {
    const effect = getEffect(snapshot.effectId);
    const mergedParams: ParamValues = {
      ...effect.defaults,
      ...(snapshot.params as ParamValues),
    };
    const width = sanitizeDimension(snapshot.width, 640);
    const height = sanitizeDimension(snapshot.height, 640);
    const fps = sanitizeFps(snapshot.fps, 12);

    set({
      effectId: effect.id,
      params: mergedParams,
      width,
      height,
      fps,
      durationSec: sanitizeDuration(snapshot.durationSec, 6),
      seed: snapshot.seed?.toUpperCase?.() ?? generateSeed(),
      background: snapshot.background,
      invert: snapshot.invert,
      currentFrame: 0,
      playing: false,
    });
  },
}));

export const getStoredStateSnapshot = (): StoredState => {
  const state = useEditorStore.getState();
  return {
    effectId: state.effectId,
    params: { ...state.params },
    width: state.width,
    height: state.height,
    fps: state.fps,
    durationSec: state.durationSec,
    seed: state.seed,
    background: state.background,
    invert: state.invert,
  };
};
