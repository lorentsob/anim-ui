export interface QualitySettings {
  mode: 'preview' | 'draft' | 'render';
  previewScale: number;    // 0.1 - 1.0
  previewFPS: number;      // Scaled FPS for smooth preview
  autoScale: boolean;      // Auto-adjust based on performance
}

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
  } else if (complexity < 50_000_000) { // 4K@24fps or HD@60fps
    return {
      mode: 'preview',
      previewScale: 0.5,
      previewFPS: Math.min(fps, 12),
      autoScale: true
    };
  } else { // Very large/complex animations
    return {
      mode: 'preview',
      previewScale: 0.3,
      previewFPS: Math.min(fps, 8),
      autoScale: true
    };
  }
}

export function getQualityDescription(settings: QualitySettings, originalFps: number): string {
  if (settings.previewScale === 1.0 && settings.previewFPS === originalFps) {
    return 'Full Quality';
  }

  const parts = [];

  if (settings.previewScale < 1.0) {
    parts.push(`${Math.round(settings.previewScale * 100)}% resolution`);
  }

  if (settings.previewFPS < originalFps) {
    parts.push(`${settings.previewFPS}fps preview`);
  }

  return parts.length > 0 ? parts.join(', ') : 'Optimized';
}

export function shouldWarnLargeExport(
  width: number,
  height: number,
  fps: number,
  durationSec: number
): { warn: boolean; reason?: string } {
  const totalFrames = fps * durationSec;
  const frameComplexity = width * height;
  const totalComplexity = frameComplexity * totalFrames;

  // Warn for very large exports that might take a long time
  if (totalComplexity > 500_000_000) { // ~4K@30fps for 30s
    return {
      warn: true,
      reason: `Large export: ${totalFrames} frames at ${width}×${height} (${Math.round(totalComplexity / 1_000_000)}M pixels)`
    };
  }

  if (totalFrames > 3600) { // More than 1 minute at 60fps
    return {
      warn: true,
      reason: `Long animation: ${Math.round(totalFrames / fps)}s duration (${totalFrames} frames)`
    };
  }

  return { warn: false };
}