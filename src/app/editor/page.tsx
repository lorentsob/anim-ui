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

export default function EditorPage() {
  const loadFromStoredState = useEditorStore((state) => state.loadFromStoredState);
  const blendingEnabled = useBlendingStore((state) => state.blendingEnabled);
  const timelineMode = useEditorStore((state) => state.timelineMode);

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
      <main className="min-h-screen bg-paper text-ink">
        <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col gap-4 px-4 py-6">
          <ErrorBoundary>
            <TopBar />
          </ErrorBoundary>
          <section className="flex flex-1 flex-col gap-4 lg:flex-row">
            <div className="flex flex-1 items-center justify-center border border-ink bg-paper p-4">
              <div className="flex max-h-full max-w-full items-center justify-center border border-dashed border-ink bg-paper p-4">
                <ErrorBoundary resetKeys={[blendingEnabled ? "blending" : "normal"]}>
                  {blendingEnabled ? <BlendedCanvasHost /> : <CanvasHost />}
                </ErrorBoundary>
              </div>
            </div>
            <div className="flex">
              <ErrorBoundary>
                <ParamPanel />
              </ErrorBoundary>
              {blendingEnabled && (
                <ErrorBoundary>
                  <LayerPanel />
                </ErrorBoundary>
              )}
            </div>
          </section>
          <ErrorBoundary>
            <RecorderBar />
          </ErrorBoundary>
          {timelineMode && (
            <ErrorBoundary>
              <TimelinePanel isVisible={timelineMode} />
            </ErrorBoundary>
          )}
          <ErrorBoundary>
            <StatusBar />
          </ErrorBoundary>
        </div>
      </main>
    </ErrorBoundary>
  );
}
