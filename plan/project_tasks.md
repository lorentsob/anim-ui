# BW Animator MVP – Task Checklist

Legend: `[x]` completed · `[ ]` pending · `[~]` in progress · `[>]` deferred

## Foundation

- [x] Scaffold Next.js 15 project with Tailwind v4
- [x] Replace starter layout with monochrome system fonts + tokens
- [x] Add Zustand store for editor globals and parameters
- [x] Implement deterministic RNG utilities
- [x] Redirect root route to `/editor` shell

## UI Shell & Controls

- [x] Build top bar with AE-style numeric scrubbing controls
- [x] Implement canvas host wrapper for p5 instance mode
- [x] Generate parameter panel from effect schema definitions
- [x] Add status bar showing frame/time/effect metadata
- [x] Create notification tray for toasts

## Effects & Renderer

- [x] Define effect contract and registry lookup
- [x] Implement `Square Drift` effect
- [x] Implement `ASCII Dither` effect
- [x] Implement `Cellular Automata` effect
- [x] Implement `Scanline Reveal` effect
- [x] Ensure effect state persists across init/update/render

## Presets & Persistence

- [x] Build localStorage-backed preset manager (save/apply/delete)
- [x] Wire preset actions into notification system

## Exports

- [x] Add recorder service with WebM export via MediaRecorder
- [x] Add GIF export using gifenc monochrome palette
- [x] Add PNG frame sequence export packaged as ZIP
- [x] Build recorder bar UI with progress display
- [x] Support cancellation for long-running exports
- [x] Surface export history / quick re-download options
- [x] Provide preflight warnings (duration/FPS caps) with user override controls
- [x] Implement preview vs render quality toggle

## UX Polish

- [x] Large-export size warnings and GIF guidance
- [x] Auto-download WebM/GIF on completion
- [x] Display success/error/cancel notifications for exports
- [x] Apply preview canvas scaling during preview mode
- [>] Add notifications for preset renames (pending rename feature)
- [x] Integrate toast log link in status bar for quick review

## Testing & QA

- [x] Unit tests for RNG utilities
- [x] Unit/Component tests for Zustand store behaviour
- [x] Tests for notification store auto-dismiss (manual timer handling TBD)
- [x] Browser QA matrix (Chrome, Firefox, Safari) focusing on MediaRecorder/GIF
- [ ] Performance profiling for high-resolution exports

## Documentation

- [x] Maintain project status log (`plan/project_status.md`)
- [x] Update README with current controls, export caveats, and GIF limitations
- [x] Add quickstart section covering presets and notifications

## MVP → v1.0 Transition

**MVP Status**: ✅ Complete with 6 effects, full export pipeline, and UX polish

### Recently Completed (Post-MVP)
- [x] Advanced effects (Orbiting Bars + Ripple Quantized delivered)
- [x] Shareable URLs (URL-based state sharing implemented)
- [x] MP4 export via ffmpeg.wasm with progress UI
- [x] Keyframe support for parameter automation
- [x] Client-side ZIP compression optimizations for PNG sequences

### v1.0 Development Roadmap
**Status**: Planning complete, ready for implementation
**Timeline**: 14-week development cycle (Q4 2024 → Q1 2025)
**Document**: `plan/v1_development_roadmap.md`

#### Phase 1: Foundation Hardening (Weeks 1-4)
- [ ] Performance optimization and GPU acceleration
- [ ] Enhanced error handling and resilience
- [ ] E2E testing with Playwright
- [ ] Cross-platform QA expansion

#### Phase 2: Advanced Creation Tools (Weeks 5-9)
- [ ] 4 additional effects (Typographic, Grid, Particle, Geometric)
- [ ] Timeline editor with visual keyframe interface
- [ ] Effect blending and custom parameters
- [ ] Export quality profiles and batch operations

#### Phase 3: Sharing & Community (Weeks 10-12)
- [ ] Gallery system and preset marketplace
- [ ] Social media integration and embeds
- [ ] Progressive Web App capabilities
- [ ] Mobile optimization and touch controls

#### Phase 4: Production Ready (Weeks 13-14)
- [ ] Deployment infrastructure and monitoring
- [ ] Interactive tutorials and documentation
- [ ] Performance benchmarking and optimization
- [ ] Final QA and launch preparation
