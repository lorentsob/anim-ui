# Implementation Guide: Advanced Features

_Implementation Date: 2025-09-16_
_Priority: Week 1-6 Development Roadmap_

## Overview

This guide provides step-by-step implementation instructions for the three architectural decisions:

1. **Constraint Removal & Quality Tiers** (Week 1)
2. **Additive Timeline System** (Weeks 2-4)
3. **Canvas-Based Effect Composition** (Weeks 5-6)

---

## Week 1: Remove Constraints & Implement Quality Tiers

### **Task 1.1: Remove Hard Constraints**

#### **File: `src/store/useEditor.ts`**
```typescript
// BEFORE (limiting)
const sanitizeDimension = (value: number, fallback: number) => {
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return Math.round(Math.max(32, Math.min(2048, value))); // ❌ 2048 limit
};

const sanitizeFps = (value: number, fallback: number) => {
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return Math.max(1, Math.min(30, Math.round(value))); // ❌ 30fps limit
};

// AFTER (enabling)
const sanitizeDimension = (value: number, fallback: number) => {
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return Math.round(Math.max(32, Math.min(8192, value))); // ✅ 8K support
};

const sanitizeFps = (value: number, fallback: number) => {
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return Math.max(1, Math.min(120, Math.round(value))); // ✅ 120fps support
};

const sanitizeDuration = (value: number, fallback: number) => {
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return Math.max(1, Math.min(300, Math.round(value))); // ✅ 5 minutes
};
```

#### **File: `src/components/TopBar.tsx`**
```typescript
// Update UI limits to match new constraints
<NumericField
  value={width}
  onChange={(v) => setSize(v, height)}
  min={32}
  max={8192} // ✅ Updated from 2048
  step={1}
/>

<NumericField
  value={fps}
  onChange={setFps}
  min={1}
  max={120} // ✅ Updated from 30
  step={1}
/>
```

### **Task 1.2: Add Quality Tier System**

#### **File: `src/store/useEditor.ts`** (Add new state)
```typescript
type QualityMode = 'preview' | 'draft' | 'render';

interface QualitySettings {
  mode: QualityMode;
  previewScale: number;    // 0.1 - 1.0
  previewFPS: number;      // Scaled FPS for smooth preview
  autoScale: boolean;      // Auto-adjust based on performance
}

type EditorState = {
  // ... existing properties
  qualitySettings: QualitySettings;
  setQualityMode: (mode: QualityMode) => void;
  setQualitySettings: (settings: Partial<QualitySettings>) => void;
};

// Add to store implementation
qualitySettings: {
  mode: 'preview',
  previewScale: 1.0,
  previewFPS: 12,
  autoScale: true,
},
setQualityMode: (mode) => set((state) => ({
  qualitySettings: { ...state.qualitySettings, mode }
})),
```

#### **File: `src/lib/qualityManager.ts`** (New file)
```typescript
export interface PerformanceMetrics {
  complexity: number;      // width * height * fps * effects
  targetFPS: number;       // Desired interactive framerate
  deviceCapability: number; // Estimated device performance
}

export function calculateOptimalSettings(
  width: number,
  height: number,
  fps: number,
  effectCount: number = 1
): QualitySettings {
  const complexity = width * height * fps * effectCount;

  // Performance tiers based on total pixel throughput
  if (complexity < 1_000_000) { // ~640x640@24fps
    return {
      mode: 'preview',
      previewScale: 1.0,
      previewFPS: fps,
      autoScale: false
    };
  } else if (complexity < 10_000_000) { // ~1920x1080@24fps
    return {
      mode: 'preview',
      previewScale: 0.7,
      previewFPS: Math.min(fps, 24),
      autoScale: true
    };
  } else { // 4K+ or high framerate
    return {
      mode: 'preview',
      previewScale: 0.5,
      previewFPS: Math.min(fps, 12),
      autoScale: true
    };
  }
}
```

### **Task 1.3: Update Canvas Host for Quality Scaling**

