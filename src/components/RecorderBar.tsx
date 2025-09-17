"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { createExportSketch } from "@/components/CanvasHost";
import type { ExportFormat } from "@/lib/recorder";
import { exportAnimation } from "@/lib/recorder";
import { useNotificationStore } from "@/store/useNotifications";
import { useExportHistory } from "@/store/useExportHistory";
import { useEditorStore } from "@/store/useEditor";

const FORMATS: { value: ExportFormat; label: string }[] = [
  { value: "webm", label: "WebM" },
  { value: "gif", label: "GIF" },
  { value: "png", label: "PNG Frames" },
];

export function RecorderBar() {
  const width = useEditorStore((state) => state.width);
  const height = useEditorStore((state) => state.height);
  const fps = useEditorStore((state) => state.fps);
  const durationSec = useEditorStore((state) => state.durationSec);
  const enableWarnings = useEditorStore((state) => state.enableWarnings);
  const qualityMode = useEditorStore((state) => state.qualityMode);
  const toggleWarnings = useEditorStore((state) => state.toggleWarnings);
  const effectId = useEditorStore((state) => state.effectId);
  const params = useEditorStore((state) => state.params);
  const seed = useEditorStore((state) => state.seed);
  const background = useEditorStore((state) => state.background);
  const invert = useEditorStore((state) => state.invert);
  const setPlaying = useEditorStore((state) => state.setPlaying);

  const [format, setFormat] = useState<ExportFormat>("webm");
  const [status, setStatus] = useState<"idle" | "exporting" | "done" | "error" | "cancelled">("idle");
  const [progress, setProgress] = useState({ frame: 0, total: 0 });
  const [message, setMessage] = useState<string>("");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [filename, setFilename] = useState<string>("");
  const abortRef = useRef<AbortController | null>(null);
  const addNotification = useNotificationStore((state) => state.addNotification);
  const historyEntries = useExportHistory((state) => state.entries);
  const addHistoryEntry = useExportHistory((state) => state.addEntry);
  const removeHistoryEntry = useExportHistory((state) => state.removeEntry);
  const clearHistory = useExportHistory((state) => state.clear);

  useEffect(() => {
    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  const totalFrames = useMemo(() => {
    return Math.max(1, Math.round(durationSec * Math.max(1, fps)));
  }, [durationSec, fps]);

  const estimatedSeconds = useMemo(() => totalFrames / Math.max(1, fps), [totalFrames, fps]);
  const totalPixels = width * height;
  const frameComplexity = totalPixels * totalFrames;
  const warnLarge = enableWarnings && (frameComplexity > 80_000_000 || totalFrames > 600);
  const gifNotice =
    format === "gif"
      ? "GIF export uses a 1-bit monochrome palette; large clips may take longer to encode."
      : null;

  const startExport = async () => {
    if (status === "exporting") return;

    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }

    if (enableWarnings && frameComplexity > 160_000_000 && qualityMode === "preview") {
      addNotification(
        "Export is very heavy. Switch to render mode or adjust size/fps.",
        "error",
      );
      return;
    }

    setPlaying(false);
    setStatus("exporting");
    setMessage("Preparing export …");
    setProgress({ frame: 0, total: totalFrames });

    const controller = new AbortController();
    abortRef.current = controller;
    const startedAt = performance.now();

    try {
      const result = await exportAnimation({
        format,
        width,
        height,
        fps,
        totalFrames,
        createSketch: async (container) =>
          createExportSketch(
            {
              width,
              height,
              fps,
              durationSec,
              effectId,
              params,
              seed,
              background,
              invert,
            },
            container,
          ),
        onProgress: (frame, total) => {
          setProgress({ frame: frame + 1, total });
          setMessage(`Rendering ${frame + 1}/${total}`);
        },
        signal: controller.signal,
        onInfo: ({ stage, detail }) => {
          setMessage(detail ?? stage);
        },
      });

      const url = URL.createObjectURL(result.blob);
      setDownloadUrl(url);
      setFilename(result.filename);
      setStatus("done");
      setMessage("Export ready");
      addNotification(`${format.toUpperCase()} export ready (${result.filename})`, "success");

      const historyUrl = URL.createObjectURL(result.blob);
      addHistoryEntry({
        format,
        filename: result.filename,
        url: historyUrl,
        sizeBytes: result.blob.size,
        createdAt: Date.now(),
        durationMs: performance.now() - startedAt,
      });

      // Auto-download for webm/gif so the user immediately gets the file
      if (format !== "png") {
        triggerDownload(url, result.filename);
      }
    } catch (error) {
      if ((error as Error)?.name === "AbortError") {
        setStatus("cancelled");
        setMessage("Export cancelled");
        setProgress({ frame: 0, total: totalFrames });
        addNotification("Export cancelled", "info");
      } else {
        console.error(error);
        setStatus("error");
        const errorMessage =
          error instanceof Error ? error.message : "Export failed. Check console for details.";
        setMessage(errorMessage);
        addNotification(errorMessage, "error");
      }
    }
    finally {
      abortRef.current = null;
    }
  };

  const triggerDownload = (url: string, name: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadClick = () => {
    if (downloadUrl && filename) {
      triggerDownload(downloadUrl, filename);
    }
  };

  const handleHistoryDownload = (entryUrl: string, entryFilename: string) => {
    triggerDownload(entryUrl, entryFilename);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const handleCancel = () => {
    abortRef.current?.abort();
  };

  const disabled = status === "exporting";
  return (
    <section className="flex flex-col gap-3 border border-ink bg-paper px-4 py-3 uppercase tracking-[0.12em]">
     <div className="flex flex-wrap items-center gap-4 text-xs">
       <div className="flex flex-col gap-1">
         <span className="text-[11px] tracking-[0.2em] opacity-80">Format</span>
          <select
            value={format}
            onChange={(event) => setFormat(event.target.value as ExportFormat)}
            className="border border-ink bg-paper px-3 py-2"
          >
            {FORMATS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[11px] tracking-[0.2em] opacity-80">Frames</span>
          <span className="border border-ink px-3 py-2 text-xs normal-case">
            {totalFrames} @ {fps} FPS ({estimatedSeconds.toFixed(1)}s)
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[11px] tracking-[0.2em] opacity-80">Warnings</span>
          <button
            type="button"
            onClick={toggleWarnings}
            className={`border border-ink px-3 py-2 text-xs ${
              enableWarnings ? "bg-paper" : "bg-ink text-paper"
            }`}
          >
            {enableWarnings ? "On" : "Off"}
          </button>
        </div>
      
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={startExport}
          disabled={disabled}
          className={`border border-ink px-4 py-2 text-xs font-semibold ${
            disabled ? "opacity-60" : "hover:bg-ink hover:text-paper"
          }`}
        >
          {status === "exporting" ? "Exporting …" : "Start Export"}
        </button>
        {status === "exporting" && (
          <button
            type="button"
            onClick={handleCancel}
            className="border border-ink px-3 py-2 text-xs hover:bg-alert hover:text-paper"
          >
            Cancel
          </button>
        )}
        {downloadUrl && (
          <button
            type="button"
            onClick={handleDownloadClick}
            className="border border-ink px-3 py-2 text-xs hover:bg-ink hover:text-paper"
          >
            Download
          </button>
        )}
      </div>
    </div>

    {(warnLarge || gifNotice) && (
      <div className="border border-dashed border-ink px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-alert">
        {warnLarge && <span>Warning · Large export may take a while ({totalFrames} frames)</span>}
        {warnLarge && gifNotice && <span className="mx-2">·</span>}
        {gifNotice && <span>{gifNotice}</span>}
      </div>
    )}

    {historyEntries.length > 0 && (
      <div className="border border-ink bg-paper px-3 py-2 text-xs uppercase tracking-[0.12em]">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-semibold">Recent exports</span>
          <button
            type="button"
            onClick={clearHistory}
            className="border border-ink px-2 py-1 text-[10px] hover:bg-ink hover:text-paper"
          >
            Clear
          </button>
        </div>
        <ul className="flex flex-col gap-1">
          {historyEntries.map((entry) => (
            <li
              key={entry.id}
              className="flex flex-wrap items-center gap-2 border border-ink bg-paper px-2 py-1"
            >
              <span className="flex-1 text-[10px] uppercase tracking-[0.2em]">
                {entry.format.toUpperCase()} · {entry.filename} · {formatSize(entry.sizeBytes)} ·
                {" "}
                {(entry.durationMs / 1000).toFixed(1)}s
              </span>
              <button
                type="button"
                onClick={() => handleHistoryDownload(entry.url, entry.filename)}
                className="border border-ink px-2 py-1 text-[10px] hover:bg-ink hover:text-paper"
              >
                Download
              </button>
              <button
                type="button"
                onClick={() => removeHistoryEntry(entry.id)}
                className="border border-ink px-2 py-1 text-[10px] hover:bg-alert hover:text-paper"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>
    )}

    <div className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.2em]">
      <span>Status · {status === "idle" ? "Idle" : message || status}</span>
      {status === "exporting" && (
        <span>
          Progress · {progress.frame}/{progress.total}
        </span>
      )}
      {status === "done" && downloadUrl && (
        <span>Ready · {filename}</span>
      )}
      {status === "cancelled" && <span>Cancelled</span>}
      {status === "error" && (
        <span className="text-alert">Export failed</span>
      )}
    </div>
  </section>
  );
}
