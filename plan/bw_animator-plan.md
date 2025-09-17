# BW Animator – MVP Spec & Build Plan

Early‑2000s‑inspired, black‑and‑white generative animation editor built on Next.js App Router and p5.js. Lightweight, deterministic, seedable. Exports GIF, MP4, and PNG sequences. Canvas size, FPS, and duration are fully editable.

---

## Index

1. Product summary & goals
2. Non‑goals & constraints
3. Tech stack (versions)
4. Architecture (modules, data flow)
5. Effects system (API, schema, determinism)
6. Global controls & parameter model
7. Exports (GIF, MP4, PNG)
8. UI spec (2000s aesthetic + tokens)
9. Performance & optimization rules
10. Project structure
11. Implementation steps (MVP)
12. Initial effect presets
13. Testing & QA checklist
14. Roadmap (MVP → v1.1)
15. Risks & mitigations
16. Acceptance criteria

---

## 1) Product summary & goals

**What it is**: A web editor to create ultra‑simple black‑and‑white animations using p5.js “effects.” Each effect exposes parameters you tweak to generate variants. Strict monochrome, low CPU, small exports.

**Goals**

- Monochrome generative animations: squares, text, numbers, ASCII, cellular patterns.
- Live preview with deterministic playback (seed + frame‑indexed time).
- Editable **canvas size**, **FPS**, **duration**, **seed**, **background**.
- Exports: **GIF**, **MP4**, **PNG frame sequence**.
- Clean UI with early‑2000s vibe, not glossy startup style.
- Lightweight: minimal deps, lazy load heavy bits.

**Key principle**: Always install packages with the **latest** tag to avoid stale versions during vibe coding.

---

## 2) Non‑goals & constraints

- No audio, no video/image uploads in MVP.
- No cloud accounts in MVP (LocalStorage only; add Supabase later).
- No color; strictly 1‑bit look (allow invert only).
- No timeline editor beyond constant params (keyframes can come later).

---

## 3) Tech stack (versions)

**Core**

- **Project is configured with Next.js 15 (latest) using the App Router.**
- **React 18**, **TypeScript**, **Tailwind CSS** (use `@latest` when adding or updating packages).
- **p5.js** in instance mode (`p5@latest`).
- **Zustand** state (`zustand@latest`).
- **Zod** for param validation (`zod@latest`).
- **Export**: `ccapture.js@latest` (GIF), `@ffmpeg/ffmpeg@latest` + `@ffmpeg/util@latest` (MP4 via wasm, lazy‑loaded), native **MediaRecorder** for WebM fallback, PNG frames via `toDataURL`/`toBlob`.

**Why this stack**

- App Router is the current, optimized Next path.
- p5.js is perfect for simple, deterministic, canvas‑based sketches.
- Minimal libraries to keep bundle size low; heavy encoders are lazy‑loaded only for export.

## 4) Architecture (modules, data flow) (modules, data flow)

**Routes**

- `/editor` – main workspace (MVP).
- `/gallery` – optional simple preset viewer (v1).

**Core modules**

- **Effect Registry**: list of effect modules exposing a common interface.
- **Renderer**: hosts the p5 instance, advances frames by index, not delta time.
- **Store** (Zustand): current effect id, param values, global controls.
- **Param Panel**: auto‑generates controls from effect schema using Zod/ParamDef.
- **Recorder Service**: GIF (CCapture), WebM (MediaRecorder), MP4 (ffmpeg.wasm), PNG sequence.
- **Persistence**: LocalStorage save/load of presets. Optional URL‑encoded share later.

**Data flow**

```
ParamPanel → Store → Renderer (p5.init/update/render) → Canvas
                               ↘ Recorder (on demand) → Files
```

---

## 5) Effects system (API, schema, determinism)

**Effect contract** (`/effects/types.ts`)

