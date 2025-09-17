/**
 * Real-time performance monitoring system for exports
 * Provides live metrics during export operations
 */

export type PerformanceMetrics = {
  duration: number;
  framesProcessed: number;
  avgFrameTime: number;
  currentFrameTime: number;
  memoryUsage: number;
  estimatedTimeRemaining: number;
  warnings: string[];
  recommendations: string[];
};

export type PerformanceConfig = {
  width: number;
  height: number;
  fps: number;
  totalFrames: number;
  format: "webm" | "gif" | "png";
};

export class ExportPerformanceMonitor {
  private startTime = 0;
  private frameTimings: number[] = [];
  private memoryReadings: number[] = [];
  private lastFrameStart = 0;
  private config: PerformanceConfig;
  private monitoringInterval?: number;
  private onUpdate?: (metrics: PerformanceMetrics) => void;

  constructor(config: PerformanceConfig, onUpdate?: (metrics: PerformanceMetrics) => void) {
    this.config = config;
    this.onUpdate = onUpdate;
  }

  start(): void {
    this.startTime = performance.now();
    this.frameTimings = [];
    this.memoryReadings = [];

    // Monitor memory every 500ms
    this.monitoringInterval = window.setInterval(() => {
      const memory = this.getMemoryUsage();
      this.memoryReadings.push(memory);
      this.updateMetrics();
    }, 500);
  }

  startFrame(): void {
    this.lastFrameStart = performance.now();
  }

  endFrame(): void {
    if (this.lastFrameStart > 0) {
      const frameTime = performance.now() - this.lastFrameStart;
      this.frameTimings.push(frameTime);
      this.updateMetrics();
      this.lastFrameStart = 0;
    }
  }

  stop(): PerformanceMetrics {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    return this.getCurrentMetrics();
  }

  private updateMetrics(): void {
    if (this.onUpdate) {
      this.onUpdate(this.getCurrentMetrics());
    }
  }

  private getCurrentMetrics(): PerformanceMetrics {
    const now = performance.now();
    const duration = now - this.startTime;
    const framesProcessed = this.frameTimings.length;
    const avgFrameTime = framesProcessed > 0
      ? this.frameTimings.reduce((a, b) => a + b, 0) / framesProcessed
      : 0;
    const currentFrameTime = this.frameTimings[this.frameTimings.length - 1] || 0;
    const memoryUsage = this.getMemoryUsage();

    // Estimate time remaining
    const framesRemaining = this.config.totalFrames - framesProcessed;
    const estimatedTimeRemaining = framesRemaining > 0 && avgFrameTime > 0
      ? framesRemaining * avgFrameTime
      : 0;

    const warnings = this.generateWarnings(avgFrameTime, memoryUsage, duration);
    const recommendations = this.generateRecommendations(warnings, avgFrameTime, memoryUsage);

    return {
      duration,
      framesProcessed,
      avgFrameTime,
      currentFrameTime,
      memoryUsage,
      estimatedTimeRemaining,
      warnings,
      recommendations
    };
  }

