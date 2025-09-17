/**
 * Tests for the performance monitoring system
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ExportPerformanceMonitor, formatDuration, formatFileSize, formatMemory, getPerformanceBadgeColor } from "../src/lib/performanceMonitor";
import type { PerformanceConfig } from "../src/lib/performanceMonitor";

describe("ExportPerformanceMonitor", () => {
  let config: PerformanceConfig;
  let monitor: ExportPerformanceMonitor;

  beforeEach(() => {
    vi.useFakeTimers();
    config = {
      width: 1920,
      height: 1080,
      fps: 30,
      totalFrames: 60,
      format: "webm"
    };
    monitor = new ExportPerformanceMonitor(config);

    // Mock performance.now
    vi.spyOn(performance, 'now').mockImplementation(() => Date.now());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Basic monitoring functionality", () => {
    it("should start and stop monitoring", () => {
      expect(() => monitor.start()).not.toThrow();
      expect(() => monitor.stop()).not.toThrow();
    });

    it("should track frame timings", () => {
      monitor.start();

      monitor.startFrame();
      // Simulate some processing time
      vi.advanceTimersByTime(50);
      monitor.endFrame();

      const metrics = monitor.stop();
      expect(metrics.framesProcessed).toBe(1);
      expect(metrics.avgFrameTime).toBeGreaterThan(0);
    });

    it("should calculate estimated time remaining", () => {
      monitor.start();

      // Process a few frames
      for (let i = 0; i < 10; i++) {
        monitor.startFrame();
        vi.advanceTimersByTime(20); // 20ms per frame
        monitor.endFrame();
      }

      const metrics = monitor.stop();
      expect(metrics.estimatedTimeRemaining).toBeGreaterThan(0);
      expect(metrics.framesProcessed).toBe(10);
    });
  });

  describe("Warning generation", () => {
    it("should generate warnings for slow frame processing", () => {
      const slowMonitor = new ExportPerformanceMonitor(config);
      slowMonitor.start();

      // Simulate very slow frame
      slowMonitor.startFrame();
      vi.advanceTimersByTime(600); // 600ms - very slow
      slowMonitor.endFrame();

      const metrics = slowMonitor.stop();
      expect(metrics.warnings).toContain("Very slow frame processing detected");
    });

    it("should generate warnings for high resolution", () => {
      const highResConfig: PerformanceConfig = {
        width: 3840,
        height: 2160,
        fps: 30,
        totalFrames: 60,
        format: "webm"
      };

      const analysis = ExportPerformanceMonitor.analyzeConfig(highResConfig);
      // Check that some warning is generated for high resolution
      expect(analysis.warnings.length).toBeGreaterThan(0);
      expect(analysis.severity).toBeOneOf(["medium", "high"]);
    });

    it("should generate format-specific warnings", () => {
      const longGifConfig: PerformanceConfig = {
        width: 1920,
        height: 1080,
        fps: 30,
        totalFrames: 150, // Long animation
        format: "gif"
      };

      const analysis = ExportPerformanceMonitor.analyzeConfig(longGifConfig);
      // Check that warnings are generated for long/large GIF
      expect(analysis.warnings.length).toBeGreaterThan(0);
      expect(analysis.severity).toBeOneOf(["medium", "high"]);
    });
  });

  describe("Static analysis", () => {
    it("should analyze low complexity exports", () => {
      const simpleConfig: PerformanceConfig = {
        width: 400,
        height: 400,
        fps: 30,
        totalFrames: 30,
        format: "webm"
      };

      const analysis = ExportPerformanceMonitor.analyzeConfig(simpleConfig);
      expect(analysis.severity).toBe("low");
      expect(analysis.warnings.length).toBe(0);
    });

    it("should analyze high complexity exports", () => {
      const complexConfig: PerformanceConfig = {
        width: 3840,
        height: 2160,
        fps: 60,
        totalFrames: 600, // 10 seconds at 60fps in 4K
        format: "png"
      };

      const analysis = ExportPerformanceMonitor.analyzeConfig(complexConfig);
      expect(analysis.severity).toBeOneOf(["medium", "high"]);
      expect(analysis.warnings.length).toBeGreaterThan(0);
    });

    it("should provide appropriate recommendations", () => {
      const problematicConfig: PerformanceConfig = {
        width: 2560,
        height: 1440,
        fps: 60,
        totalFrames: 300,
        format: "gif"
      };

      const analysis = ExportPerformanceMonitor.analyzeConfig(problematicConfig);
      expect(analysis.recommendations.length).toBeGreaterThan(0);
      expect(analysis.severity).toBeOneOf(["medium", "high"]);
    });
  });

  describe("Memory monitoring", () => {
    it("should handle missing memory API gracefully", () => {
      const originalMemory = (performance as any).memory;
      delete (performance as any).memory;

      monitor.start();
      const metrics = monitor.stop();

      expect(metrics.memoryUsage).toBe(0);

      // Restore
      (performance as any).memory = originalMemory;
    });

    it("should track memory when available", () => {
      // Mock memory API
      (performance as any).memory = {
        usedJSHeapSize: 50 * 1024 * 1024 // 50MB
      };

      monitor.start();
      const metrics = monitor.stop();

      expect(metrics.memoryUsage).toBe(50);
    });
  });
});

describe("Utility functions", () => {
  describe("formatDuration", () => {
    it("should format milliseconds correctly", () => {
      expect(formatDuration(500)).toBe("500ms");
      expect(formatDuration(1500)).toBe("1.5s");
      expect(formatDuration(65000)).toBe("1.1m");
    });
  });

  describe("formatFileSize", () => {
    it("should format file sizes correctly", () => {
      expect(formatFileSize(500)).toBe("500B");
      expect(formatFileSize(1500)).toBe("1.5KB");
      expect(formatFileSize(1500000)).toBe("1.4MB");
      expect(formatFileSize(1500000000)).toBe("1.4GB");
    });
  });

  describe("formatMemory", () => {
    it("should format memory values correctly", () => {
      expect(formatMemory(0)).toBe("N/A");
      expect(formatMemory(0.5)).toBe("512KB");
      expect(formatMemory(1.5)).toBe("1.5MB");
    });
  });

  describe("getPerformanceBadgeColor", () => {
    it("should return appropriate colors for severity levels", () => {
      expect(getPerformanceBadgeColor("low")).toContain("green");
      expect(getPerformanceBadgeColor("medium")).toContain("yellow");
      expect(getPerformanceBadgeColor("high")).toContain("red");
    });
  });
});

describe("Integration scenarios", () => {
  it("should handle real-world export simulation", async () => {
    const config: PerformanceConfig = {
      width: 1920,
      height: 1080,
      fps: 30,
      totalFrames: 90, // 3 seconds
      format: "webm"
    };

    let updateCount = 0;
    const monitor = new ExportPerformanceMonitor(config, () => {
      updateCount++;
    });

    monitor.start();

    // Simulate rendering frames with varying processing times
    for (let i = 0; i < config.totalFrames; i++) {
      monitor.startFrame();

      // Simulate variable processing time (real-world scenario)
      const processingTime = 10 + Math.random() * 30; // 10-40ms
      await new Promise(resolve => setTimeout(resolve, processingTime));

      monitor.endFrame();
    }

    const finalMetrics = monitor.stop();

    expect(finalMetrics.framesProcessed).toBe(config.totalFrames);
    expect(finalMetrics.duration).toBeGreaterThan(0);
    expect(finalMetrics.avgFrameTime).toBeGreaterThan(0);
    expect(updateCount).toBeGreaterThan(0); // Callbacks should have been called
  });

  it("should provide actionable insights for different formats", () => {
    const formats: Array<"webm" | "gif" | "png"> = ["webm", "gif", "png"];

    formats.forEach(format => {
      const config: PerformanceConfig = {
        width: 1920,
        height: 1080,
        fps: 30,
        totalFrames: 60,
        format
      };

      const analysis = ExportPerformanceMonitor.analyzeConfig(config);

      // Each format should have specific considerations
      expect(analysis).toHaveProperty("severity");
      expect(analysis).toHaveProperty("estimatedDuration");
      expect(analysis).toHaveProperty("estimatedFileSize");

      // File size estimates should vary by format
      expect(analysis.estimatedFileSize).toBeGreaterThan(0);
    });
  });
});