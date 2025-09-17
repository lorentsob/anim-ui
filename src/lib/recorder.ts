import type p5 from "p5";
import { AppError, createExportError, withRetry, withPerformanceMonitoring, errorManager } from "./errorHandling";

export type ExportFormat = "webm" | "gif" | "png";

export type RecorderOptions = {
  format: ExportFormat;
  width: number;
  height: number;
  fps: number;
  totalFrames: number;
  createSketch: (container: HTMLDivElement) => Promise<p5>;
  onProgress?: (frame: number, total: number) => void;
  onFrame?: (frame: number, total: number) => void | Promise<void>;
  signal?: AbortSignal;
  onInfo?: (info: { stage: string; detail?: string }) => void;
};

type RecorderResult = {
  blob: Blob;
  filename: string;
  mimeType: string;
};

export async function exportAnimation({
  format,
  width,
  height,
  fps,
  totalFrames,
  createSketch,
  onProgress,
  onFrame,
  signal,
  onInfo,
}: RecorderOptions): Promise<RecorderResult> {
  if (totalFrames <= 0) {
    throw createExportError("export-validation", new Error("Total frames must be > 0"), { totalFrames });
  }

  if (width <= 0 || height <= 0) {
    throw createExportError("export-validation", new Error("Width and height must be > 0"), { width, height });
  }

  if (fps <= 0) {
    throw createExportError("export-validation", new Error("FPS must be > 0"), { fps });
  }

  try {
    return await withPerformanceMonitoring(async () => {
      if (format === "webm") {
        return exportWebm({
          format,
          width,
          height,
          fps,
          totalFrames,
          createSketch,
          onProgress,
          onFrame,
          signal,
          onInfo,
        });
      }

      if (format === "gif") {
        return exportGif({
          format,
          width,
          height,
          fps,
          totalFrames,
          createSketch,
          onProgress,
          onFrame,
          signal,
          onInfo,
        });
      }

      return exportPngZip({
        format,
        width,
        height,
        fps,
        totalFrames,
        createSketch,
        onProgress,
        onFrame,
        signal,
        onInfo,
      });
    }, `export-${format}`, 30000);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw createExportError(`export-${format}`, error as Error, { format, width, height, fps, totalFrames });
  }
}

async function exportWebm({
  format: _format,
  width,
  height,
  fps,
  totalFrames,
  createSketch,
  onProgress,
  onFrame,
  signal,
  onInfo,
}: RecorderOptions): Promise<RecorderResult> {
  onInfo?.({ stage: "setup", detail: "Preparing WebM recorder" });
  const container = document.createElement("div");
  container.style.width = `${width}px`;
  container.style.height = `${height}px`;
  container.style.position = "fixed";
  container.style.top = "0";
  container.style.left = "0";
  container.style.pointerEvents = "none";
  container.style.opacity = "0";
  document.body.appendChild(container);

  const sketch = await createSketch(container);
  onInfo?.({ stage: "setup", detail: "Sketch ready" });
  const canvas = await waitForCanvas(sketch, container);

  // ensure even dimensions for webm
  const captureWidth = width % 2 === 0 ? width : width - 1;
  const captureHeight = height % 2 === 0 ? height : height - 1;
  if (captureWidth !== width || captureHeight !== height) {
    canvas.width = captureWidth;
    canvas.height = captureHeight;
    canvas.style.width = `${captureWidth}px`;
    canvas.style.height = `${captureHeight}px`;
  }

  const stream = canvas.captureStream(fps);
  if (typeof MediaRecorder === "undefined") {
    throw createExportError("webm-browser-support", new Error("MediaRecorder API not available in this browser."),
      { userAgent: navigator.userAgent });
  }

  // Check if VP9 codec is supported
  if (!MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) {
    console.warn("VP9 codec not supported, falling back to default codec");
  }

  const recorder = new MediaRecorder(stream, {
    mimeType: "video/webm;codecs=vp9",
    videoBitsPerSecond: 5_000_000,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) {
      chunks.push(event.data);
    }
  };

  const resultPromise = new Promise<RecorderResult>((resolve, reject) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      resolve({
        blob,
        mimeType: "video/webm",
        filename: `bw-animator-${Date.now()}.webm`,
      });
      onInfo?.({ stage: "completed" });
      cleanup();
    };
    recorder.onerror = (event) => {
      const error = createExportError("webm-recording",
        new Error(`Recorder error: ${event.error?.name ?? "unknown"}`),
        { errorName: event.error?.name, errorMessage: event.error?.message });
      reject(error);
      onInfo?.({ stage: "error", detail: event.error?.message });
      cleanup();
    };
  });

  const abortHandler = () => {
    if (recorder.state === "recording") {
      recorder.stop();
    }
  };
  signal?.addEventListener("abort", abortHandler, { once: true });

  recorder.start();
  onInfo?.({ stage: "recording", detail: "Capturing frames" });

  let resolvedResult: RecorderResult | null = null;

  try {
    await renderFrames(sketch, totalFrames, fps, onProgress, onFrame, signal);
    recorder.stop();
    resolvedResult = await resultPromise;
    return resolvedResult;
  } finally {
    signal?.removeEventListener("abort", abortHandler);
    if (recorder.state === "recording") {
      recorder.stop();
    }
    if (!resolvedResult) {
      try {
        resolvedResult = await resultPromise;
      } catch (err) {
        // ignore errors here; upstream will handle original throw
      }
    }
    cleanup();
  }

  function cleanup() {
    stream.getTracks().forEach((track) => track.stop());
    sketch.remove();
    container.remove();
  }
}

