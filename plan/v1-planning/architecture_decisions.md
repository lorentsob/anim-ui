# Architecture Decisions for v1.0 Advanced Features

_Decision Date: 2025-09-16_
_Status: Final - Ready for Implementation_

## Executive Summary

Three critical architectural decisions have been made to enable advanced animation capabilities while maintaining UX simplicity:

1. **Timeline Integration**: Additive, opt-in system that doesn't disrupt current workflow
2. **Quality Management**: Smart performance tiers instead of hard constraints
3. **Effect Composition**: Canvas-based blending for reliable, compatible multi-effect support

---

## Decision 1: Timeline Integration - "Additive, Not Disruptive"

### **Design Principle**: Current workflow remains 100% unchanged until user opts into timeline features

### **UX Architecture**

#### **Static Mode (Default - Current Behavior)**
```
┌─ TopBar: Effect, Play/Pause, Global Controls ─┐
├─ Canvas: Real-time preview                    │
├─ ParamPanel: Static parameter controls        │  ← UNCHANGED
└─ StatusBar: Frame info, notifications        ─┘
```

#### **Timeline Mode (Opt-in Enhancement)**
```
┌─ TopBar: + Timeline Toggle                   ─┐
├─ Canvas: Real-time preview with scrubber     │
├─ ParamPanel: Parameters + keyframe buttons   │  ← ENHANCED
├─ Timeline: Collapsible bottom panel          │  ← NEW
└─ StatusBar: Timeline info, keyframe count   ─┘
```

### **Implementation Strategy**

#### **Phase 1: Non-Breaking Timeline Foundation**
```typescript
// Enhanced store - backward compatible
interface EditorState {
  // Existing state (unchanged)
  effectId: string;
  params: ParamValues;
  // ... current properties

  // New timeline properties
  timelineMode: boolean;           // false by default
  keyframes: KeyframeMap;          // empty by default
  currentTime: number;             // 0 by default
}

// Current parameter access still works
const paramValue = useEditorStore(state => state.params.speed);

// Timeline-aware parameter access (new)
const animatedValue = useAnimatedParam('speed', currentTime);
```

#### **Phase 2: Seamless Parameter Animation**
```typescript
// Effect rendering unchanged when no keyframes exist
render(p, ctx, t, frame, params) {
  // params.speed is static value (current behavior)
}

// Effect rendering enhanced when keyframes exist
render(p, ctx, t, frame, animatedParams) {
  // animatedParams.speed interpolated from keyframes
}
```

### **UX Flow Design**

#### **Beginner Experience (No Change)**
1. User selects effect, adjusts parameters ✓ Same as now
2. Clicks play, sees animation ✓ Same as now
3. Exports animation ✓ Same as now
4. **Never sees timeline unless they click toggle**

#### **Advanced User Experience (Enhanced)**
1. Same as beginner for initial setup
2. Clicks "Timeline" toggle in top bar
3. Timeline panel slides up from bottom
4. Parameter panel shows "+" buttons next to each parameter
5. Click "+" adds keyframe at current time
6. Drag timeline scrubber to change time, adjust parameter, auto-adds keyframe
7. Timeline shows keyframes as dots on parameter tracks

### **Timeline Panel Design**
```
┌─ Timeline Panel (Collapsible) ──────────────────────────────┐
│ ⏮ ⏭ [■] 00:02.5 / 06.0s     [Zoom: █████▒▒▒]           │
├─────────────────────────────────────────────────────────────┤
│ speed     ●────●────────────●     [◦] [≈] [✕]           │
│ count     ●──────────●─●─●──      [◦] [≈] [✕]           │
│ radius    ●─────────────────●     [◦] [≈] [✕]           │
└─────────────────────────────────────────────────────────────┘
```

**Legend**:
- `●` = Keyframe with value
- `─` = Interpolated timeline
- `[◦]` = Add keyframe
- `[≈]` = Easing curve
- `[✕]` = Delete keyframes

---

## Decision 2: Quality Tiers - "Performance, Not Barriers"

