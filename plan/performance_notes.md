# Performance Profiling Plan

## Goals
- Measure CPU usage and frame consistency during preview vs render modes.
- Quantify export duration for typical jobs (640×640 @ 12fps, GIF/WebM/PNG).
- Identify bottlenecks in effect rendering and export loops.

## Tooling
- Chrome Performance panel with CPU throttling and recordings.
- Firefox Performance monitor for MediaRecorder behaviour.
- Safari Web Inspector for canvas and JS metrics (even without MediaRecorder).

## Scenarios
1. **Preview mode stress test**
   - Effect: ASCII Dither
   - Canvas: 960×960
   - Actions: continuous parameter scrubbing for 30s, monitor FPS drop.
2. **Render mode export**
   - Effect: Cellular Automata
   - Duration: 10s @ 24fps
   - Measure total export time for GIF + PNG ZIP, note progress accuracy.
3. **History retention**
   - Run successive exports, ensure history list remains responsive and URLs are revoked when clearing entries.

## Metrics to capture
- Average FPS / dropped frames (from devtools overlay).
- CPU percentages per core.
- Export duration vs expected totalFrames / fps.
- Memory footprint before/after heavy exports.

## Observations
- (Pending runs)

## Follow-up
- Document results back into this file once runs are complete.
- Adjust warning thresholds or scaling factors based on findings.
