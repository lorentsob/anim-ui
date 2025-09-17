import React, { act } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";

import { NotificationTray } from "@/components/NotificationTray";
import { useNotificationStore } from "@/store/useNotifications";

const AUTO_MS = 7000;

describe("NotificationTray", () => {
  beforeEach(() => {
    vi.useRealTimers();
    useNotificationStore.getState().clearAll();
    if (useNotificationStore.getState().panelOpen) {
      useNotificationStore.getState().togglePanel();
    }
  });

  it("auto-dismisses notifications after timeout", () => {
    vi.useFakeTimers();
    render(<NotificationTray />);

    act(() => {
      useNotificationStore.getState().addNotification("auto-dismiss");
    });

    expect(screen.getByText("auto-dismiss")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(AUTO_MS + 100);
    });

    expect(screen.queryByText("auto-dismiss")).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it("toggles log panel visibility", async () => {
    render(<NotificationTray />);

    expect(screen.queryByText(/Notification Log/)).not.toBeInTheDocument();

    act(() => {
      useNotificationStore.getState().togglePanel();
    });

    expect(await screen.findByText(/Notification Log/)).toBeInTheDocument();
  });
});