async function exportGif({
  format: _format,
  width,
  height,
  fps,
  totalFrames,
  createSketch,
  onProgress,
  onFrame,
  signal,
  onInfo,
}: RecorderOptions): Promise<RecorderResult> {
  const { GIFEncoder } = await import("gifenc");
  onInfo?.({ stage: "setup", detail: "Preparing GIF encoder" });

  const container = document.createElement("div");
  container.style.width = `${width}px`;
  container.style.height = `${height}px`;
  container.style.position = "fixed";
  container.style.top = "0";
  container.style.left = "0";
  container.style.pointerEvents = "none";
  container.style.opacity = "0";
  document.body.appendChild(container);

  const sketch = await createSketch(container);
  onInfo?.({ stage: "setup", detail: "Sketch ready" });
  const canvas = await waitForCanvas(sketch, container);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw createExportError("gif-canvas-context",
      new Error("Failed to access 2D context for GIF export"),
      { canvasWidth: canvas.width, canvasHeight: canvas.height });
  }

  const encoder = GIFEncoder();
  const delay = Math.round(1000 / Math.max(1, fps));

  let paletteInfo: MonochromePalette | null = null;
  const useMultiTone = true;
  const ditherStrength = 0.4;

  try {
    await renderFrames(
      sketch,
      totalFrames,
      fps,
      (frame, total) => {
        onProgress?.(frame, total);
        if (frame === 0) {
          onInfo?.({ stage: "encoding", detail: "Rendering frames" });
        }
      },
      async (frame, total) => {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        if (!paletteInfo) {
          paletteInfo = derivePalette(imageData.data, useMultiTone ? 4 : 2);
        }
        const indexData = applyPaletteWithDither(
          imageData.data,
          paletteInfo.colors,
          canvas.width,
          canvas.height,
          ditherStrength,
        );
        const palette = paletteInfo.colors;
        encoder.writeFrame(indexData, canvas.width, canvas.height, {
          palette,
          delay,
        });
        await onFrame?.(frame, total);
      },
      signal,
    );

    encoder.finish();
    onInfo?.({ stage: "finalizing", detail: "Generating GIF binary" });

    const bytesView = encoder.bytesView();
    const bufferCopy = new Uint8Array(bytesView.length);
    bufferCopy.set(bytesView);
    const blob = new Blob([bufferCopy.buffer], { type: "image/gif" });

    return {
      blob,
      mimeType: "image/gif",
      filename: `bw-animator-${Date.now()}.gif`,
    };
  } finally {
    sketch.remove();
    container.remove();
  }
}

async function exportPngZip({
  format: _format,
  width,
  height,
  fps,
  totalFrames,
  createSketch,
  onProgress,
  onFrame,
  signal,
  onInfo,
}: RecorderOptions): Promise<RecorderResult> {
  const { default: JSZip } = await import("jszip");
  onInfo?.({ stage: "setup", detail: "Preparing ZIP export" });

  const container = document.createElement("div");
  container.style.width = `${width}px`;
  container.style.height = `${height}px`;
  container.style.position = "fixed";
  container.style.top = "0";
  container.style.left = "0";
  container.style.pointerEvents = "none";
  container.style.opacity = "0";
  document.body.appendChild(container);

  const sketch = await createSketch(container);
  onInfo?.({ stage: "setup", detail: "Sketch ready" });
  const canvas = await waitForCanvas(sketch, container);

  const zip = new JSZip();

  try {
    await renderFrames(
      sketch,
      totalFrames,
      fps,
      (frame, total) => {
        onProgress?.(frame, total);
        if (frame === 0) {
          onInfo?.({ stage: "encoding", detail: "Rendering PNG frames" });
        }
      },
      async (frame, total) => {
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob((result) => resolve(result), "image/png"),
        );
        if (blob) {
          zip.file(`frame-${String(frame + 1).padStart(4, "0")}.png`, blob);
          onInfo?.({
            stage: "encoding",
            detail: `Captured frame ${frame + 1}/${total} (${(((frame + 1) / total) * 100).toFixed(0)}%)`,
          });
        }
        await onFrame?.(frame, total);
      },
      signal,
    );

    onInfo?.({ stage: "finalizing", detail: "Compressing ZIP" });
    const start = Date.now();
    const zipBlob = await zip.generateAsync(
      { type: "blob" },
      ({ percent }) => {
        const elapsed = (Date.now() - start) / 1000;
        const eta = percent > 0 ? (elapsed / (percent / 100)) - elapsed : 0;
        onInfo?.({
          stage: "finalizing",
          detail: `Compressing ZIP ${percent.toFixed(0)}% (ETA ${eta.toFixed(1)}s)`,
        });
      },
    );

    return {
      blob: zipBlob,
      mimeType: "application/zip",
      filename: `bw-animator-${Date.now()}.zip`,
    };
  } finally {
    sketch.remove();
    container.remove();
  }
}

