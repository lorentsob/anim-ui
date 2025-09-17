"use client";

import { getEffect } from "@/effects";
import { useEffect, useState } from "react";

import { useEditorStore } from "@/store/useEditor";
import { useNotificationStore } from "@/store/useNotifications";

const pad = (value: number) => value.toString().padStart(2, "0");

function formatTime(totalSeconds: number) {
  const seconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60);
  return `${pad(minutes)}:${pad(remaining)}`;
}

export function StatusBar() {
  const frame = useEditorStore((state) => state.currentFrame);
  const fps = useEditorStore((state) => state.fps);
  const durationSec = useEditorStore((state) => state.durationSec);
  const playing = useEditorStore((state) => state.playing);
  const seed = useEditorStore((state) => state.seed);
  const effectId = useEditorStore((state) => state.effectId);
  const toggleNotificationPanel = useNotificationStore((state) => state.togglePanel);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalFrames = Math.max(1, Math.round(durationSec * Math.max(1, fps)));
  const currentTime = frame / Math.max(1, fps);
  const effect = getEffect(effectId);

  return (
    <footer className="flex flex-wrap items-center justify-between gap-2 border border-ink bg-paper px-4 py-2 text-xs uppercase tracking-[0.18em]">
      <span>
        Frame {frame.toString().padStart(3, "0")} · {formatTime(currentTime)} / {formatTime(durationSec)} ({
          totalFrames
        } frames @ {fps}fps)
      </span>
      <span>Effect · {effect.name}</span>
      <span>
        Seed · <span suppressHydrationWarning>{mounted ? seed : "--"}</span> ·
        {" "}
        {playing ? "Playing" : "Paused"}
      </span>
      <button
        type="button"
        onClick={toggleNotificationPanel}
        className="border border-ink px-2 py-1 text-[10px] uppercase hover:bg-ink hover:text-paper"
      >
        Toast Log
      </button>
    </footer>
  );
}