### **Design Principle**: Enable any creative vision, with smart performance scaling

### **Quality Tier System**

#### **Auto-Scaling Quality Modes**
```typescript
interface QualityConfig {
  mode: 'preview' | 'draft' | 'render';
  autoScale: boolean;
  maxPreviewRes: number;      // Auto-calculated based on performance
  previewFPS: number;         // Scaled for smooth interaction
  renderScale: number;        // Final export resolution multiplier
}
```

#### **Intelligent Performance Scaling**
```javascript
// Replace hard limits with smart scaling
function getOptimalPreviewSettings(width, height, fps, effects) {
  const complexity = calculateComplexity(width, height, fps, effects);

  if (complexity < 1000000) {
    return { scale: 1.0, fps: fps, quality: 'high' };
  } else if (complexity < 5000000) {
    return { scale: 0.7, fps: Math.min(fps, 24), quality: 'medium' };
  } else {
    return { scale: 0.5, fps: Math.min(fps, 12), quality: 'low' };
  }
}
```

### **UX Implementation**

#### **Smart Warnings Instead of Blocks**
```
❌ OLD: "Cannot exceed 2048px" (blocking)
✅ NEW: "Large canvas - preview scaled to 70% for performance" (informative)

❌ OLD: "FPS limited to 30" (blocking)
✅ NEW: "Preview at 24fps for smooth editing, exports at 60fps" (helpful)
```

#### **Performance Indicators**
```
┌─ StatusBar Enhancement ─────────────────────────┐
│ Frame 45/720  ●●○○○ Quality: Preview (Draft)   │
│ [Switch to Render Mode for Full Quality]       │
└─────────────────────────────────────────────────┘
```

### **Quality Mode Behaviors**

#### **Preview Mode (Default)**
- **Purpose**: Smooth interactive editing
- **Behavior**: Auto-scale resolution/fps for 60fps UI
- **Canvas**: Scaled down if needed (50-100% of target)
- **Effects**: Full fidelity, optimized rendering
- **Export**: Shows preview quality warning

#### **Draft Mode (User-Triggered)**
- **Purpose**: Test full-resolution animation
- **Behavior**: Full resolution, reduced frame rate if needed
- **Canvas**: Target resolution, 12-24fps preview
- **Effects**: Full fidelity, full resolution
- **Export**: Full quality available

#### **Render Mode (Export-Only)**
- **Purpose**: Final export quality
- **Behavior**: Maximum quality, no performance compromises
- **Canvas**: Target resolution, target framerate
- **Effects**: Maximum quality settings
- **Export**: Professional output quality

---

## Decision 3: Canvas-Based Effect Composition

### **Design Principle**: Reliable, compatible multi-effect blending with predictable results

### **Architecture Choice: Canvas Composition**

**Selected over shader-based composition because:**
- ✅ Works with existing p5.js architecture
- ✅ No WebGL dependency (broader browser support)
- ✅ Predictable behavior across all devices
- ✅ Industry-standard approach (After Effects, Premiere, etc.)
- ✅ Easier debugging and development
- ✅ Better blend mode support

### **Technical Implementation**

#### **Multi-Canvas Architecture**
```typescript
interface EffectLayer {
  id: string;
  effectId: string;
  params: ParamValues;
  keyframes: KeyframeMap;
  opacity: number;           // 0-1
  blendMode: BlendMode;      // multiply, screen, overlay, etc.
  visible: boolean;
  canvas: HTMLCanvasElement; // Individual effect canvas
}

interface Composition {
  layers: EffectLayer[];
  mainCanvas: HTMLCanvasElement;  // Final composition
  tempCanvas: HTMLCanvasElement;  // Blending workspace
}
```

