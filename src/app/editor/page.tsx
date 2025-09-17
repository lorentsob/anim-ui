"use client";

import { useEffect } from "react";

import { CanvasHost } from "@/components/CanvasHost";
import { BlendedCanvasHost } from "@/components/BlendedCanvasHost";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import LayerPanel from "@/components/LayerPanel";
import { ParamPanel } from "@/components/ParamPanel";
import { RecorderBar } from "@/components/RecorderBar";
import { StatusBar } from "@/components/StatusBar";
import TimelinePanel from "@/components/TimelinePanel";
import { TopBar } from "@/components/TopBar";
import { decodeEditorState, STATE_PARAM } from "@/lib/shareUrls";
import { useEditorStore } from "@/store/useEditor";
import { useBlendingStore } from "@/store/useBlending";

function TimelineControls() {
  const timelineMode = useEditorStore((state) => state.timelineMode);
  const toggleTimelineMode = useEditorStore((state) => state.toggleTimelineMode);

  return (
    <div className="flex flex-col gap-2">
      {/* Timeline toggle */}
      <div className="flex items-center justify-between border border-ink bg-paper px-4 py-2">
        <span className="text-xs uppercase tracking-[0.18em] text-ink opacity-80">
          Timeline Animation
        </span>
        <button
          type="button"
          onClick={toggleTimelineMode}
          className={`border border-ink px-3 py-1 text-xs uppercase tracking-[0.08em] ${
            timelineMode ? "bg-ink text-paper" : "bg-paper hover:bg-ink hover:text-paper"
          }`}
        >
          {timelineMode ? "ON" : "OFF"}
        </button>
      </div>

      {/* Timeline panel */}
      {timelineMode && (
        <ErrorBoundary>
          <TimelinePanel isVisible={timelineMode} />
        </ErrorBoundary>
      )}
    </div>
  );
}

export default function EditorPage() {
  const loadFromStoredState = useEditorStore((state) => state.loadFromStoredState);
  const blendingEnabled = useBlendingStore((state) => state.blendingEnabled);

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
                    <ErrorBoundary resetKeys={[blendingEnabled ? "blending" : "normal"]}>
                      {blendingEnabled ? <BlendedCanvasHost /> : <CanvasHost />}
                    </ErrorBoundary>
                  </div>
                </div>

                {/* Timeline controls and panel */}
                <TimelineControls />

                {/* Export bar */}
                <ErrorBoundary>
                  <RecorderBar />
                </ErrorBoundary>
              </div>
            </div>

            {/* Right side - FIXED parameter panel (always visible) */}
            <div className="w-[320px] flex-shrink-0">
              <div className="sticky top-0 h-screen">
                <ErrorBoundary>
                  <ParamPanel />
                </ErrorBoundary>
                {blendingEnabled && (
                  <ErrorBoundary>
                    <LayerPanel />
                  </ErrorBoundary>
                )}
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
