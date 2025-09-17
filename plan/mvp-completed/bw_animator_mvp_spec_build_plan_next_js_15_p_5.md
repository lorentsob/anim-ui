# BW Animator – MVP Spec & Build Plan

Early-2000s-inspired, black-and-white generative animation editor built on Next.js App Router and p5.js. Lightweight, deterministic, seedable. Exports GIF, MP4, and PNG sequences. Canvas size, FPS, and duration are fully editable.

---

## Index

1. Product summary & goals
2. Current baseline audit
3. Non-goals & constraints
4. Tech stack (versions)
5. Architecture (modules & flows)
6. Effects system (API & determinism)
7. Global controls & state model
8. Export pipeline
9. UI spec (visual language)
10. Performance & optimization rules
11. Project structure blueprint
12. Implementation plan (phases)
13. Initial effect presets
14. Testing & QA checklist
15. Roadmap (MVP → v1.1)
16. Risks & mitigations
17. Acceptance criteria
18. Appendix – component stubs

---

## 1) Product summary & goals

**What it is**: A web editor to create ultra-simple black-and-white animations using p5.js “effects.” Each effect exposes parameters you tweak to generate variants. Strict monochrome, low CPU, small exports.

**Goals**

- Monochrome generative animations: squares, text, numbers, ASCII, cellular patterns.
- Live preview with deterministic playback (seed + frame-indexed time).
- Editable **canvas size**, **FPS**, **duration**, **seed**, **background**.
- Exports: **GIF**, **MP4**, **PNG frame sequence** (plus WebM fallback during MP4 encode).
- Clean UI with early-2000s vibe, not glossy startup style.
- Lightweight: minimal deps, lazy load heavy bits.

**Key principle**: Always install packages with the `@latest` tag to avoid stale versions during vibe coding.

---

## 2) Current baseline audit

- Project scaffolded with **Next.js 15.5.3** (App Router) via `create-next-app` + Tailwind preset.
- Uses **React 19.1.0** and **React DOM 19.1.0**; TypeScript and Tailwind v4 already configured.
- Default `/` route renders starter marketing page (`src/app/page.tsx`). No other routes/components exist yet.
- Global styles limited to `globals.css`; typography = Geist fonts pulled through Next font loader.
- No state management, no custom libs, no tests beyond Next defaults.
- Build scripts: `npm run dev`, `build`, `start`. Package manager: npm (lockfile present).
- Public assets: Next markers (`next.svg`, `vercel.svg`, `file.svg`, etc.). Replace once custom palette ready.

Implication: MVP implementation starts from a clean slate; we control routing, state, and theming decisions.

---

## 3) Non-goals & constraints

- No audio, no video/image uploads in MVP.
- No cloud accounts in MVP (LocalStorage only; optional Supabase gallery deferred).
- No color; strictly 1-bit look (allow monochrome invert only).
- No timeline editor beyond constant params (keyframes come later).
- Avoid server-side rendering of heavy exports; encoder work happens client-side only.

---

## 4) Tech stack (versions)

**Already in repo**

- `next@15.5.3`
- `react@19.1.0` / `react-dom@19.1.0`
- `typescript@^5`
- `tailwindcss@^4` (with `@tailwindcss/postcss@^4`)
- App Router with TypeScript + ESLint defaults from Next 15

**To add** (all with `@latest` during install)

- `p5` – rendering engine (instance mode)
- `zustand` – lightweight global store
- `zod` – param validation + coercion
- `ccapture.js` – GIF export helper (tree-shake by dynamic import)
- `@ffmpeg/ffmpeg` + `@ffmpeg/util` – wasm MP4 transcode (lazy-loaded)
- Optional: `@types/p5` for TypeScript hints if quality warrants (verify weight)
- `lucide-react` or custom SVGs for minimal iconography (monochrome friendly)
- Testing: `vitest` + `@testing-library/react` + `@testing-library/user-event` (optional but recommended)

**Tooling**

- Enforce deterministic RNG via utility (`seedrandom` alternative or custom LCG). Keep dependency count low; consider in-house LCG to avoid extra package.
- Tailwind config minimal; prefer CSS variables for theme tokens where possible.

---

## 5) Architecture (modules & flows)

**Routes**

- `/editor` – main workspace (MVP). Redirect `/` → `/editor` once ready.
- `/gallery` – simple preset viewer (post-MVP; keep stub for roadmap).

**Core modules**

