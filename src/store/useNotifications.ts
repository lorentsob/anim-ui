"use client";

import { create } from "zustand";

export type NotificationLevel = "info" | "success" | "error";

export type NotificationItem = {
  id: string;
  message: string;
  level: NotificationLevel;
  createdAt: number;
};

type NotificationState = {
  items: NotificationItem[];
  addNotification: (message: string, level?: NotificationLevel) => void;
  dismissNotification: (id: string) => void;
  clearAll: () => void;
  panelOpen: boolean;
  togglePanel: () => void;
};

const MAX_ITEMS = 5;

const randomId = () => Math.random().toString(36).slice(2, 8).toUpperCase();

export const useNotificationStore = create<NotificationState>((set) => ({
  items: [],
  panelOpen: false,
  addNotification: (message, level = "info") => {
    const fallback =
      level === "error"
        ? "Something went wrong"
        : level === "success"
        ? "Action completed"
        : "Notification";
    const text = message?.trim() ? message : fallback;
    const item: NotificationItem = {
      id: randomId(),
      message: text,
      level,
      createdAt: Date.now(),
    };
    set((state) => {
      const next = [item, ...state.items].slice(0, MAX_ITEMS);
      return { items: next };
    });
  },
  dismissNotification: (id) => {
    set((state) => ({ items: state.items.filter((item) => item.id !== id) }));
  },
  clearAll: () => set({ items: [] }),
  togglePanel: () => set((state) => ({ panelOpen: !state.panelOpen })),
}));
