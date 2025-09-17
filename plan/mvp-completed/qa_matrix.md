# BW Animator – Browser QA Matrix (MVP)

| Platform | Browser | Version | Status | Notes |
|----------|---------|---------|--------|-------|
| macOS 14 (Apple Silicon) | Chrome | Latest stable | In progress | Baseline playback + WebM/GIF/PNG exports verified locally; history cleanup pending cross-browser check |
| macOS 14 (Apple Silicon) | Firefox | Latest stable | In progress | MediaRecorder fallback (warn) + GIF/ZIP confirmed; WebM unavailable.
| macOS 14 (Apple Silicon) | Safari | Latest release | In progress | MediaRecorder absent – fallback warning visible; GIF/PNG exports succeeded. |
| Windows 11 | Chrome | Latest stable | Pending | Cross-check keyboard inputs, downloads |
| Windows 11 | Edge | Latest stable | Pending | Same as Chrome; validate notifications |
| Ubuntu 22.04 | Firefox | Latest stable | Pending | Canvas performance + exports |

## QA Checklist

- [ ] Baseline playback: Preview & Render modes match expected FPS and scaling.
- [ ] Effect switching: Params reset, animations deterministic across reloads.
- [ ] Preset actions: Save/apply/delete, notifications visible, persisted after refresh.
- [ ] Exports:
  - [ ] WebM: Captures frames, auto-download triggers (on supported browsers).
  - [ ] GIF: Palette/dither output looks acceptable, download available.
  - [ ] PNG ZIP: Progress/ETA updates show, ZIP contents correct.
  - [ ] Heavy export warnings fire in Preview mode and respect overrides.
- [ ] Export history: Entries added, re-download works, removal revokes URLs.
- [ ] Notifications: Toast auto-dismiss timing consistent, no overlap issues.
- [ ] Accessibility scan: Tab order reasonable, focus states visible.

> Update status column and add observations per run.
