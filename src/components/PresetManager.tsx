"use client";

import { useEffect, useState } from "react";

import type { PresetRecord } from "@/lib/storage";
import { deletePreset, listPresets, savePreset } from "@/lib/storage";
import { getStoredStateSnapshot, useEditorStore } from "@/store/useEditor";
import { useNotificationStore } from "@/store/useNotifications";

export function PresetManager() {
  const [presets, setPresets] = useState<PresetRecord[]>([]);
  const [name, setName] = useState("");
  const loadFromStoredState = useEditorStore((state) => state.loadFromStoredState);
  const addNotification = useNotificationStore((state) => state.addNotification);

  const refresh = () => {
    setPresets(listPresets());
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleSave = () => {
    const snapshot = getStoredStateSnapshot();
    const preset = savePreset(name, snapshot);
    setName("");
    refresh();
    if (preset) {
      addNotification(`Saved preset "${preset.name}"`, "success");
    } else {
      addNotification("Failed to save preset", "error");
    }
  };

  const handleApply = (preset: PresetRecord) => {
    loadFromStoredState(preset.data);
    addNotification(`Loaded preset "${preset.name}"`, "info");
  };

  const handleDelete = (preset: PresetRecord) => {
    deletePreset(preset.id);
    refresh();
    addNotification(`Deleted preset "${preset.name}"`, "info");
  };

  return (
    <div className="mt-4 border border-ink bg-paper p-3 uppercase">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold tracking-[0.2em]">Presets</h3>
        <div className="flex items-center gap-2">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Preset name"
            className="w-[160px] border border-ink bg-paper px-2 py-1 text-xs tracking-normal normal-case"
          />
          <button
            type="button"
            onClick={handleSave}
            className="border border-ink px-3 py-1 text-xs hover:bg-ink hover:text-paper"
          >
            Save
          </button>
        </div>
      </div>
      {presets.length === 0 ? (
        <p className="text-[11px] uppercase tracking-[0.2em] opacity-60">No presets saved yet.</p>
      ) : (
        <ul className="flex max-h-[200px] flex-col gap-2 overflow-y-auto text-xs normal-case">
          {presets.map((preset) => (
            <li key={preset.id} className="flex items-center gap-2 border border-ink px-2 py-1">
              <button
                type="button"
                onClick={() => handleApply(preset)}
                className="flex-1 text-left uppercase tracking-[0.18em] hover:underline"
              >
                {preset.name}
              </button>
              <span className="text-[10px] uppercase tracking-[0.2em] opacity-70">
                {new Date(preset.savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
              <button
                type="button"
                onClick={() => handleDelete(preset)}
                className="border border-ink px-2 py-1 text-[10px] uppercase hover:bg-alert hover:text-paper"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