```ts
export type ParamDef =
  | { key: string; type: 'number' | 'int'; label: string; min: number; max: number; step?: number }
  | { key: string; type: 'boolean'; label: string }
  | { key: string; type: 'select'; label: string; options: string[] }
  | { key: string; type: 'text'; label: string }
  | { key: string; type: 'seed'; label: string };

export interface Effect {
  id: string;
  name: string;
  params: ParamDef[];                  // for UI auto-build
  defaults: Record<string, unknown>;   // default values for params
  init(p: p5, params: Record<string, unknown>): void;            // per-run setup
  update(p: p5, t: number, frame: number, params: Record<string, unknown>): void; // state step
  render(p: p5, t: number, frame: number, params: Record<string, unknown>): void; // draw
}
```

**Determinism**

- Global `seed` string → seeded RNG instance passed to effects in `init`.
- Time `t` = `frame / fps`; frame always integer. No reliance on real‑time `deltaTime`.
- Avoid non‑deterministic APIs (e.g., `Math.random`) inside effects; use provided RNG.

**Param validation**

- Optional Zod schemas per effect for advanced constraints. Minimal for MVP to keep weight low.

---

## 6) Global controls & parameter model

**Global**

- `width`, `height` (px) – free inputs for **custom resolution**. Default `640 × 640`.
- `fps` – default `12`, min `6`, max `30` (warn >24).
- `durationSec` – default `6` (cap 12 in MVP to keep exports small).
- `seed` – string; empty → generate and show.
- `bg` – `'white' | 'black'`; `invert` checkbox flips draw color.
- `previewQuality` – `'preview' | 'render'` (optional; preview can scale down or skip steps).

**Store shape** (`/store/useEditor.ts`)

```ts
{
  effectId: string,
  params: Record<string, unknown>,
  width: number, height: number,
  fps: number, durationSec: number,
  seed: string, bg: 'white' | 'black', invert: boolean,
  playing: boolean,
}
```

---

## 7) Exports (GIF, MP4, PNG)

**General**

- Export runs the effect headless for `durationSec * fps` frames at the selected `width×height`.
- During export we step frames deterministically and render to an **offscreen canvas**.

**GIF**

- Implementation: `ccapture.js` with `format: 'gif'`, 2‑color palette, fps = chosen fps.
- Constraints: keep duration small (<= 6–8s) or low fps; otherwise files balloon.

**WebM → MP4**

- Record raw WebM with `MediaRecorder(canvas.captureStream(fps))` as a fast preview export.
- For **MP4**, lazy‑load `@ffmpeg/ffmpeg` and transcode WebM or the PNG sequence to H.264.
- MP4 is heavier in browser; only load ffmpeg.wasm on demand.

**PNG Sequence**

- Save numbered frames (e.g., `frame_0001.png` ..). Optional in‑browser ZIP (v1.1).

**Controls**

- Format select: GIF | MP4 | PNG Frames.
- Start/Stop.
- Progress bar showing `currentFrame/total` and ETA.

---

## 8) UI spec (2000s aesthetic + tokens)

**Design intent**: early‑2000s utilitarian web. Crisp 1px borders, monospace, minimal gray. Modern polish via spacing and consistent type rhythm.

**Typography**

- `font-mono` system stack; base 13–14px.

**Colors**

- `paper`: `#ffffff`
- `ink`: `#000000`
- `line`: `#cfcfcf` (only divider)

**Layout**

- **Top bar**: Effect select, Play/Pause, Seed randomize, FPS, Duration, Size (W×H), BG, Invert, Export button.
- **Left**: Canvas area (centered), optional 8×8 checkerboard background.
- **Right**: Param panel auto‑generated from `ParamDef`.
- **Bottom status**: frame, time, memory, canvas scale (fit/1:1).

**Interaction rules**

- No rounded corners, no shadows, no gradients.
- Hover states: underline or invert background to `#000` with white text.
- Inputs are plain HTML with 1px `ink` borders.

