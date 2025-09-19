# Timeline Synchronization Problem Analysis

## Problem Summary

The BW Animator timeline system has critical bidirectional synchronization failures. Despite multiple attempts to fix the timeline-viewport sync, the system exhibits the following issues:

1. **Timeline scrubbing works** (logs show successful position updates)
2. **Timeline does NOT control animation playback** (viewport doesn't respond to timeline position)
3. **Animation playback does NOT update timeline** (timeline stays at first frame during play)
4. **Keyframes are non-functional** (parameters don't interpolate during timeline mode)

## Current Implementation Status

### Working Components ✅
- **Timeline UI**: TimelinePanel renders correctly with scrubber and controls
- **Scrubbing Detection**: Mouse interactions properly calculate normalized time
- **Store Updates**: Both `setCurrentTime()` and `setCurrentFrame()` are called
- **Logs Confirm**: Timeline position updates are being logged successfully

### Broken Components ❌
- **Viewport Response**: Canvas doesn't seek to timeline position during scrubbing
- **Playback Sync**: Timeline doesn't move during animation playback
- **Parameter Animation**: Keyframe interpolation not affecting rendered output
- **Bidirectional Flow**: No communication between timeline state and canvas rendering

## Code Architecture Analysis

### Timeline State Management
```typescript
// Timeline Store (src/store/useTimeline.ts)
- currentTime: number (0-1 normalized)
- setCurrentTime: (time: number) => void
- getAnimatedValue: (paramKey: string, time: number, defaultValue: any) => any

// Editor Store (src/store/useEditor.ts)
- currentFrame: number (discrete frame index)
- setCurrentFrame: (frame: number) => void
- timelineMode: boolean
```

### Current Sync Logic (Canvas Components)
```typescript
// In CanvasHost.tsx & BlendedCanvasHost.tsx
if (timelineMode) {
  if (runtime.playing) {
    // Animation playing: advance frames → update timeline
    setCurrentTime(normalizedTime);
  } else {
    // Paused: check for timeline changes → use timeline position
    const timelineChanged = Math.abs(timelineCurrentTime - lastTimelineTime.current) > 0.001;
    if (timelineChanged) {
      normalizedTime = timelineCurrentTime;
      frameIndex = Math.round(normalizedTime * totalFrames) % totalFrames;
    }
  }
}
```

### Parameter Animation Logic
```typescript
// In Canvas render loop
if (timelineMode) {
  const animatedParams: ParamValues = {};
  Object.keys(runtime.params).forEach(paramKey => {
    const animatedValue = getAnimatedValue(paramKey, normalizedTime, runtime.params[paramKey]);
    animatedParams[paramKey] = animatedValue;
  });
  effectParams = animatedParams;
}
```

## Observed Behavior vs Expected

### Timeline Scrubbing
**Expected**: Drag timeline → viewport seeks to corresponding frame
**Actual**: Drag timeline → logs show position updates but viewport doesn't change
**Evidence**: Console logs confirm `TimelineScrubber: Scrubbing to time: X frame: Y`

### Animation Playback
**Expected**: Press play → timeline scrubber moves with animation
**Actual**: Press play → animation plays but timeline stays at first frame
**Evidence**: No `CanvasHost: Timeline updated during playback` logs appearing

### Keyframe Animation
**Expected**: Create keyframes → parameters interpolate during playback/scrubbing
**Actual**: Create keyframes → parameters remain static, no visual change
**Evidence**: User reports "keyframes are not working"

## Technical Investigation Points

### Potential Root Causes

1. **State Update Timing Issues**
   - Store updates may not trigger canvas re-renders
   - React state batching could delay updates
   - useEffect dependencies might be missing

2. **Canvas Render Loop Independence**
   - p5.js draw() loop may not be reactive to store changes
   - Canvas internal state might override store state
   - Frame advancement logic might ignore external time updates

3. **Parameter Passing Problems**
   - Animated parameters might not reach effect rendering
   - Parameter interpolation could be returning wrong values
   - Effect update/render calls might use stale parameters

4. **Timeline Change Detection Logic**
   - Detection threshold (0.001) might be too small/large
   - Change detection might be preventing normal operation
   - lastTimelineTime tracking could have race conditions

### Missing Implementation Elements

1. **Immediate Canvas Seeking**: No mechanism to force canvas to jump to specific frame
2. **Real-time Parameter Updates**: Parameter changes don't trigger immediate re-renders
3. **State Synchronization**: No central coordinator ensuring timeline ↔ canvas consistency
4. **Frame-accurate Rendering**: Canvas might not be using exact timeline position

## Key Files for Investigation

### Core Components
- `src/components/CanvasHost.tsx` - Main canvas render loop and timeline logic
- `src/components/BlendedCanvasHost.tsx` - Multi-layer canvas with same sync logic
- `src/components/TimelinePanel.tsx` - Timeline UI and scrub handler
- `src/components/TimelineScrubber.tsx` - Timeline position control and playback
- `src/components/ParamPanel.tsx` - Parameter UI and keyframe integration

### State Management
- `src/store/useTimeline.ts` - Timeline state and animation interpolation
- `src/store/useEditor.ts` - Editor state and frame tracking

### Effect System
- `src/effects/types.ts` - Effect interface and parameter types
- `src/effects/index.ts` - Effect registry and defaults

## Debug Information

### Console Logs Available
```
TimelineScrubber: Scrubbing to time: 0.5341555977229602 frame: 38
TimelineScrubber: Continuous scrubbing to time: 0.5341555977229602 frame: 38
[Multiple scrubbing logs showing successful position calculations]
```

### Missing Logs (Expected but not appearing)
```
CanvasHost: Timeline updated during playback to: X frame: Y
BlendedCanvasHost: Timeline updated during playback to: X frame: Y
```

## Success Criteria for Resolution

1. **Bidirectional Sync**: Timeline scrubbing immediately updates viewport to corresponding frame
2. **Playback Sync**: Animation playback moves timeline scrubber in real-time
3. **Keyframe Animation**: Parameters interpolate smoothly between keyframes during timeline mode
4. **Frame Accuracy**: Timeline position matches exact canvas frame within ±1 frame tolerance
5. **Real-time Response**: All interactions respond within 16ms (60fps) for smooth experience

## Testing Instructions

1. Enable timeline mode in the editor
2. Create keyframes for a numeric parameter (e.g., change value at time 0 and time 50%)
3. Test timeline scrubbing - viewport should jump to corresponding animation frame
4. Test animation playback - timeline scrubber should move with animation
5. Verify keyframe interpolation - parameter should smoothly change between keyframe values

## Priority Level: CRITICAL

This affects the core motion design workflow and prevents the application from functioning as a professional animation tool. The timeline is a fundamental feature required for keyframe animation and precise frame control.