#### **File: `src/components/CanvasHost.tsx`** (Enhance)
```typescript
// Add quality-aware canvas sizing
function CanvasHost() {
  const width = useEditorStore(s => s.width);
  const height = useEditorStore(s => s.height);
  const qualitySettings = useEditorStore(s => s.qualitySettings);

  // Calculate actual preview size
  const previewWidth = Math.round(width * qualitySettings.previewScale);
  const previewHeight = Math.round(height * qualitySettings.previewScale);

  // Update p5 setup
  const setup = useCallback((p: p5) => {
    p.createCanvas(previewWidth, previewHeight);
    // ... rest of setup
  }, [previewWidth, previewHeight]);

  return (
    <div className="relative">
      <div
        ref={containerRef}
        style={{
          width: previewWidth,
          height: previewHeight,
          transform: qualitySettings.previewScale < 1
            ? `scale(${1/qualitySettings.previewScale})`
            : 'none',
          transformOrigin: 'top left'
        }}
      />
      {qualitySettings.previewScale < 1 && (
        <div className="absolute top-0 right-0 bg-ink text-paper px-2 py-1 text-xs">
          Preview: {Math.round(qualitySettings.previewScale * 100)}%
        </div>
      )}
    </div>
  );
}
```

---

## Week 2: Basic Timeline Foundation

### **Task 2.1: Add Timeline Toggle to TopBar**

#### **File: `src/components/TopBar.tsx`** (Enhance)
```typescript
export function TopBar() {
  // ... existing code
  const timelineMode = useEditorStore(s => s.timelineMode);
  const setTimelineMode = useEditorStore(s => s.setTimelineMode);

  return (
    <div className="flex items-center gap-4 border-b border-line bg-paper p-4">
      {/* ... existing controls */}

      {/* New Timeline Toggle */}
      <button
        onClick={() => setTimelineMode(!timelineMode)}
        className={clsx(
          "px-3 py-1 border text-sm font-mono",
          timelineMode
            ? "bg-ink text-paper border-ink"
            : "bg-paper text-ink border-ink hover:bg-ink hover:text-paper"
        )}
      >
        Timeline {timelineMode ? "ON" : "OFF"}
      </button>
    </div>
  );
}
```

### **Task 2.2: Create Timeline Store**

#### **File: `src/store/useTimeline.ts`** (New file)
```typescript
import { create } from 'zustand';

export interface Keyframe {
  time: number;        // 0-1 (normalized time)
  value: number | string | boolean;
  easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
}

export interface ParameterTimeline {
  paramKey: string;
  keyframes: Keyframe[];
}

interface TimelineState {
  // Timeline data
  timelines: Record<string, ParameterTimeline>; // paramKey -> timeline
  currentTime: number;  // 0-1 normalized

  // Timeline UI state
  zoom: number;         // 1-10 (timeline zoom level)
  selectedKeyframes: string[]; // keyframe IDs

  // Actions
  addKeyframe: (paramKey: string, time: number, value: any) => void;
  removeKeyframe: (paramKey: string, time: number) => void;
  updateKeyframe: (paramKey: string, oldTime: number, newTime: number, newValue: any) => void;
  setCurrentTime: (time: number) => void;
  clearTimeline: (paramKey: string) => void;

  // Interpolation
  getAnimatedValue: (paramKey: string, time: number, defaultValue: any) => any;
}

export const useTimelineStore = create<TimelineState>((set, get) => ({
  timelines: {},
  currentTime: 0,
  zoom: 1,
  selectedKeyframes: [],

  addKeyframe: (paramKey, time, value) => set(state => {
    const timeline = state.timelines[paramKey] || { paramKey, keyframes: [] };
    const newKeyframes = [...timeline.keyframes, { time, value, easing: 'linear' }]
      .sort((a, b) => a.time - b.time);

    return {
      timelines: {
        ...state.timelines,
        [paramKey]: { ...timeline, keyframes: newKeyframes }
      }
    };
  }),

  getAnimatedValue: (paramKey, time, defaultValue) => {
    const timeline = get().timelines[paramKey];
    if (!timeline || timeline.keyframes.length === 0) return defaultValue;

    // Find surrounding keyframes
    const keyframes = timeline.keyframes;
    const beforeFrame = keyframes.findLast(kf => kf.time <= time);
    const afterFrame = keyframes.find(kf => kf.time > time);

    if (!beforeFrame) return keyframes[0].value;
    if (!afterFrame) return beforeFrame.value;

    // Linear interpolation for now
    const t = (time - beforeFrame.time) / (afterFrame.time - beforeFrame.time);

    if (typeof beforeFrame.value === 'number' && typeof afterFrame.value === 'number') {
      return beforeFrame.value + (afterFrame.value - beforeFrame.value) * t;
    }

    return t < 0.5 ? beforeFrame.value : afterFrame.value;
  },

  // ... other actions
}));
```