**Tailwind tokens** (extend only what we need)

```ts
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: { ink: '#000000', paper: '#ffffff', line: '#cfcfcf' },
      fontSize: { xs:'12px', sm:'13px', base:'14px' },
      spacing: { 1: '4px', 1.5: '6px', 2: '8px', 3: '12px', 4: '16px' },
    },
  },
}
```

---

## 9) Performance & optimization rules

- Default canvas `640×640`; render offscreen at full res, scale preview via CSS.
- Hard cap: `fps ≤ 30`, show warning above 24.
- Use **integer math** and **quantization** to keep crisp pixels and save time.
- Precompute ASCII glyph bitmaps or atlases; avoid per‑frame layout.
- Cellular automata & dithering use `Uint8Array` buffers and bitwise ops.
- Toggle **Preview vs Render** quality (downscale or reduce steps in Preview).
- Lazy‑load `ffmpeg.wasm` only when MP4 export is selected.

---

## 10) Project structure

```
/app
  layout.tsx
  /editor/page.tsx
/components
  CanvasHost.tsx
  ParamPanel.tsx
  TopBar.tsx
  RecorderBar.tsx
/effects
  index.ts
  asciiDither.ts
  squareDrift.ts
  cellular1D.ts
  scanlineReveal.ts
  orbitBars.ts
  rippleQuant.ts
/lib
  rng.ts
  recorder.ts        // GIF/WebM/MP4/PNG logic
  ffmpegLoader.ts    // lazy load
/store
  useEditor.ts
/styles
  globals.css
```

---

## 11) Implementation steps (MVP)

**Step 0 – Baseline**

- The project already runs on **Next.js 15 (latest)** with the App Router.
- When adding or updating any dependency, use `@latest` to avoid stale versions.

**Step 1 – Store & global controls** – Store & global controls**

- Zustand store with `width`, `height`, `fps`, `durationSec`, `seed`, `bg`, `invert`, `effectId`, `params`, `playing`.
- Seed generator util with stable PRNG.

**Step 2 – Effect interface & registry**

- Implement `/effects/types.ts` (contract above).
- `/effects/index.ts` exports array and lookup by `id`.

**Step 3 – CanvasHost (p5 wrapper)**

- Instance mode.
- `init` once on mount; on param/global change, re‑init as needed.
- Frame index driven by requestAnimationFrame at chosen fps (fixed‑step accumulator).

**Step 4 – ParamPanel (auto UI)**

- Generate controls by `ParamDef` types.
- Basic input components: Number, Int, Boolean, Select, Text, Seed.

**Step 5 – TopBar & RecorderBar**

- TopBar: effect select, play/pause, seed randomize, width/height, fps, duration, bg, invert.
- RecorderBar: format select (GIF/MP4/PNG), Start/Stop, progress, file download.

**Step 6 – Export pipeline**

- Headless loop rendering `totalFrames = fps * durationSec`.
- GIF via CCapture.
- WebM via MediaRecorder; **optional** immediate MP4 transcode via ffmpeg.wasm.
- PNG via `toBlob` each frame.

**Step 7 – Persistence**

- Save/load presets to LocalStorage (effect id + globals + params).
- Optional: serialize to URL (base64 JSON) in v1.

**Step 8 – Ship 4 effects**

- `squareDrift`, `asciiDither`, `cellular1D`, `scanlineReveal` (specs below).

---

## 12) Initial effect presets (specs)

### A) Square Drift (speckled arcs)

- **Idea**: grid of small squares whose offsets are driven by simplex noise or radial fields; binary threshold for 1‑bit look.
- **Params**: `gridCols` (8–256), `gridRows` (8–256), `step` (px size), `speed`, `noiseScale`, `radialBias`, `threshold` (0–1), `jitter` (0–1).
- **Notes**: compute base cell centers once; update per frame; draw filled rects snapped to integer pixels.

### B) ASCII Dither