#### **Rendering Pipeline**
```javascript
function renderComposition(composition, time, frame) {
  // 1. Render each effect to its own canvas
  composition.layers.forEach(layer => {
    if (!layer.visible) return;

    const animatedParams = getAnimatedParams(layer, time);
    renderEffectToCanvas(layer.canvas, layer.effectId, animatedParams);
  });

  // 2. Composite layers with blend modes
  const ctx = composition.mainCanvas.getContext('2d');
  ctx.clearRect(0, 0, width, height);

  composition.layers.forEach(layer => {
    if (!layer.visible) return;

    ctx.globalAlpha = layer.opacity;
    ctx.globalCompositeOperation = layer.blendMode;
    ctx.drawImage(layer.canvas, 0, 0);
  });
}
```

### **Blend Mode Support**

#### **Core Blend Modes (Phase 1)**
```typescript
type BlendMode =
  | 'normal'       // Standard layering
  | 'multiply'     // Darken blend (great for textures)
  | 'screen'       // Lighten blend (great for glows)
  | 'overlay'      // Contrast blend
  | 'difference';  // XOR-style effects

// Canvas 2D API natively supports these
```

#### **Advanced Blend Modes (Phase 2)**
```typescript
type AdvancedBlendMode =
  | 'color-dodge'  // Bright highlights
  | 'color-burn'   // Deep shadows
  | 'hard-light'   // Strong contrast
  | 'soft-light'   // Subtle contrast
  | 'exclusion';   // Inverted difference
```

### **Layer Management UX**

#### **Layer Panel Design**
```
┌─ Layers Panel (Right side) ─┐
│ ┌─ Layer 2: Ripple ──────┐ │
│ │ ●●●●○ Opacity: 80%    │ │
│ │ Blend: Multiply  [≡] │ │
│ │ [👁] [🔒] [✕]        │ │
│ └───────────────────────┘ │
│ ┌─ Layer 1: Square ──────┐ │
│ │ ●●●●● Opacity: 100%   │ │
│ │ Blend: Normal    [≡] │ │
│ │ [👁] [🔒] [✕]        │ │
│ └───────────────────────┘ │
│ [+ Add Effect Layer]      │
└───────────────────────────┘
```

**Controls**:
- `[👁]` = Visibility toggle
- `[🔒]` = Lock layer from editing
- `[✕]` = Delete layer
- `[≡]` = Drag to reorder
- Opacity slider
- Blend mode dropdown

---

## Implementation Timeline

### **Week 1: Foundation**
- Remove hard constraints (canvas, fps, duration)
- Implement quality tier system
- Add performance scaling architecture

### **Week 2: Basic Timeline**
- Add timeline toggle to TopBar
- Create collapsible timeline panel
- Implement keyframe storage in store
- Add keyframe buttons to parameter panel

### **Week 3: Timeline Functionality**
- Timeline scrubbing and navigation
- Linear interpolation between keyframes
- Real-time preview with timeline

### **Week 4: Advanced Timeline**
- Easing functions and curve editing
- Keyframe manipulation (copy/paste/delete)
- Timeline layer organization

### **Week 5: Basic Composition**
- Multi-canvas architecture
- Layer system foundation
- Basic blend modes (normal, multiply, screen)

### **Week 6: Advanced Composition**
- Layer management UI
- All blend modes
- Layer opacity and visibility controls

---

## Success Criteria

### **Timeline Integration Success**
- ✅ Current users see zero UX changes until they opt-in
- ✅ Timeline mode enables professional keyframe animation
- ✅ Smooth transition between static and timeline modes
- ✅ No performance impact when timeline features unused

### **Quality System Success**
- ✅ No hard creative limits prevent user goals
- ✅ Smooth preview at any resolution/complexity
- ✅ Clear performance feedback and options
- ✅ Professional export quality maintained

### **Composition System Success**
- ✅ Multiple effects can be layered and blended
- ✅ Predictable, consistent blend mode behavior
- ✅ Real-time preview of multi-effect compositions
- ✅ Professional layer management workflow

---

## Conclusion

These architectural decisions prioritize user creativity and workflow simplicity while enabling professional capabilities. The timeline system is completely additive, quality management is helpful rather than restrictive, and effect composition uses proven, reliable technology.

Implementation can begin immediately with Week 1 constraint removal, as these decisions provide clear technical direction for all advanced features.