### **Task 2.3: Enhance Parameter Panel for Keyframes**

#### **File: `src/components/ParamPanel.tsx`** (Enhance)
```typescript
import { useTimelineStore } from '@/store/useTimeline';

function ParameterControl({ param, value, onChange }: ParameterControlProps) {
  const timelineMode = useEditorStore(s => s.timelineMode);
  const currentTime = useTimelineStore(s => s.currentTime);
  const addKeyframe = useTimelineStore(s => s.addKeyframe);
  const hasKeyframes = useTimelineStore(s =>
    Boolean(s.timelines[param.key]?.keyframes.length)
  );

  const handleAddKeyframe = () => {
    addKeyframe(param.key, currentTime, value);
  };

  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="flex-1">
        <NumericField {...param} value={value} onChange={onChange} />
      </div>

      {timelineMode && (
        <button
          onClick={handleAddKeyframe}
          className={clsx(
            "w-6 h-6 border text-xs flex items-center justify-center",
            hasKeyframes
              ? "bg-ink text-paper border-ink"
              : "bg-paper text-ink border-ink hover:bg-ink hover:text-paper"
          )}
          title="Add keyframe"
        >
          ●
        </button>
      )}
    </div>
  );
}
```

---

## Week 3: Timeline Panel & Scrubbing

### **Task 3.1: Create Timeline Panel Component**