async function renderFrames(
  sketch: p5,
  totalFrames: number,
  fps: number,
  onProgress?: (frame: number, total: number) => void | Promise<void>,
  onFrame?: (frame: number, total: number) => void | Promise<void>,
  signal?: AbortSignal,
) {
  const render = (sketch as unknown as { renderFrame?: (frame: number) => void }).renderFrame;
  const delayMs = Math.max(1, Math.floor(1000 / Math.max(1, fps)));

  for (let frameIndex = 0; frameIndex < totalFrames; frameIndex += 1) {
    if (signal?.aborted) {
      throw createAbortError();
    }
    render?.(frameIndex);
    await onFrame?.(frameIndex, totalFrames);
    await onProgress?.(frameIndex, totalFrames);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}

function createAbortError(): Error {
  const error = new Error("Export cancelled");
  error.name = "AbortError";
  return error;
}

async function waitForCanvas(sketch: p5, container: HTMLElement): Promise<HTMLCanvasElement> {
  const fromSketch = (sketch as unknown as { canvas?: HTMLCanvasElement }).canvas;
  if (fromSketch) return fromSketch;
  const fromDom = container.querySelector("canvas") as HTMLCanvasElement | null;
  if (fromDom) return fromDom;
  for (let i = 0; i < 10; i += 1) {
    await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
    const retrySketch = (sketch as unknown as { canvas?: HTMLCanvasElement }).canvas;
    if (retrySketch) return retrySketch;
    const retryDom = container.querySelector("canvas") as HTMLCanvasElement | null;
    if (retryDom) return retryDom;
  }
  throw createExportError("canvas-creation",
    new Error("Failed to create recording canvas after multiple attempts"),
    { retryAttempts: 10 });
}

type MonochromePalette = {
  colors: number[][];
};

function derivePalette(data: Uint8ClampedArray, steps: number): MonochromePalette {
  const values: number[] = [];
  for (let i = 0; i < data.length; i += 4) {
    const lum = data[i];
    values.push(lum);
  }
  values.sort((a, b) => a - b);
  const colors: number[][] = [];
  for (let s = 0; s < steps; s += 1) {
    const idx = Math.floor((values.length - 1) * (s / (steps - 1)));
    const v = values[idx] ?? (s === 0 ? 0 : 255);
    colors.push([v, v, v]);
  }
  return { colors };
}

function applyPaletteWithDither(
  data: Uint8ClampedArray,
  palette: number[][],
  width: number,
  height: number,
  strength: number,
): Uint8Array {
  const totalPixels = width * height;
  const indexed = new Uint8Array(totalPixels);
  const error = new Float32Array(totalPixels);

  const clamp = (v: number) => Math.min(255, Math.max(0, v));

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = y * width + x;
      const lum = data[idx * 4];
      const adjusted = clamp(lum + error[idx]);
      let bestIndex = 0;
      let bestDistance = Infinity;
      for (let i = 0; i < palette.length; i += 1) {
        const value = palette[i][0];
        const dist = Math.abs(adjusted - value);
        if (dist < bestDistance) {
          bestDistance = dist;
          bestIndex = i;
        }
      }
      indexed[idx] = bestIndex;
      const quantized = palette[bestIndex][0];
      const err = (adjusted - quantized) * strength;
      if (x + 1 < width) error[idx + 1] += err * 0.5;
      if (y + 1 < height) error[idx + width] += err * 0.25;
      if (x > 0 && y + 1 < height) error[idx + width - 1] += err * 0.25;
    }
  }

  return indexed;
}