- **Effect Registry**: list of effect modules exposing a common interface (init/update/render + metadata).
- **Renderer**: hosts the p5 instance, advances frames by index (fixed timestep) rather than delta time.
- **Store** (Zustand): current effect id, param values, global controls, playback state.
- **Param Panel**: auto-generates controls from effect schema using `ParamDef` definitions + Zod when necessary.
- **Recorder Service**: GIF (CCapture), WebM (MediaRecorder), MP4 (ffmpeg.wasm), PNG sequence (toBlob).
- **Persistence**: LocalStorage save/load of presets (global + per-effect params). Optional share-to-URL later.
- **Theming**: Tailwind tokens + CSS variables implementing monochrome aesthetic.

**Data flow**

```
ParamPanel ──► Store ──► Renderer (p5.init/update/render) ──► Canvas
                          ▼
                      Recorder (on demand) ──► Encoded files
```

---

## 6) Effects system (API & determinism)

**Effect contract** (`/effects/types.ts`)

```ts
export type ParamDef =
  | { key: string; type: "number" | "int"; label: string; min: number; max: number; step?: number }
  | { key: string; type: "boolean"; label: string }
  | { key: string; type: "select"; label: string; options: string[] }
  | { key: string; type: "text"; label: string }
  | { key: string; type: "seed"; label: string };

export interface EffectContext {
  rng: () => number; // deterministic RNG seeded per render
  setFrameDependency?: (key: string, value: unknown) => void; // optional future hook
}

export interface Effect {
  id: string;
  name: string;
  params: ParamDef[];
  defaults: Record<string, unknown>;
  init(p: p5, ctx: EffectContext, params: Record<string, unknown>): void;
  update(p: p5, ctx: EffectContext, t: number, frame: number, params: Record<string, unknown>): void;
  render(p: p5, ctx: EffectContext, t: number, frame: number, params: Record<string, unknown>): void;
}
```

**Determinism**

- Global `seed` string generates deterministic RNG instance exposed via `ctx.rng`.
- Time `t = frame / fps`; `frame` always integer. Never rely on real-time `deltaTime`.
- Avoid direct `Math.random`; optionally add ESLint rule to guard once lint config extended.
- Support effect hot-reload by re-running `init` when params requiring re-seed change.

**Param validation**

- Base validation via `ParamDef` constraints.
- Optional `z.object` schemas for complex interactions (e.g., ensuring width/height multiples) kept lightweight.

---

## 7) Global controls & state model

**Global controls**

- `width`, `height` (px) – free numeric inputs. Default `640 × 640`.
- `fps` – default `12`, min `6`, max `30` (warn >24 for performance).
- `durationSec` – default `6`, clamp to `12` for MVP to keep exports small.
- `seed` – string; empty triggers auto-generate + UI feedback.
- `background` – `'white' | 'black'`; `invert` checkbox flips draw color logic.
- `previewScale` – `'fit' | '1:1' | '2:1'` for display-only scaling.
- `playing` – boolean for playback state.
- `qualityMode` – `'preview' | 'render'` (optional; preview can skip expensive passes).

**Store shape** (`/store/useEditor.ts`)

```ts
interface EditorState {
  effectId: string;
  params: Record<string, unknown>;
  width: number;
  height: number;
  fps: number;
  durationSec: number;
  seed: string;
  background: "white" | "black";
  invert: boolean;
  previewScale: "fit" | "1:1" | "2:1";
  qualityMode: "preview" | "render";
  playing: boolean;
  setState: (partial: Partial<EditorState>) => void;
  setParam: (key: string, value: unknown) => void;
  resetParams: (effectId: string) => void;
}
```

---

## 8) Export pipeline

**General**

- Export renders effect headless for `totalFrames = fps * durationSec` using an offscreen canvas sized to `width × height`.
- When exporting, pause live preview and display progress modal/bar.

**GIF**

- Use `ccapture.js` with `format: 'gif'` and 2-color palette.
- Enforce size guardrails (warn when `width * height * fps * durationSec` exceeds threshold).

**WebM → MP4**

- Capture WebM via `MediaRecorder(canvas.captureStream(fps))` as fast path.
- For MP4, lazy-load `@ffmpeg/ffmpeg` + `@ffmpeg/util`, transcode WebM or PNG sequence to H.264.
- Provide fallback messaging when browser lacks wasm threads; allow user to download WebM directly.

**PNG sequence**