#### **File: `src/components/TimelinePanel.tsx`** (New file)
```typescript
export function TimelinePanel() {
  const timelineMode = useEditorStore(s => s.timelineMode);
  const durationSec = useEditorStore(s => s.durationSec);
  const fps = useEditorStore(s => s.fps);
  const currentTime = useTimelineStore(s => s.currentTime);
  const setCurrentTime = useTimelineStore(s => s.setCurrentTime);
  const timelines = useTimelineStore(s => s.timelines);

  if (!timelineMode) return null;

  const totalFrames = durationSec * fps;

  return (
    <div className="border-t border-line bg-paper">
      {/* Timeline Header */}
      <div className="flex items-center gap-4 p-3 border-b border-line">
        <div className="flex items-center gap-2">
          <button className="w-6 h-6 border border-ink flex items-center justify-center text-xs">
            ⏮
          </button>
          <button className="w-6 h-6 border border-ink flex items-center justify-center text-xs">
            ⏭
          </button>
        </div>

        <div className="text-sm font-mono">
          {formatTime(currentTime * durationSec)} / {formatTime(durationSec)}
        </div>

        <div className="flex-1" />

        <div className="text-xs opacity-80">
          Frame {Math.round(currentTime * totalFrames)} / {totalFrames}
        </div>
      </div>

      {/* Timeline Tracks */}
      <div className="max-h-64 overflow-y-auto">
        {Object.values(timelines).map(timeline => (
          <TimelineTrack
            key={timeline.paramKey}
            timeline={timeline}
            duration={durationSec}
            currentTime={currentTime}
            onTimeChange={setCurrentTime}
          />
        ))}
      </div>
    </div>
  );
}

function TimelineTrack({ timeline, duration, currentTime, onTimeChange }) {
  const trackRef = useRef<HTMLDivElement>(null);

  const handleTrackClick = (e: MouseEvent) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = x / rect.width;
    onTimeChange(Math.max(0, Math.min(1, time)));
  };

  return (
    <div className="border-b border-line last:border-b-0">
      <div className="flex items-center">
        <div className="w-24 p-2 text-xs font-mono border-r border-line">
          {timeline.paramKey}
        </div>

        <div
          ref={trackRef}
          className="flex-1 h-8 relative bg-paper cursor-pointer hover:bg-gray-50"
          onClick={handleTrackClick}
        >
          {/* Timeline background */}
          <div className="absolute inset-0 border-r border-line opacity-20" />

          {/* Keyframes */}
          {timeline.keyframes.map((keyframe, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-ink rounded-full transform -translate-x-1 -translate-y-1"
              style={{
                left: `${keyframe.time * 100}%`,
                top: '50%'
              }}
            />
          ))}

          {/* Current time indicator */}
          <div
            className="absolute w-0.5 h-full bg-red-500"
            style={{ left: `${currentTime * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
```

### **Task 3.2: Integrate Timeline with Effects**

#### **File: `src/components/CanvasHost.tsx`** (Enhance rendering)
```typescript
// Modify effect rendering to use animated parameters
const render = useCallback((p: p5) => {
  if (!effect) return;

  // Get base parameters
  const baseParams = useEditorStore.getState().params;

  // Get animated parameters if timeline mode
  const timelineMode = useEditorStore.getState().timelineMode;
  const currentTime = useTimelineStore.getState().currentTime;

  let animatedParams = baseParams;

  if (timelineMode) {
    animatedParams = { ...baseParams };
    Object.keys(baseParams).forEach(paramKey => {
      animatedParams[paramKey] = useTimelineStore.getState().getAnimatedValue(
        paramKey,
        currentTime,
        baseParams[paramKey]
      );
    });
  }

  // Render effect with animated parameters
  const time = currentTime * durationSec;
  const frame = Math.floor(currentTime * totalFrames);

  effect.render(p, ctx, time, frame, animatedParams);
}, [effect, /* dependencies */]);
```

---

## Week 4: Advanced Timeline Features

### **Task 4.1: Easing Functions**

#### **File: `src/lib/easing.ts`** (New file)
```typescript
export type EasingFunction =
  | 'linear'
  | 'easeIn' | 'easeOut' | 'easeInOut'
  | 'bounceIn' | 'bounceOut' | 'bounceInOut'
  | 'elasticIn' | 'elasticOut' | 'elasticInOut';

export function applyEasing(t: number, easing: EasingFunction): number {
  switch (easing) {
    case 'linear':
      return t;

    case 'easeIn':
      return t * t * t;

    case 'easeOut':
      return 1 - Math.pow(1 - t, 3);

    case 'easeInOut':
      return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;

    case 'bounceOut':
      if (t < 1 / 2.75) return 7.5625 * t * t;
      if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
      if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
      return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;

    // ... more easing functions

    default:
      return t;
  }
}
```

### **Task 4.2: Update Timeline Store with Easing**

#### **File: `src/store/useTimeline.ts`** (Enhance interpolation)
```typescript
getAnimatedValue: (paramKey, time, defaultValue) => {
  const timeline = get().timelines[paramKey];
  if (!timeline || timeline.keyframes.length === 0) return defaultValue;

  const keyframes = timeline.keyframes;
  const beforeFrame = keyframes.findLast(kf => kf.time <= time);
  const afterFrame = keyframes.find(kf => kf.time > time);

  if (!beforeFrame) return keyframes[0].value;
  if (!afterFrame) return beforeFrame.value;

  // Apply easing function
  const rawT = (time - beforeFrame.time) / (afterFrame.time - beforeFrame.time);
  const easedT = applyEasing(rawT, beforeFrame.easing);

  if (typeof beforeFrame.value === 'number' && typeof afterFrame.value === 'number') {
    return beforeFrame.value + (afterFrame.value - beforeFrame.value) * easedT;
  }

  return easedT < 0.5 ? beforeFrame.value : afterFrame.value;
},
```

---

## Week 5-6: Canvas-Based Effect Composition

### **Task 5.1: Multi-Layer Architecture**

#### **File: `src/store/useComposition.ts`** (New file)
```typescript
export interface EffectLayer {
  id: string;
  name: string;
  effectId: string;
  visible: boolean;
  opacity: number;          // 0-1
  blendMode: BlendMode;
  canvas?: HTMLCanvasElement;
}

export type BlendMode =
  | 'normal' | 'multiply' | 'screen' | 'overlay' | 'difference'
  | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light';

interface CompositionState {
  layers: EffectLayer[];
  activeLayerId: string | null;

  addLayer: (effectId: string) => void;
  removeLayer: (layerId: string) => void;
  updateLayer: (layerId: string, updates: Partial<EffectLayer>) => void;
  reorderLayers: (dragIndex: number, hoverIndex: number) => void;
  setActiveLayer: (layerId: string | null) => void;
}

export const useCompositionStore = create<CompositionState>((set, get) => ({
  layers: [],
  activeLayerId: null,

  addLayer: (effectId) => set(state => {
    const newLayer: EffectLayer = {
      id: `layer-${Date.now()}`,
      name: `Layer ${state.layers.length + 1}`,
      effectId,
      visible: true,
      opacity: 1,
      blendMode: 'normal',
    };

    return {
      layers: [...state.layers, newLayer],
      activeLayerId: newLayer.id
    };
  }),

  // ... other actions
}));
```

### **Task 5.2: Multi-Canvas Renderer**

#### **File: `src/components/CompositionRenderer.tsx`** (New file)
```typescript
export function CompositionRenderer() {
  const layers = useCompositionStore(s => s.layers);
  const width = useEditorStore(s => s.width);
  const height = useEditorStore(s => s.height);
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const layerCanvases = useRef<Map<string, HTMLCanvasElement>>(new Map());

  // Create canvases for each layer
  useEffect(() => {
    layers.forEach(layer => {
      if (!layerCanvases.current.has(layer.id)) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        layerCanvases.current.set(layer.id, canvas);
      }
    });

    // Clean up removed layers
    layerCanvases.current.forEach((canvas, layerId) => {
      if (!layers.find(l => l.id === layerId)) {
        layerCanvases.current.delete(layerId);
      }
    });
  }, [layers, width, height]);

  // Render composition
  const renderComposition = useCallback(() => {
    if (!mainCanvasRef.current) return;

    const mainCtx = mainCanvasRef.current.getContext('2d')!;
    mainCtx.clearRect(0, 0, width, height);

    // Render each layer
    layers.forEach(layer => {
      if (!layer.visible) return;

      const layerCanvas = layerCanvases.current.get(layer.id);
      if (!layerCanvas) return;

      // Render effect to layer canvas
      renderEffectToCanvas(layerCanvas, layer);

      // Composite onto main canvas
      mainCtx.save();
      mainCtx.globalAlpha = layer.opacity;
      mainCtx.globalCompositeOperation = layer.blendMode;
      mainCtx.drawImage(layerCanvas, 0, 0);
      mainCtx.restore();
    });
  }, [layers, width, height]);

  return (
    <canvas
      ref={mainCanvasRef}
      width={width}
      height={height}
      className="border border-dashed border-ink"
    />
  );
}

