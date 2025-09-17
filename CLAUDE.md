# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BW Animator is a monochrome animation editor built with Next.js 15, p5.js, and Tailwind v4. It creates deterministic black-and-white generative animations with effects like Square Drift, ASCII Dither, Cellular Automata, and Scanline Reveal. The app exports to WebM, GIF, and PNG sequences.

## Development Commands

- `npm run dev` - Start development server (opens at http://localhost:3000/editor)
- `npm run build` - Production build
- `npm run start` - Run production server
- `npm run test` - Run Vitest test suite

## Architecture

### State Management
- **Zustand stores** handle all global state:
  - `useEditorStore` (`src/store/useEditor.ts`) - Main editor state (effects, params, canvas settings, playback)
  - `useNotifications` (`src/store/useNotifications.ts`) - Toast notifications
  - `useExportHistory` (`src/store/useExportHistory.ts`) - Export job tracking

### Effects System
- Effects are modular and located in `src/effects/`
- Each effect implements the `Effect` interface from `src/effects/types.ts`
- Effects registry in `src/effects/index.ts`
- All effects use deterministic RNG from `src/lib/rng.ts` for reproducible animations

### Key Components
- `CanvasHost` - p5.js instance wrapper with animation loop
- `ParamPanel` - Dynamic parameter controls generated from effect schemas
- `RecorderBar` - Export controls (WebM/GIF/PNG with progress tracking)
- `TopBar` - Effect selector and global controls (size, FPS, duration)
- `StatusBar` - Frame info and notification access

### Export Pipeline
- **WebM**: MediaRecorder API for browser-native recording
- **GIF**: gifenc library with monochrome palette and dithering
- **PNG**: Frame-by-frame capture packaged as ZIP download
- Quality modes: "preview" (scaled/reduced FPS) vs "render" (full quality)

## Code Conventions

### File Organization
- Effects: `src/effects/[effectName].ts`
- Components: `src/components/[ComponentName].tsx`
- Stores: `src/store/use[StoreName].ts`
- Utilities: `src/lib/[utilName].ts`

### Effect Implementation
Effects must implement:
```typescript
interface Effect {
  id: string;
  name: string;
  params: ParamSchema[];
  defaults: ParamValues;
  init: (p: P5, state: EffectState) => void;
  update: (p: P5, state: EffectState) => void;
  render: (p: P5, state: EffectState) => void;
}
```

### State Updates
- Use Zustand actions for state mutations
- Sanitize numeric inputs (see `sanitizeDimension`, `sanitizeFps` in `useEditorStore`)
- Reset `currentFrame` to 0 when changing seeds or effects

### Testing
- Tests use Vitest + Testing Library
- Test setup in `vitest.setup.ts`
- Path alias `@` points to `src/`
- Current test coverage: RNG utilities, stores, notification system

## Important Implementation Details

### Deterministic Rendering
- All effects use seeded RNG (`src/lib/rng.ts`) for reproducible output
- Frame-based time calculation ensures consistent playback
- Quality mode affects canvas scale and FPS but preserves determinism

### Performance Considerations
- Preview mode reduces canvas resolution and FPS for responsiveness
- Large export warnings (>160M pixel frames) in preview mode
- Effects should minimize allocations in render loops

### Export Limitations
- GIF exports use monochrome palette with dithering
- PNG ZIP doesn't auto-download (requires manual trigger)
- WebM auto-downloads where MediaRecorder is supported

## Key Files to Review

When working on effects: `src/effects/types.ts`, `src/effects/index.ts`
When working on UI: `src/store/useEditor.ts`, component files in `src/components/`
When working on exports: `src/lib/recorder.ts`, `src/components/RecorderBar.tsx`
When working on tests: `vitest.config.ts`, existing test files in project