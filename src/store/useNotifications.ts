"use client";

import { create } from "zustand";
import { errorManager, type AppError } from "@/lib/errorHandling";

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
  addErrorNotification: (error: AppError) => void;
  dismissNotification: (id: string) => void;
  clearAll: () => void;
  panelOpen: boolean;
  togglePanel: () => void;
  errorStats: Record<string, { count: number; lastOccurrence: number }>;
  refreshErrorStats: () => void;
};

const MAX_ITEMS = 5;

const randomId = () => Math.random().toString(36).slice(2, 8).toUpperCase();

export const useNotificationStore = create<NotificationState>((set, get) => ({
  items: [],
  panelOpen: false,
  errorStats: {},
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
  addErrorNotification: (error: AppError) => {
    const item: NotificationItem = {
      id: randomId(),
      message: error.userMessage,
      level: error.severity === "critical" || error.severity === "high" ? "error" : "info",
      createdAt: error.timestamp,
    };
    set((state) => {
      const next = [item, ...state.items].slice(0, MAX_ITEMS);
      return { items: next, errorStats: errorManager.getErrorStats() };
    });

    // Add recovery suggestion for retryable errors
    if (error.retryable && error.severity !== "critical") {
      setTimeout(() => {
        const recoveryItem: NotificationItem = {
          id: randomId(),
          message: "You can try the operation again.",
          level: "info",
          createdAt: Date.now(),
        };
        set((state) => {
          const next = [recoveryItem, ...state.items].slice(0, MAX_ITEMS);
          return { items: next };
        });
      }, 2000);
    }
  },
  dismissNotification: (id) => {
    set((state) => ({ items: state.items.filter((item) => item.id !== id) }));
  },
  clearAll: () => set({ items: [], errorStats: {} }),
  togglePanel: () => set((state) => ({ panelOpen: !state.panelOpen })),
  refreshErrorStats: () => {
    set({ errorStats: errorManager.getErrorStats() });
  },
}));

// Initialize error handling integration
errorManager.addHandler("animation", (error) => {
  useNotificationStore.getState().addErrorNotification(error);
});

errorManager.addHandler("export", (error) => {
  useNotificationStore.getState().addErrorNotification(error);
});

errorManager.addHandler("storage", (error) => {
  useNotificationStore.getState().addErrorNotification(error);
});

errorManager.addHandler("canvas", (error) => {
  useNotificationStore.getState().addErrorNotification(error);
});

errorManager.addHandler("system", (error) => {
  useNotificationStore.getState().addErrorNotification(error);
});
