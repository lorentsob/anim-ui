"use client";

import { useState } from "react";

import { NumericField } from "@/components/NumericField";
import { effects } from "@/effects";
import { createShareUrl } from "@/lib/shareUrls";
import { useNotificationStore } from "@/store/useNotifications";
import { useEditorStore } from "@/store/useEditor";
import { useBlendingStore } from "@/store/useBlending";

function SectionLabel({ label }: { label: string }) {
  return (
    <span className="text-[11px] uppercase tracking-[0.18em] text-ink opacity-80">
      {label}
    </span>
  );
}

export function TopBar() {
  const effectId = useEditorStore((state) => state.effectId);
  const setEffectId = useEditorStore((state) => state.setEffectId);
  const width = useEditorStore((state) => state.width);
  const height = useEditorStore((state) => state.height);
  const setSize = useEditorStore((state) => state.setSize);
  const fps = useEditorStore((state) => state.fps);
  const setFps = useEditorStore((state) => state.setFps);
  const durationSec = useEditorStore((state) => state.durationSec);
  const setDuration = useEditorStore((state) => state.setDuration);
  const seed = useEditorStore((state) => state.seed);
  const setSeed = useEditorStore((state) => state.setSeed);
  const randomizeSeed = useEditorStore((state) => state.randomizeSeed);
  const playing = useEditorStore((state) => state.playing);
  const togglePlaying = useEditorStore((state) => state.togglePlaying);
  const background = useEditorStore((state) => state.background);
  const setBackground = useEditorStore((state) => state.setBackground);
  const invert = useEditorStore((state) => state.invert);
  const toggleInvert = useEditorStore((state) => state.toggleInvert);
  const qualityMode = useEditorStore((state) => state.qualityMode);
  const setQualityMode = useEditorStore((state) => state.setQualityMode);
  const timelineMode = useEditorStore((state) => state.timelineMode);
  const toggleTimelineMode = useEditorStore((state) => state.toggleTimelineMode);
  const addNotification = useNotificationStore((state) => state.addNotification);
  const [shareBusy, setShareBusy] = useState(false);

  const blendingEnabled = useBlendingStore((state) => state.blendingEnabled);
  const toggleBlending = useBlendingStore((state) => state.toggleBlending);

  const handleShare = async () => {
    try {
      setShareBusy(true);
      const url = createShareUrl();
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        addNotification("Share link copied", "success");
      } else {
        addNotification(url, "info");
      }
    } catch (error) {
      console.error(error);
      addNotification("Unable to copy share link", "error");
    } finally {
      setShareBusy(false);
    }
  };

  return (
    <header className="flex flex-col gap-3 border border-ink bg-paper px-4 py-3 uppercase tracking-[0.08em] shadow-[inset_0_0_0_1px_#000]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm font-semibold">BW Animator · MVP Prototype</span>
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            className="border border-ink bg-paper px-3 py-1 font-semibold hover:bg-ink hover:text-paper"
            onClick={togglePlaying}
          >
            {playing ? "Pause" : "Play"}
          </button>
          <button
            type="button"
            className="border border-ink bg-paper px-3 py-1 hover:bg-ink hover:text-paper"
            onClick={randomizeSeed}
          >
            Random Seed
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4 text-xs normal-case">
        <div className="flex min-w-[200px] flex-col gap-1">
          <SectionLabel label="Effect" />
          <select
            value={effectId}
            onChange={(event) => setEffectId(event.target.value)}
            className="border border-ink bg-paper px-3 py-2 capitalize shadow-[inset_0_0_0_1px_#000]"
          >
            {effects.map((effect) => (
              <option key={effect.id} value={effect.id}>
                {effect.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex min-w-[220px] flex-col gap-1">
          <SectionLabel label="Seed" />
          <div className="flex items-center gap-2">
            <input
              value={seed}
              maxLength={12}
              onChange={(event) => setSeed(event.target.value.toUpperCase())}
              className="flex-1 border border-ink bg-paper px-3 py-2 uppercase shadow-[inset_0_0_0_1px_#000]"
            />
            <button
              type="button"
              className="border border-ink px-3 py-2 uppercase hover:bg-ink hover:text-paper"
              onClick={randomizeSeed}
            >
              Random
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <NumericField
            label="Width"
            value={width}
            min={32}
            max={8192}
            integer
            onChange={(next) => setSize(next, height)}
            className="w-[152px]"
          />
          <NumericField
            label="Height"
            value={height}
            min={32}
            max={8192}
            integer
            onChange={(next) => setSize(width, next)}
            className="w-[152px]"
          />
          <NumericField
            label="FPS"
            value={fps}
            min={1}
            max={120}
            integer
            onChange={(next) => setFps(next)}
            className="w-[128px]"
          />
          <NumericField
            label="Duration"
            value={durationSec}
            min={1}
            max={120}
            integer
            onChange={(next) => setDuration(next)}
            className="w-[152px]"
          />
        </div>

        <div className="flex flex-col gap-1">
          <SectionLabel label="Background" />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setBackground("white")}
              className={`border border-ink px-3 py-2 ${
                background === "white" ? "bg-ink text-paper" : "bg-paper"
              }`}
            >
              White
            </button>
            <button
              type="button"
              onClick={() => setBackground("black")}
              className={`border border-ink px-3 py-2 ${
                background === "black" ? "bg-ink text-paper" : "bg-paper"
              }`}
            >
              Black
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <SectionLabel label="Invert" />
          <button
            type="button"
            onClick={toggleInvert}
            className={`border border-ink px-3 py-2 ${invert ? "bg-ink text-paper" : "bg-paper"}`}
          >
            {invert ? "On" : "Off"}
          </button>
        </div>

        <div className="flex flex-col gap-1">
          <SectionLabel label="Quality" />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setQualityMode("preview")}
              className={`border border-ink px-3 py-2 text-xs ${
                qualityMode === "preview" ? "bg-ink text-paper" : "bg-paper"
              }`}
            >
              Preview
            </button>
            <button
              type="button"
              onClick={() => setQualityMode("render")}
              className={`border border-ink px-3 py-2 text-xs ${
                qualityMode === "render" ? "bg-ink text-paper" : "bg-paper"
              }`}
            >
              Render
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <SectionLabel label="Timeline" />
          <button
            type="button"
            onClick={toggleTimelineMode}
            className={`border border-ink px-3 py-2 text-xs ${
              timelineMode ? "bg-ink text-paper" : "bg-paper hover:bg-ink hover:text-paper"
            }`}
          >
            {timelineMode ? "ON" : "OFF"}
          </button>
        </div>

        <div className="flex flex-col gap-1">
          <SectionLabel label="Blending" />
          <button
            type="button"
            onClick={toggleBlending}
            className={`border border-ink px-3 py-2 text-xs ${
              blendingEnabled ? "bg-ink text-paper" : "bg-paper hover:bg-ink hover:text-paper"
            }`}
          >
            {blendingEnabled ? "ON" : "OFF"}
          </button>
        </div>

        <div className="flex flex-col gap-1">
          <SectionLabel label="Share" />
          <button
            type="button"
            onClick={handleShare}
            disabled={shareBusy}
            className={`border border-ink px-3 py-2 text-xs ${
              shareBusy ? "opacity-60" : "hover:bg-ink hover:text-paper"
            }`}
          >
            {shareBusy ? "Copying" : "Copy Link"}
          </button>
        </div>
      </div>
    </header>
  );
}