function renderEffectToCanvas(canvas: HTMLCanvasElement, layer: EffectLayer) {
  // Implementation depends on how we integrate with p5.js effects
  // This is where individual effects render to their layer canvas
}
```

---

## Testing Strategy

### **Week 1 Tests: Constraint Removal**
- [ ] Verify 4K canvas creation doesn't crash
- [ ] Test 60fps animation runs smoothly
- [ ] Confirm quality scaling works across devices
- [ ] Validate export quality at high resolutions

### **Week 2-4 Tests: Timeline System**
- [ ] Timeline toggle doesn't break existing workflow
- [ ] Keyframe interpolation produces smooth animation
- [ ] Timeline scrubbing updates preview correctly
- [ ] Complex easing functions work as expected

### **Week 5-6 Tests: Composition**
- [ ] Multiple effects render correctly in layers
- [ ] Blend modes produce expected visual results
- [ ] Layer opacity and visibility controls work
- [ ] Performance acceptable with multiple layers

---

## Success Metrics

### **Quantitative**
- ✅ 4K canvas preview at >20fps
- ✅ Timeline operations respond in <100ms
- ✅ Multi-layer composition renders in real-time
- ✅ Export times scale linearly with complexity

### **Qualitative**
- ✅ Current users see no workflow changes unless opted-in
- ✅ Timeline feels professional and intuitive
- ✅ Quality scaling provides helpful feedback
- ✅ Effect composition enables creative exploration

This implementation guide provides concrete, actionable steps for each week while maintaining the architectural principles of simplicity, performance, and creativity enablement.