- Iterate frames, call `canvas.toBlob()`; accumulate and trigger ZIP download (Zip deferred to v1.1; MVP can download individually or use client-side packaging lib if light enough).

**Controls**

- Format select: GIF | WebM | MP4 | PNG Frames (MP4 uses WebM intermediate).
- Start/Stop with clear progress + cancel support (abort controller + cleanup).
- Display estimated size/time once ffmpeg loaded (approx based on frame count).

---

## 9) UI spec (visual language)

**Design intent**: early-2000s utilitarian web. Crisp 1px borders, monospace, minimal gray. Modern polish via spacing and consistent type rhythm.

**Typography**

- Base `font-mono` stack (use system monospace: `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas`).
- Base font size `14px`; small text `12px`.

**Colors**

- `paper`: `#ffffff`
- `ink`: `#000000`
- `line`: `#cfcfcf`
- Optional accent for errors/warnings: `#ff3333`

**Layout**

- **Top bar**: Effect select, Play/Pause, Seed randomize, FPS, Duration, Size (W×H), Background toggle, Invert, Export button cluster.
- **Left**: Canvas area (centered, aspect locked), optional 8×8 checkerboard background for transparency preview.
- **Right**: Param panel auto-generated from `ParamDef` definitions.
- **Bottom status**: frame index, elapsed time, render mode, memory usage hints.

**Interaction rules**

- No rounded corners, no shadows, no gradients.
- Hover states: underline text links or invert background to `ink` with `paper` text.
- Inputs use 1px `ink` borders; focus state inverts border/background.
- Buttons mimic old-school toolbars (icon + label, 1px border, no glow).

**Tailwind tokens**

```ts
// tailwind.config.ts (extend section)
export default {
  theme: {
    extend: {
      colors: { ink: "#000000", paper: "#ffffff", line: "#cfcfcf", alert: "#ff3333" },
      fontFamily: { mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"] },
      fontSize: { xs: "12px", sm: "13px", base: "14px" },
      spacing: { 1: "4px", 1.5: "6px", 2: "8px", 3: "12px", 4: "16px", 6: "24px" },
      borderRadius: { none: "0px" },
    },
  },
};
```

---

## 10) Performance & optimization rules

- Default canvas `640 × 640`; scale display via CSS to avoid re-rendering at different sizes.
- Hard cap `fps ≤ 30`; show warning above 24 or durations longer than 8s.
- Use integer math, quantization, and precomputed buffers wherever possible for crisp pixels.
- Pre-render ASCII glyph atlases or dithering lookup tables once per init.
- Cellular automata and dithering operate on `Uint8Array` buffers + bitwise operations for speed.
- Implement `Preview` vs `Render` quality toggles (e.g., skip noise jitter or reduce resolution during preview).
- Lazy-load ffmpeg bundles only when MP4 export triggered; show skeleton while loading (~20 MB download).
- Debounce parameter changes to avoid reinitializing p5 more often than necessary.

---

## 11) Project structure blueprint

```
/src
  /app
    layout.tsx
    page.tsx             // redirect to /editor once built
    /editor
      page.tsx
  /components
    CanvasHost.tsx
    ParamPanel.tsx
    TopBar.tsx
    RecorderBar.tsx
    StatusBar.tsx
    NumberInput.tsx      // shared UI atoms
    ToggleButton.tsx
  /effects
    index.ts
    types.ts
    asciiDither.ts
    squareDrift.ts
    cellular1D.ts
    scanlineReveal.ts
  /lib
    rng.ts
    ffmpegLoader.ts
    recorder.ts
    storage.ts
  /store
    useEditor.ts
  /styles
    tokens.css           // optional CSS variables for theme
/tests
  canvasHost.test.tsx
  rng.test.ts
```

---

## 12) Implementation plan (phases)

**Phase 0 – Project hygiene & setup**

- Remove starter content (`src/app/page.tsx` marketing markup) and route `/` → `/editor`.
- Configure Tailwind tokens (colors, fonts, spacing) + ensure global `font-mono` default.
- Add helper utility for deterministic RNG (either custom LCG or tiny libs).
- Set up ESLint rules for project (extend Next config, optionally add custom rule to ban `Math.random`).

**Phase 1 – State & seeds**

- Install and configure `zustand` store with global controls + effect params.
- Implement seed generator utility (random string) + deterministic RNG factory.
- Provide hooks for reading/writing store slices (`useEditor` selectors, `useEffectParams`).

