"use client";

import { useEffect } from "react";

import { CanvasHost } from "@/components/CanvasHost";
import { ParamPanel } from "@/components/ParamPanel";
import { RecorderBar } from "@/components/RecorderBar";
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
    <main className="min-h-screen bg-paper text-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col gap-4 px-4 py-6">
        <TopBar />
        <section className="flex flex-1 flex-col gap-4 lg:flex-row">
          <div className="flex flex-1 items-center justify-center border border-ink bg-paper p-4">
            <div className="flex max-h-full max-w-full items-center justify-center border border-dashed border-ink bg-paper p-4">
              <CanvasHost />
            </div>
          </div>
          <ParamPanel />
        </section>
        <RecorderBar />
        <StatusBar />
      </div>
    </main>
  );
}