- **Idea**: sample a procedural grayscale buffer then map to glyphs by density; optional scroll.
- **Params**: `cell` (6–24 px), `charset` (text), `contrast` (0.5–2), `gamma` (0.6–1.6), `jitter` (0–1), `scrollSpeed` (−2..2), `mode` (threshold | ordered | FS approximated).
- **Notes**: pre‑render glyph atlas to an offscreen canvas; draw glyphs via `drawImage` for speed.

### C) Cellular Automata 1D (Rule 30/110 etc.)

- **Idea**: classic 1D CA stacked over time; wrap edges.
- **Params**: `rule` (0–255), `density` (0–1), `wrap` (bool), `stepsPerFrame` (1–8), `lineHeight` (1–3 px).
- **Notes**: use `Uint8Array`; bit ops for neighbor patterns; scroll vertically.

### D) Scanline Reveal

- **Idea**: moving band reveals or erases pattern; diagonal angle.
- **Params**: `bandWidth` (4–256), `angle` (0–180), `noise` (0–1), `repeat` (1–8), `mirror` (bool).
- **Notes**: compute signed distance from band center; threshold to 1‑bit.

### Future (v1)

- Orbiting Bars, Ripple Quantized, Typographic Scatter (letters around circle/line guides).

---

## 13) Testing & QA checklist

-

---

## 14) Roadmap (MVP → v1.1)

**MVP** (this spec)

- Editor, 4 effects, global controls, GIF/WebM/PNG exports, LocalStorage presets.

**v1**

- MP4 via ffmpeg.wasm official flow (with progress UI).
- Shareable URLs + optional Supabase public gallery.
- Add Orbiting Bars + Typographic Scatter effects.

**v1.1**

- Simple keyframes for 2–3 numeric params (start/end, linear).
- Zip PNG frames client‑side.
- Keyboard shortcuts.

---

## 15) Risks & mitigations

- **MP4 heavy in‑browser** → lazy load ffmpeg; prefer WebM in MVP; warn on large durations.
- **GIF file size** → enforce monochrome palette, cap FPS/duration, suggest WebM/MP4 for long clips.
- **Font payload** → use system monospace or a tiny embedded bitmap font only.
- **Non‑deterministic math** → seeded RNG + frame‑based time; lint rule to block `Math.random` in effects.

---

## 16) Acceptance criteria

- Project is configured with **Next.js 15 (latest)** and App Router.
- All dependencies added with `@latest`.
- Editor loads a p5 canvas; play/pause works deterministically at chosen FPS.
- User can change canvas `width×height`, FPS, duration, bg, invert, and seed.
- At least **4 effects** implemented and parameterized as specified.
- Exports: **GIF**, **WebM**, and **PNG sequence** working in MVP; **MP4** available or planned with lazy‑loaded ffmpeg (OK to ship in v1 if needed).
- UI matches early‑2000s aesthetic: monochrome, 1px borders, monospace, no rounded corners or shadows.
- Presets can be saved/loaded via LocalStorage.
- Bundle remains lean; heavy encoders loaded on demand only.

---

### Appendix B – Component stubs (sketch)

```tsx
// /effects/index.ts
export const effects: Effect[] = [squareDrift, asciiDither, cellular1D, scanlineReveal];
export const getEffect = (id: string) => effects.find(e => e.id === id) ?? effects[0];
```

```tsx
// /components/CanvasHost.tsx (outline)
// - Create p5 instance in instance mode
// - Drive time by frame index = Math.floor(elapsed * fps)
```

```ts
// /lib/recorder.ts (outline)
// startExport({format: 'gif'|'webm'|'mp4'|'png', fps, width, height, totalFrames})
// - For mp4: record webm or frames, then ffmpeg.wasm transcode lazily
```

> Build lean, keep everything monochrome, and always prefer `@latest` packages during setup and CI to prevent stale versions during vibe‑coding sessions.