**Phase 2 – Effect system foundation**

- Define `ParamDef`, `EffectContext`, `Effect` interfaces and registry helpers.
- Scaffold effect modules with placeholder `render` implementations to validate flow.
- Build default parameter map initializer + `resetParams` logic when switching effects.

**Phase 3 – CanvasHost (p5 integration)**

- Create `CanvasHost` component that mounts p5 in instance mode, handles lifecycle.
- Implement fixed timestep loop (accumulator using `requestAnimationFrame` and fps target).
- Wire store changes (globals + params) to reinitialize effect or update state.
- Provide callbacks for `playing` state (start/stop) and manual frame stepping.

**Phase 4 – UI shell**

- Layout `/editor` page with CSS grid: canvas area, param panel, top tools, status bar.
- Build `TopBar` controls (effect selection, play/pause, randomize seed, width/height/fps/duration inputs, background/invert toggles, export trigger).
- Implement `ParamPanel` to autogenerate controls from `ParamDef` definitions (number, select, boolean, text, seed).
- Add `StatusBar` with frame/time readout, render mode, export warnings.
- Ensure keyboard focus order + accessible labels.

**Phase 5 – Export services**

- Implement `recorder.ts` orchestrating GIF/WebM/PNG flows with promise-based API.
- Hook into `CanvasHost` to run headless rendering for exports (pause preview, clone effect state).
- Integrate CCapture + MediaRecorder; add lazy `ffmpegLoader` for optional MP4 transcode.
- Surface progress + cancellation UI in `RecorderBar`.

**Phase 6 – Persistence & presets**

- Add `storage.ts` with LocalStorage guard + schema (persist effect id, globals, params).
- Provide save slot management UI (save, load, delete) with timestamp + name.
- Optionally encode config into URL hash for quick sharing (defer if time tight).

**Phase 7 – Effect implementations**

- Implement four MVP effects per specs (Square Drift, ASCII Dither, Cellular Automata 1D, Scanline Reveal).
- Validate parameter ranges, ensure deterministic behavior using provided RNG.
- Add preview thumbnails or textual descriptors for selection dropdown.

**Phase 8 – Polish & QA**

- Replace placeholder fonts/assets with final monochrome branding.
- Audit responsiveness (fit on 1280×720 and 4K displays).
- Performance profiling: verify CPU usage at target settings, optimize loops.
- Update README with run instructions, feature list, export caveats.

---

## 13) Initial effect presets

### A) Square Drift (speckled arcs)

- Grid of small squares whose offsets driven by simplex/Perlin noise or radial fields; binary threshold for 1-bit look.
- Params: `gridCols` (8–256), `gridRows` (8–256), `step` (px size), `speed`, `noiseScale`, `radialBias`, `threshold` (0–1), `jitter` (0–1).
- Notes: compute base cell centers once; update per frame; draw filled rects snapped to integer pixels; allow optional jitter.

### B) ASCII Dither

- Procedural grayscale buffer mapped to glyphs by density; optional scroll on Y axis.
- Params: `cell` (6–24 px), `charset` (text), `contrast` (0.5–2), `gamma` (0.6–1.6), `jitter` (0–1), `scrollSpeed` (−2..2), `mode` (`threshold` | `ordered` | `floyd` approximation).
- Notes: pre-render glyph atlas to offscreen canvas; draw via `drawImage` for speed; ensure crisp pixel alignment.

### C) Cellular Automata 1D (Rule 30/110 etc.)

- Classic 1D CA stacked over time; wrap edges for tiling.
- Params: `rule` (0–255), `density` (0–1), `wrap` (bool), `stepsPerFrame` (1–8), `lineHeight` (1–3 px).
- Notes: use `Uint8Array`; bit ops for neighbor patterns; scroll vertically and reuse row buffers for efficiency.

### D) Scanline Reveal

- Moving band reveals or erases pattern; diagonal angle.
- Params: `bandWidth` (4–256), `angle` (0–180), `noise` (0–1), `repeat` (1–8), `mirror` (bool).
- Notes: compute signed distance from band center; threshold to 1-bit; overlay noise jitter for texture.

**Future (post-MVP)**

- Orbiting Bars, Ripple Quantized, Typographic Scatter (letters along guides), Sprite Sheet Importer.

---

## 14) Testing & QA checklist

