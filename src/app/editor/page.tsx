"use client";

import { useEffect } from "react";

import { CanvasHost } from "@/components/CanvasHost";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ParamPanel } from "@/components/ParamPanel";
import { StatusBar } from "@/components/StatusBar";
import { TopBar } from "@/components/TopBar";
import { decodeEditorState, STATE_PARAM } from "@/lib/shareUrls";
import { useEditorStore } from "@/store/useEditor";


export default function EditorPage() {
  const loadFromStoredState = useEditorStore((state) => state.loadFromStoredState);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const encoded = url.searchParams.get(STATE_PARAM);
    const snapshot = decodeEditorState(encoded);
    if (snapshot && typeof snapshot === "object") {
      loadFromStoredState(snapshot as any);
      url.searchParams.delete(STATE_PARAM);
      window.history.replaceState({}, "", url.toString());
    }
  }, [loadFromStoredState]);

  return (
    <ErrorBoundary resetOnPropsChange>
      <main className="h-screen bg-paper text-ink flex flex-col">
        <div className="mx-auto w-full max-w-[1440px] px-4 py-4 flex flex-col h-full">
          <ErrorBoundary>
            <TopBar />
          </ErrorBoundary>

          <div className="flex flex-1 gap-4 mt-2 overflow-hidden">
            {/* Left side - scrollable content (viewport and timeline) */}
            <div className="flex-1 overflow-y-auto">
              <div className="flex flex-col gap-4">
                {/* Canvas viewport */}
                <div className="flex items-center justify-center border border-ink bg-paper p-4">
                  <div className="flex max-h-full max-w-full items-center justify-center border border-dashed border-ink bg-paper p-4">
                    <ErrorBoundary>
                      <CanvasHost />
                    </ErrorBoundary>
                  </div>
                </div>

              </div>
            </div>

            {/* Right side - FIXED parameter panel (always visible) */}
            <div className="w-[320px] flex-shrink-0">
              <div className="sticky top-0 h-screen">
                <ErrorBoundary>
                  <ParamPanel />
                </ErrorBoundary>
              </div>
            </div>
          </div>

          <ErrorBoundary>
            <StatusBar />
          </ErrorBoundary>
        </div>
      </main>
    </ErrorBoundary>
  );
}
