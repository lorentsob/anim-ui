# BW Animator – MVP

Monochrome, early-2000s-inspired animation editor built with Next.js 15, p5.js, and Tailwind v4. Craft generative black-and-white loops, tweak parameters live, and export to WebM, GIF, or PNG sequences.

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:3000/editor` to launch the workspace (root redirects automatically).

## Key Features

- **Deterministic playback** with seed-based RNG and Preview/Render quality toggle.
- **Effect presets**: Square Drift, ASCII Dither, Cellular Automata, Scanline Reveal, Orbiting Bars, Ripple Quantized.
- **AE-style scrubbing controls** for width/height/fps/duration and effect params.
- **Exports**: WebM (MediaRecorder), GIF (gifenc with monochrome palette + dither), PNG ZIP with progress/ETA.
- **Export history**: Re-download recent jobs, see file size + duration, clear entries (object URLs auto-revoked).
- **Notifications**: Toasts for exports, presets, and warnings with auto-dismiss.

## Quickstart

1. Choose an effect in the top bar (try Orbiting Bars / Ripple Quantized) and scrub parameters to taste.
2. Flip to Render mode when ready, then trigger an export (WebM/GIF/PNG).
3. Review the export history list for quick re-downloads or clear old jobs.
4. Save your favourite parameter sets as presets; toast log keeps a trail if needed.
5. Use the Share button to copy a base64 URL snapshot for teammates.

## Export Notes

- **Preview mode** reduces canvas scale and FPS for responsiveness; switch to Render mode for full-quality exports.
- Heavy jobs (>160M pixel frames) warn in Preview mode unless warnings are disabled.
- GIF output uses a multi-tone grayscale palette with light dithering to preserve gradients.
- PNG ZIP export reports capture progress and compression ETA; downloads don’t auto-trigger.
- WebM auto-downloads on completion where supported (MediaRecorder).

## Presets & History

- Save/apply/delete presets via the panel; entries persist via localStorage and emit toasts.
- Export history lists the latest jobs with size metadata and quick download/remove actions.

## Testing

- Vitest + Testing Library configured (`npm run test`).
- Current coverage: RNG utilities, notification store basics, editor store behaviour.

## QA & Roadmap

- QA matrix drafted in `plan/qa_matrix.md` covering Chrome/Firefox/Safari across macOS/Windows/Linux.
- Remaining MVP tasks tracked in `plan/project_tasks.md` (tests, README quickstart, notification enhancements).
- Deferred roadmap items: additional effects, MP4 via ffmpeg.wasm, shareable URLs, keyframes.

## Scripts

- `npm run dev` – start local dev server
- `npm run build` – production build
- `npm run start` – run production server
- `npm run test` – run Vitest suite

## License

MIT (see `LICENSE`).