- **Unit tests**
  - RNG utility returns deterministic sequences for identical seeds (`tests/rng.test.ts`).
  - Effect registry returns defaults and parameter sets correctly.
  - `storage.ts` gracefully handles missing LocalStorage (SSR) and corrupted payloads.
- **Component tests (Vitest + Testing Library)**
  - Store-driven controls update state and reflect in UI (TopBar, ParamPanel).
  - CanvasHost respects `playing` toggle (can simulate by spying on RAF handlers).
- **Integration smoke tests**
  - `/editor` route renders all major components without runtime errors in jsdom.
  - Effect switch resets params to defaults while preserving global controls.
- **Manual QA checklist**
  - ✅ Canvas playback at 12 fps for 6s, seed deterministic (compare two renders).
  - ✅ Export GIF/WebM at 640×640 × 6s; verify downloads and open locally.
  - ✅ Toggle invert/background updates preview instantly.
  - ✅ Preset save/load cycle works after page refresh.
  - ✅ Layout holds on 1280×720 laptop and 4K external monitor.
  - ✅ Browser coverage: Chrome, Firefox, Safari (check MediaRecorder support fallback messaging).
- **Performance checks**
  - Profile CPU usage with each effect at max recommended settings; adjust defaults if >70% on M1 baseline.
  - Validate ffmpeg wasm load time and cache size; surface progress indicator above 3s load.

---

## 15) Roadmap (MVP → v1.1)

- **MVP (current spec)**: Editor, 4 effects, global controls, GIF/WebM/PNG exports, LocalStorage presets.
- **v1**: ffmpeg MP4 flow polished (progress UI), shareable URLs, optional Supabase gallery with simple moderation, additional effects (Orbiting Bars, Typographic Scatter).
- **v1.1**: Simple keyframes for selected numeric params, zip PNG frames client-side, keyboard shortcuts, downloadable effect presets bundle.

---

## 16) Risks & mitigations

- **MP4 heavy in-browser** → lazy load ffmpeg; prefer WebM by default; warn on large durations before encode.
- **GIF file size** → enforce monochrome palette, cap fps/duration; suggest WebM/MP4 for long clips.
- **Font payload** → drop Geist fonts; use system monospace or tiny bitmap to stay lean.
- **Non-deterministic math** → seeded RNG + frame-based time; lint rule or runtime warning when `Math.random` detected.
- **Performance on low-end devices** → provide preview quality toggle; document recommended settings.
- **Wasm bundle size** → load ffmpeg only when MP4 selected; show CTA to download WebM if network slow.

---

## 17) Acceptance criteria

- Project runs on **Next.js 15.5.3** with App Router and React 19 without starter clutter.
- All new dependencies installed with `@latest` and used lazily where heavy.
- Editor loads deterministic p5 canvas; play/pause works at chosen FPS, frame index visible.
- User can change canvas `width × height`, FPS, duration, background, invert, and seed; changes reflected instantly.
- At least **4 effects** implemented and parameterized as specified; switching resets params correctly.
- Exports: **GIF**, **WebM**, and **PNG sequence** functioning in MVP; **MP4** available via optional ffmpeg transcode (allowed to beta flag if still heavy).
- UI matches early-2000s aesthetic: monochrome, 1px borders, monospace typography, no rounded corners or shadows.
- Presets can be saved/loaded via LocalStorage with seed + params; persists across reloads.
- Bundle remains lean; ffmpeg and other heavy libs loaded on demand only.
- Tests or manual QA checklist executed with documented results in repo (README or docs note).

---

## 18) Appendix – component stubs

```tsx
// /effects/index.ts
export const effects: Effect[] = [
  squareDrift,
  asciiDither,
  cellular1D,
  scanlineReveal,
];
export const getEffect = (id: string) =>
  effects.find((effect) => effect.id === id) ?? effects[0];
```

```tsx
// /components/CanvasHost.tsx (outline)
// - Mount p5 in instance mode, pass Effect + params from store
// - Drive time by frame index = Math.floor(elapsed * fps)
// - Expose imperative handle for Recorder to request headless render
```

```ts
// /lib/recorder.ts (outline)
// startExport({ format: 'gif' | 'webm' | 'mp4' | 'png', fps, width, height, totalFrames })
// - For mp4: record webm or frames, then ffmpeg.wasm transcode lazily
// - Provide cancel() to abort export early and clean resources
```

> Build lean, keep everything monochrome, and always prefer `@latest` packages during setup and CI to prevent stale versions during vibe-coding sessions.
