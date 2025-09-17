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
- **Effect blending**: Multi-layer compositions with 6 professional blend modes (Normal, Multiply, Add, Subtract, XOR, Overlay).
- **Timeline & keyframes**: Visual timeline with parameter animation and smooth interpolation.
- **Custom parameters**: Advanced controls including Color, Vector2, Curve, and Range parameter types.
- **Effect library**: 11 effects including Square Drift, ASCII Dither, Cellular Automata, Orbiting Bars, Custom Demo.
- **AE-style scrubbing controls** for width/height/fps/duration and effect params.
- **Exports**: WebM (MediaRecorder), GIF (gifenc with monochrome palette + dither), PNG ZIP with progress/ETA.
- **Export history**: Re-download recent jobs, see file size + duration, clear entries (object URLs auto-revoked).
- **Notifications**: Toasts for exports, presets, and warnings with auto-dismiss.

## Quickstart

1. Choose an effect in the top bar (try "Custom Parameters Demo" for advanced controls).
2. **For simple animations**: Adjust parameters and export directly.
3. **For blended compositions**: Enable "Blending" to add multiple effect layers with blend modes.
4. **For keyframe animation**: Enable "Timeline" to animate parameters over time.
5. **For complex projects**: Use both blending and timeline together for sophisticated animations.
6. Save your favourite parameter sets as presets; use Share button for collaboration.

### Advanced Features
- **Blend Modes**: Try Multiply for shadows, Add for light effects, XOR for digital patterns
- **Custom Parameters**: Use Color pickers, Vector2 positioning, Curve editors, and Range controls
- **Timeline Animation**: Add keyframes with ● buttons, scrub timeline to preview animations

📖 **[Complete Week 8 Features Guide](docs/week8-features-guide.md)** - Detailed documentation for effect blending and custom parameters

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
- Current coverage: 121+ tests covering RNG utilities, stores, blending system, custom parameters, timeline integration.
- Test suites: Core functionality, effect blending, custom parameter types, timeline keyframes.

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
