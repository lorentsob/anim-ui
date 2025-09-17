"use client";

import { create } from "zustand";

export type ExportEntry = {
  id: string;
  format: string;
  filename: string;
  url: string;
  sizeBytes: number;
  createdAt: number;
  durationMs: number;
};

type ExportHistoryState = {
  entries: ExportEntry[];
  addEntry: (entry: Omit<ExportEntry, "id">) => void;
  removeEntry: (id: string) => void;
  clear: () => void;
};

const MAX_ENTRIES = 5;

const makeId = () => Math.random().toString(36).slice(2, 8).toUpperCase();

const revokeUrl = (url?: string) => {
  if (!url) return;
  try {
    URL.revokeObjectURL(url);
  } catch (err) {
    console.warn("Failed to revoke object URL", err);
  }
};

export const useExportHistory = create<ExportHistoryState>((set) => ({
  entries: [],
  addEntry: (entry) => {
    const id = makeId();
    const item: ExportEntry = { id, ...entry };
    set((state) => {
      const next = [item, ...state.entries];
      if (next.length > MAX_ENTRIES) {
        const removed = next.pop();
        revokeUrl(removed?.url);
      }
      return { entries: next };
    });
  },
  removeEntry: (id) => {
    set((state) => {
      const remaining: ExportEntry[] = [];
      state.entries.forEach((entry) => {
        if (entry.id === id) {
          revokeUrl(entry.url);
        } else {
          remaining.push(entry);
        }
      });
      return { entries: remaining };
    });
  },
  clear: () => {
    set((state) => {
      state.entries.forEach((entry) => revokeUrl(entry.url));
      return { entries: [] };
    });
  },
}));