  private getMemoryUsage(): number {
    if ('memory' in performance && performance.memory) {
      return (performance.memory as any).usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }

  private generateWarnings(avgFrameTime: number, memoryUsage: number, duration: number): string[] {
    const warnings: string[] = [];
    const pixelCount = this.config.width * this.config.height;

    // Frame time warnings
    if (avgFrameTime > 500) {
      warnings.push("Very slow frame processing detected");
    } else if (avgFrameTime > 200) {
      warnings.push("Slow frame processing");
    }

    // Memory warnings
    if (memoryUsage > 1000) {
      warnings.push("High memory usage (>1GB)");
    } else if (memoryUsage > 500) {
      warnings.push("Elevated memory usage");
    }

    // Resolution warnings
    if (pixelCount > 8294400) { // 4K
      warnings.push("Very high resolution may cause performance issues");
    }

    // Format-specific warnings
    if (this.config.format === "gif") {
      if (this.config.totalFrames > 120) {
        warnings.push("Long GIF animations may have large file sizes");
      }
      if (pixelCount > 2073600) { // 1920x1080
        warnings.push("High-resolution GIFs may be very large");
      }
    }

    // Duration warnings for long exports
    if (duration > 60000) { // 1 minute
      warnings.push("Export taking longer than expected");
    }

    return warnings;
  }

  private generateRecommendations(warnings: string[], avgFrameTime: number, memoryUsage: number): string[] {
    const recommendations: string[] = [];

    if (warnings.includes("Very slow frame processing detected")) {
      recommendations.push("Consider using preview mode or reducing resolution");
      recommendations.push("Lower frame rate to improve performance");
    } else if (warnings.includes("Slow frame processing")) {
      recommendations.push("Consider reducing frame rate or simplifying effects");
    }

    if (warnings.includes("High memory usage (>1GB)")) {
      recommendations.push("Reduce resolution or animation duration");
      recommendations.push("Close other browser tabs to free memory");
    } else if (warnings.includes("Elevated memory usage")) {
      recommendations.push("Monitor memory usage closely");
    }

    if (warnings.includes("Very high resolution may cause performance issues")) {
      recommendations.push("Consider using preview mode for testing");
      recommendations.push("Export during off-peak hours");
    }

    if (warnings.includes("Long GIF animations may have large file sizes")) {
      recommendations.push("Consider WebM format for longer animations");
      recommendations.push("Reduce frame count or use lower frame rate");
    }

    if (warnings.includes("High-resolution GIFs may be very large")) {
      recommendations.push("Consider PNG sequence or WebM for high-resolution exports");
    }

    return recommendations;
  }

  // Static method to get performance recommendations for a config
  static analyzeConfig(config: PerformanceConfig): {
    severity: "low" | "medium" | "high";
    warnings: string[];
    recommendations: string[];
    estimatedDuration: number;
    estimatedFileSize: number;
  } {
    const pixelCount = config.width * config.height;
    const totalPixels = pixelCount * config.totalFrames;
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Estimate processing time (very rough)
    const baseTimePerPixel = 0.001; // ms per pixel
    const formatMultiplier = config.format === "gif" ? 2 : config.format === "png" ? 1.5 : 1;
    const estimatedDuration = totalPixels * baseTimePerPixel * formatMultiplier;

    // Estimate file size (very rough)
    let estimatedFileSize = 0;
    if (config.format === "webm") {
      // WebM: roughly 1MB per minute at 1080p
      const duration = config.totalFrames / config.fps;
      const resolutionFactor = pixelCount / 2073600; // relative to 1080p
      estimatedFileSize = duration / 60 * resolutionFactor * 1024 * 1024; // bytes
    } else if (config.format === "gif") {
      // GIF: roughly 100KB per frame at medium resolution
      const frameSizeFactor = pixelCount / 518400; // relative to 720x720
      estimatedFileSize = config.totalFrames * frameSizeFactor * 100 * 1024; // bytes
    } else {
      // PNG: roughly 500KB per frame
      const frameSizeFactor = pixelCount / 2073600; // relative to 1080p
      estimatedFileSize = config.totalFrames * frameSizeFactor * 500 * 1024; // bytes
    }

    // Generate warnings based on analysis
    if (totalPixels > 500000000) { // 500M pixels
      warnings.push("Extremely large export - may take hours");
    } else if (totalPixels > 100000000) { // 100M pixels
      warnings.push("Large export - may take significant time");
    }

    if (estimatedFileSize > 100 * 1024 * 1024) { // >100MB
      warnings.push("Very large output file expected");
    } else if (estimatedFileSize > 50 * 1024 * 1024) { // >50MB
      warnings.push("Large output file expected");
    }

    // Severity assessment
    let severity: "low" | "medium" | "high" = "low";
    if (warnings.some(w => w.includes("Extremely") || w.includes("Very large"))) {
      severity = "high";
    } else if (warnings.some(w => w.includes("Large") || w.includes("significant"))) {
      severity = "medium";
    }

    // Generate recommendations
    if (severity === "high") {
      recommendations.push("Strongly consider reducing resolution or duration");
      recommendations.push("Use preview mode for testing");
      recommendations.push("Plan for extended export time");
    } else if (severity === "medium") {
      recommendations.push("Consider optimizing settings for faster export");
      recommendations.push("Ensure stable browser environment");
    }

    return {
      severity,
      warnings,
      recommendations,
      estimatedDuration,
      estimatedFileSize
    };
  }
}

// Utility functions for UI integration
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)}GB`;
}

export function formatMemory(mb: number): string {
  if (mb === 0) return "N/A";
  if (mb < 1) return `${(mb * 1024).toFixed(0)}KB`;
  return `${mb.toFixed(1)}MB`;
}

export function getPerformanceBadgeColor(severity: "low" | "medium" | "high"): string {
  switch (severity) {
    case "low": return "text-green-600 bg-green-100";
    case "medium": return "text-yellow-600 bg-yellow-100";
    case "high": return "text-red-600 bg-red-100";
  }
}