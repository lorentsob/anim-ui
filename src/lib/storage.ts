const STORAGE_KEY = "bw-animator-presets-v1";

export type StoredState = {
  effectId: string;
  params: Record<string, unknown>;
  width: number;
  height: number;
  fps: number;
  durationSec: number;
  seed: string;
  background: "white" | "black";
  invert: boolean;
};

type PresetRecord = {
  id: string;
  name: string;
  data: StoredState;
  savedAt: number;
};

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readRaw(): PresetRecord[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PresetRecord[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && typeof item.id === "string" && item.data);
  } catch (err) {
    console.warn("Failed to read presets", err);
    return [];
  }
}

function writeRaw(records: PresetRecord[]) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.warn("Failed to persist presets", err);
  }
}

function randomId() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function listPresets(): PresetRecord[] {
  return readRaw().sort((a, b) => b.savedAt - a.savedAt);
}

export function savePreset(name: string, data: StoredState): PresetRecord {
  const records = readRaw();
  const id = randomId();
  const preset: PresetRecord = {
    id,
    name: name.trim() || `Preset ${records.length + 1}`,
    data,
    savedAt: Date.now(),
  };
  writeRaw([preset, ...records]);
  return preset;
}

export function updatePreset(id: string, name: string, data: StoredState) {
  const records = readRaw();
  const next = records.map((record) =>
    record.id === id
      ? { ...record, name: name.trim() || record.name, data, savedAt: Date.now() }
      : record,
  );
  writeRaw(next);
}

export function deletePreset(id: string) {
  const records = readRaw();
  writeRaw(records.filter((record) => record.id !== id));
}
export type { PresetRecord };
