"use client";

import React, { useEffect } from "react";
import clsx from "clsx";

import { useNotificationStore } from "@/store/useNotifications";

const AUTO_DISMISS_MS = 7000;

export function NotificationTray() {
  const items = useNotificationStore((state) => state.items);
  const dismiss = useNotificationStore((state) => state.dismissNotification);
  const panelOpen = useNotificationStore((state) => state.panelOpen);
  const togglePanel = useNotificationStore((state) => state.togglePanel);

  useEffect(() => {
    if (items.length === 0) return;

    const timers = items.map((item) =>
      window.setTimeout(() => dismiss(item.id), AUTO_DISMISS_MS),
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [items, dismiss]);

  if (!panelOpen && items.length === 0) return null;

  return (
    <aside
      className={clsx(
        "fixed bottom-4 right-4 z-50 flex w-[320px] flex-col gap-2 transition-opacity",
        panelOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-100",
      )}
    >
      {panelOpen && (
        <div className="border border-ink bg-paper px-3 py-2 text-[11px] uppercase tracking-[0.18em] shadow-[4px_4px_0_0_#000]">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold">Notification Log</span>
            <button
              type="button"
              onClick={togglePanel}
              className="border border-ink px-2 py-1 text-[10px] uppercase hover:bg-ink hover:text-paper"
            >
              Close
            </button>
          </div>
        </div>
      )}
      {items.map((item) => (
        <div
          key={item.id}
          className={clsx(
            "pointer-events-auto border border-ink bg-paper px-3 py-2 text-xs uppercase tracking-[0.18em] shadow-[4px_4px_0_0_#000]",
            item.level === "success" && "border-ink",
            item.level === "error" && "border-alert text-alert",
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="flex-1 text-[11px] font-semibold">{item.level}</span>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              className="border border-ink bg-paper px-2 py-1 text-[10px] uppercase hover:bg-ink hover:text-paper"
            >
              Close
            </button>
          </div>
          <p className="mt-1 font-mono normal-case tracking-normal">{item.message}</p>
        </div>
      ))}
      {panelOpen && items.length === 0 && (
        <div className="border border-ink bg-paper px-3 py-2 text-[10px] uppercase tracking-[0.18em] shadow-[4px_4px_0_0_#000]">
          No notifications yet.
        </div>
      )}
    </aside>
  );
}
