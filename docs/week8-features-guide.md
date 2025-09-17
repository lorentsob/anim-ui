# Week 8 Features Guide: Effect Blending & Custom Parameters

This guide covers the advanced features added in Week 8 of BW Animator development: **Effect Blending System** and **Custom Parameter Controls**.

## 🎨 Effect Blending System

The Effect Blending System allows you to layer multiple effects with professional blend modes to create complex compositions.

### Getting Started with Blending

1. **Enable Blending Mode**
   - Click **"Blending: OFF"** in the top bar
   - It will change to **"Blending: ON"**
   - A Layer Panel appears on the right side of the screen

2. **Understanding the Interface**
   - **Canvas**: Shows the blended result of all enabled layers
   - **Layer Panel**: Controls for managing effect layers (right side)
   - **Parameter Panel**: Controls for the currently selected layer's effect

### Layer Management

#### Adding Layers
- Click **"+ Add Layer"** button in the Layer Panel
- New layers start with the same effect as the previous layer
- You can have unlimited layers (performance permitting)

#### Layer Controls
Each layer has these controls:

- **Enable Checkbox**: Turn the layer on/off
- **Effect Selector**: Choose which effect to apply
- **Blend Mode Dropdown**: Select how this layer blends with layers below
- **Opacity Slider**: Control layer transparency (0-100%)
- **Duplicate Button (⧉)**: Copy the layer with all settings
- **Remove Button (×)**: Delete the layer (can't remove the last layer)

#### Layer Order
- Layers blend from bottom to top
- The first (bottom) layer is always **Normal** blend mode
- Higher layers can use any blend mode

### Blend Modes Explained

| Blend Mode | Effect | Best Used For |
|------------|---------|---------------|
| **Normal** | Standard overlay | Base layers, simple overlays |
| **Multiply** | Darkens the image | Shadows, dark textures, depth |
| **Add** | Brightens the image | Light effects, glows, highlights |
| **Subtract** | Creates contrast/difference | Edge effects, high contrast |
| **XOR** | Exclusive OR operation | Unique patterns, digital effects |
| **Overlay** | Combines multiply and screen | Complex textures, rich blending |

### Pro Tips for Blending

1. **Start Simple**: Begin with 2-3 layers to learn the system
2. **Layer Strategy**: Use different effects per layer for variety
3. **Opacity Control**: Lower opacity (30-70%) often looks better than 100%
4. **Blend Mode Experimentation**: Try different modes - unexpected combinations work well
5. **Performance**: More layers = slower rendering, especially in high quality mode

## ⚙️ Custom Parameter Controls

Custom Parameter Controls provide advanced parameter types beyond simple numbers and toggles.

### New Parameter Types

#### 1. Color Parameters
- **Purpose**: Monochrome color selection (0-255 grayscale values)
- **UI**: Color picker + text input
- **Usage**: Tint effects, brightness control
- **Example**: Tint Color in Custom Demo effect

#### 2. Vector2 Parameters
- **Purpose**: X,Y coordinate pairs
- **UI**: Two number inputs with labels
- **Usage**: Positions, directions, 2D offsets
- **Example**: Center Position in Custom Demo effect

#### 3. Curve Parameters
- **Purpose**: Custom animation curves with multiple points
- **UI**: Visual curve editor with point manipulation
- **Usage**: Complex timing, custom easing functions
- **Features**:
  - Add/remove points by clicking "Add Point" or "Remove"
  - Drag points in the visual editor
  - Edit precise values in the point editor
  - Automatic sorting by X coordinate

#### 4. Range Parameters
- **Purpose**: Min/Max value ranges
- **UI**: Dual sliders + number inputs
- **Usage**: Random value ranges, gradient bounds
- **Example**: Intensity Range in Custom Demo effect

### Using Custom Parameters

1. **Select Custom Demo Effect**: Choose "Custom Parameters Demo" from the effect dropdown
2. **Explore Controls**: Each parameter type has a different interface
3. **Visual Feedback**: The effect shows how parameters affect the animation
4. **Timeline Integration**: All custom parameters work with keyframe animation

### Custom Parameter Development

To create effects with custom parameters:

```typescript
// Example parameter definitions
params: [
  {
    key: "colorTint",
    type: "color",
    label: "Tint Color",
    monochrome: true,
  },
  {
    key: "centerPos",
    type: "vector2",
    label: "Center Position",
    min: -100,
    max: 100,
  },
  {
    key: "curve",
    type: "curve",
    label: "Animation Curve",
    points: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
  },
  {
    key: "range",
    type: "range",
    label: "Value Range",
    min: 0,
    max: 100,
    step: 1,
  }
]
```

## 🎬 Timeline Integration

Both blending and custom parameters work seamlessly with the timeline system.

### Timeline + Blending
- Each layer can have independent keyframe animations
- Different layers can animate different parameters
- Create complex multi-layer animated compositions
- Timeline shows combined result in real-time

### Timeline + Custom Parameters
- All custom parameter types support keyframe animation
- Parameter panels show live animated values during playback
- Custom curves can be animated over time (curve-within-curve effects)
- Vector2 parameters animate both X and Y components smoothly

### Workflow Tips

1. **Enable Both Systems**: Turn on both Timeline and Blending for maximum creative control
2. **Layer Animation Strategy**:
   - Base layer: Slow, stable animation
   - Upper layers: Faster, more dynamic changes
3. **Parameter Keyframes**: Add keyframes at key moments (0%, 25%, 50%, 75%, 100%)
4. **Preview Mode**: Use preview mode while editing, switch to render for final output

## 🔧 Technical Notes

### Performance Considerations
- **Blending Impact**: Each additional layer increases rendering time
- **Preview Mode**: Automatically enabled during editing for responsiveness
- **Custom Parameters**: Minimal performance impact, calculate once per frame

### Browser Compatibility
- **Full Support**: Chrome, Firefox, Safari, Edge (latest versions)
- **Blend Modes**: Use native p5.js blend modes for maximum compatibility
- **Graphics Memory**: Large canvases with many layers may use significant memory

### Troubleshooting

**Blending not working?**
- Check that multiple layers are enabled
- Verify blend modes are set (not all "Normal")
- Try different opacity values

**Timeline keyframes not animating?**
- Ensure Timeline mode is enabled (Timeline: ON)
- Check that parameters have keyframes (● button highlighted)
- Verify timeline is playing or being scrubbed

**Custom parameters not responding?**
- Use the "Custom Parameters Demo" effect to test
- Check browser console for any error messages
- Try refreshing the page if parameters seem stuck

## 🚀 Next Steps

With Week 8 complete, upcoming features include:
- **Export Quality Profiles**: Preset configurations for different export scenarios
- **Batch Export Operations**: Multiple format exports and queue management
- **Additional Blend Modes**: Screen, Burn, Dodge modes
- **Parameter Templates**: Save and reuse custom parameter sets

Experiment with these powerful new tools to create sophisticated animated compositions! The combination of multi-layer blending and custom parameters opens up endless creative possibilities.