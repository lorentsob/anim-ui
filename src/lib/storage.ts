import { createStorageError, safeSyncOperation, errorManager } from "./errorHandling";

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

  return safeSyncOperation(
    () => {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        throw new Error("Invalid presets format: not an array");
      }

      // Validate and filter records
      const validRecords = parsed.filter((item): item is PresetRecord => {
        return item &&
               typeof item === "object" &&
               typeof item.id === "string" &&
               typeof item.name === "string" &&
               item.data &&
               typeof item.savedAt === "number";
      });

      if (validRecords.length !== parsed.length) {
        console.warn(`Filtered out ${parsed.length - validRecords.length} invalid preset records`);
      }

      return validRecords;
    },
    [], // fallback
    {
      category: "storage",
      operation: "read-presets",
      severity: "low"
    }
  );
}

function writeRaw(records: PresetRecord[]): boolean {
  if (!isBrowser()) return false;

  return safeSyncOperation(
    () => {
      // Validate input
      if (!Array.isArray(records)) {
        throw new Error("Invalid records: must be an array");
      }

      const serialized = JSON.stringify(records);

      // Check storage quota (5MB limit)
      if (serialized.length > 5 * 1024 * 1024) {
        throw createStorageError("write-presets",
          new Error("Presets too large for storage"),
          { size: serialized.length, limit: 5 * 1024 * 1024 });
      }

      // Check available storage space
      try {
        const testKey = STORAGE_KEY + "-test";
        window.localStorage.setItem(testKey, serialized);
        window.localStorage.removeItem(testKey);
      } catch (quotaError) {
        throw createStorageError("write-presets",
          new Error("Storage quota exceeded"),
          { requestedSize: serialized.length });
      }

      window.localStorage.setItem(STORAGE_KEY, serialized);
      return true;
    },
    false, // fallback
    {
      category: "storage",
      operation: "write-presets",
      severity: "medium",
      metadata: { recordCount: records.length }
    }
  );
}

function randomId() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function listPresets(): PresetRecord[] {
  return readRaw().sort((a, b) => b.savedAt - a.savedAt);
}

export function savePreset(name: string, data: StoredState): PresetRecord | null {
  try {
    const records = readRaw();
    const id = randomId();
    const preset: PresetRecord = {
      id,
      name: name.trim() || `Preset ${records.length + 1}`,
      data,
      savedAt: Date.now(),
    };

    const success = writeRaw([preset, ...records]);
    if (!success) {
      throw new Error("Failed to save preset to storage");
    }

    return preset;
  } catch (error) {
    errorManager.handleError(createStorageError("save-preset", error as Error, {
      presetName: name,
      dataSize: JSON.stringify(data).length
    }));
    return null;
  }
}

export function updatePreset(id: string, name: string, data: StoredState): boolean {
  try {
    const records = readRaw();
    const targetIndex = records.findIndex(record => record.id === id);

    if (targetIndex === -1) {
      throw new Error(`Preset with id '${id}' not found`);
    }

    const next = records.map((record) =>
      record.id === id
        ? { ...record, name: name.trim() || record.name, data, savedAt: Date.now() }
        : record,
    );

    const success = writeRaw(next);
    if (!success) {
      throw new Error("Failed to update preset in storage");
    }

    return true;
  } catch (error) {
    errorManager.handleError(createStorageError("update-preset", error as Error, {
      presetId: id,
      presetName: name
    }));
    return false;
  }
}

export function deletePreset(id: string): boolean {
  try {
    const records = readRaw();
    const initialCount = records.length;
    const filtered = records.filter((record) => record.id !== id);

    if (filtered.length === initialCount) {
      throw new Error(`Preset with id '${id}' not found`);
    }

    const success = writeRaw(filtered);
    if (!success) {
      throw new Error("Failed to delete preset from storage");
    }

    return true;
  } catch (error) {
    errorManager.handleError(createStorageError("delete-preset", error as Error, {
      presetId: id
    }));
    return false;
  }
}
export type { PresetRecord };
