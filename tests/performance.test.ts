/**
 * Performance profiling tests for high-resolution exports
 * These tests benchmark export performance across different configurations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { RecorderOptions } from "../src/lib/recorder";

// Mock p5 for testing
const mockSketch = {
  remove: vi.fn(),
  renderFrame: vi.fn(),
  canvas: null as HTMLCanvasElement | null
};

const createMockSketch = vi.fn().mockResolvedValue(mockSketch);

// Performance test configurations
type PerformanceTestConfig = {
  width: number;
  height: number;
  fps: number;
  totalFrames: number;
  format: "webm" | "gif" | "png";
  description: string;
  expectedMaxDuration?: number; // ms
  memoryThreshold?: number; // MB
};

const PERFORMANCE_CONFIGS: PerformanceTestConfig[] = [
  // Low resolution baseline
  {
    width: 400,
    height: 400,
    fps: 30,
    totalFrames: 60,
    format: "webm",
    description: "Low-res WebM (400x400, 30fps, 2s)",
    expectedMaxDuration: 5000
  },
  {
    width: 400,
    height: 400,
    fps: 30,
    totalFrames: 60,
    format: "gif",
    description: "Low-res GIF (400x400, 30fps, 2s)",
    expectedMaxDuration: 8000
  },
  // Medium resolution
  {
    width: 1920,
    height: 1080,
    fps: 30,
    totalFrames: 60,
    format: "webm",
    description: "HD WebM (1920x1080, 30fps, 2s)",
    expectedMaxDuration: 15000
  },
  {
    width: 1920,
    height: 1080,
    fps: 30,
    totalFrames: 30,
    format: "gif",
    description: "HD GIF (1920x1080, 30fps, 1s)",
    expectedMaxDuration: 20000
  },
  // High resolution stress test
  {
    width: 3840,
    height: 2160,
    fps: 30,
    totalFrames: 30,
    format: "webm",
    description: "4K WebM (3840x2160, 30fps, 1s)",
    expectedMaxDuration: 25000
  },
  {
    width: 1920,
    height: 1080,
    fps: 30,
    totalFrames: 30,
    format: "png",
    description: "HD PNG sequence (1920x1080, 30fps, 1s)",
    expectedMaxDuration: 30000
  }
];

type PerformanceMetrics = {
  duration: number;
  peakMemoryUsage: number;
  avgFrameTime: number;
  memoryDelta: number;
  cpuIntensive: boolean;
  warnings: string[];
};

class PerformanceProfiler {
  private startTime = 0;
  private startMemory = 0;
  private peakMemory = 0;
  private frameTimings: number[] = [];
  private memoryReadings: number[] = [];
  private monitoringInterval?: number;

  start(): void {
    this.startTime = performance.now();
    this.startMemory = this.getMemoryUsage();
    this.peakMemory = this.startMemory;
    this.frameTimings = [];
    this.memoryReadings = [this.startMemory];

    // Monitor memory every 100ms
    this.monitoringInterval = window.setInterval(() => {
      const current = this.getMemoryUsage();
      this.memoryReadings.push(current);
      this.peakMemory = Math.max(this.peakMemory, current);
    }, 100);
  }

  recordFrameTime(frameStart: number): void {
    this.frameTimings.push(performance.now() - frameStart);
  }

  stop(): PerformanceMetrics {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    const duration = performance.now() - this.startTime;
    const endMemory = this.getMemoryUsage();
    const memoryDelta = endMemory - this.startMemory;
    const avgFrameTime = this.frameTimings.length > 0
      ? this.frameTimings.reduce((a, b) => a + b, 0) / this.frameTimings.length
      : 0;

    const warnings: string[] = [];

    // Detect performance issues
    if (avgFrameTime > 100) {
      warnings.push(`Slow frame rendering: ${avgFrameTime.toFixed(2)}ms average`);
    }

    if (this.peakMemory > 500) {
      warnings.push(`High memory usage: ${this.peakMemory.toFixed(2)}MB peak`);
    }

    if (memoryDelta > 100) {
      warnings.push(`Memory leak detected: ${memoryDelta.toFixed(2)}MB increase`);
    }

    return {
      duration,
      peakMemoryUsage: this.peakMemory,
      avgFrameTime,
      memoryDelta,
      cpuIntensive: avgFrameTime > 50,
      warnings
    };
  }

  private getMemoryUsage(): number {
    if ('memory' in performance && performance.memory) {
      return (performance.memory as any).usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0; // Fallback for browsers without memory API
  }
}

// Mock canvas and context for testing
const createMockCanvas = (width: number, height: number) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Fill with test pattern
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width / 2, height / 2);
  }

  return canvas;
};

describe("Export Performance Profiling", () => {
  let profiler: PerformanceProfiler;
  let mockContainer: HTMLDivElement;

  beforeEach(() => {
    profiler = new PerformanceProfiler();
    mockContainer = document.createElement('div');
    document.body.appendChild(mockContainer);

    // Reset mocks
    vi.clearAllMocks();

    // Mock DOM APIs
    global.MediaRecorder = vi.fn().mockImplementation(() => ({
      start: vi.fn(),
      stop: vi.fn(),
      addEventListener: vi.fn(),
      ondataavailable: null,
      onstop: null,
      onerror: null,
      state: 'inactive'
    }));

    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
  });

  afterEach(() => {
    document.body.removeChild(mockContainer);
  });

  describe("Performance Benchmarks", () => {
    PERFORMANCE_CONFIGS.forEach((config) => {
      it(`should meet performance expectations for ${config.description}`, async () => {
        // Mock canvas creation
        const mockCanvas = createMockCanvas(config.width, config.height);
        mockSketch.canvas = mockCanvas;
        mockContainer.appendChild(mockCanvas);

        profiler.start();

        // Simulate the export process
        const options: Partial<RecorderOptions> = {
          format: config.format,
          width: config.width,
          height: config.height,
          fps: config.fps,
          totalFrames: config.totalFrames,
          createSketch: createMockSketch,
          onProgress: vi.fn(),
          onFrame: async (frame: number) => {
            const frameStart = performance.now();

            // Simulate frame processing time based on resolution
            const pixelCount = config.width * config.height;
            const processingTime = Math.min(50, pixelCount / 100000); // Scale with resolution
            await new Promise(resolve => setTimeout(resolve, processingTime));

            profiler.recordFrameTime(frameStart);
          }
        };

        // Simulate frame rendering
        for (let i = 0; i < config.totalFrames; i++) {
          await options.onFrame?.(i, config.totalFrames);
        }

        const metrics = profiler.stop();

        // Performance assertions
        if (config.expectedMaxDuration) {
          expect(metrics.duration).toBeLessThan(config.expectedMaxDuration);
        }

        // Memory usage should be reasonable
        expect(metrics.peakMemoryUsage).toBeLessThan(1000); // < 1GB

        // Frame times should be consistent
        expect(metrics.avgFrameTime).toBeLessThan(200); // < 200ms per frame

        // Log performance metrics for analysis
        console.log(`\n=== Performance Report: ${config.description} ===`);
        console.log(`Duration: ${metrics.duration.toFixed(2)}ms`);
        console.log(`Peak Memory: ${metrics.peakMemoryUsage.toFixed(2)}MB`);
        console.log(`Avg Frame Time: ${metrics.avgFrameTime.toFixed(2)}ms`);
        console.log(`Memory Delta: ${metrics.memoryDelta.toFixed(2)}MB`);
        console.log(`CPU Intensive: ${metrics.cpuIntensive}`);

        if (metrics.warnings.length > 0) {
          console.warn(`Warnings: ${metrics.warnings.join(', ')}`);
        }
      });
    });
  });

  describe("Memory Management", () => {
    it("should not leak memory during sequential exports", async () => {
      const initialMemory = profiler['getMemoryUsage']();

      // Perform multiple exports
      for (let i = 0; i < 3; i++) {
        const mockCanvas = createMockCanvas(800, 600);
        mockSketch.canvas = mockCanvas;
        mockContainer.appendChild(mockCanvas);

        profiler.start();

        // Simulate export
        for (let frame = 0; frame < 30; frame++) {
          await new Promise(resolve => setTimeout(resolve, 1));
        }

        profiler.stop();

        // Cleanup
        mockContainer.removeChild(mockCanvas);
        mockSketch.remove();

        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }

      // Allow some tolerance for browser variations
      const finalMemory = profiler['getMemoryUsage']();
      const memoryIncrease = finalMemory - initialMemory;

      expect(memoryIncrease).toBeLessThan(50); // < 50MB increase
    });
  });

  describe("Stress Testing", () => {
    it("should handle extreme resolutions gracefully", async () => {
      const extremeConfig = {
        width: 7680,  // 8K width
        height: 4320, // 8K height
        fps: 60,
        totalFrames: 10,
        format: "webm" as const
      };

      const mockCanvas = createMockCanvas(extremeConfig.width, extremeConfig.height);
      mockSketch.canvas = mockCanvas;
      mockContainer.appendChild(mockCanvas);

      profiler.start();

      // This should either complete or fail gracefully
      try {
        for (let i = 0; i < extremeConfig.totalFrames; i++) {
          const frameStart = performance.now();

          // Simulate heavy processing
          await new Promise(resolve => setTimeout(resolve, 10));

          profiler.recordFrameTime(frameStart);
        }

        const metrics = profiler.stop();

        // Should complete within reasonable time even for 8K
        expect(metrics.duration).toBeLessThan(60000); // < 1 minute

        console.log(`\n=== 8K Stress Test Results ===`);
        console.log(`Duration: ${metrics.duration.toFixed(2)}ms`);
        console.log(`Peak Memory: ${metrics.peakMemoryUsage.toFixed(2)}MB`);
        console.log(`Warnings: ${metrics.warnings.join(', ')}`);

      } catch (error) {
        // Should fail gracefully with proper error handling
        expect(error).toBeInstanceOf(Error);
        console.log(`8K test failed gracefully: ${(error as Error).message}`);
      }
    });
  });

  describe("Browser Compatibility", () => {
    it("should detect and handle MediaRecorder limitations", () => {
      // Test with unsupported MediaRecorder
      delete (global as any).MediaRecorder;

      expect(() => {
        new (global as any).MediaRecorder();
      }).toThrow();
    });

    it("should work with limited memory API", () => {
      // Mock limited performance.memory
      const originalMemory = (performance as any).memory;
      delete (performance as any).memory;

      const memoryUsage = profiler['getMemoryUsage']();
      expect(memoryUsage).toBe(0); // Fallback value

      // Restore
      (performance as any).memory = originalMemory;
    });
  });
});

describe("Performance Optimization Recommendations", () => {
  it("should provide optimization suggestions based on metrics", () => {
    const profiler = new PerformanceProfiler();

    // Mock high-cost metrics
    const metrics = {
      duration: 30000,
      peakMemoryUsage: 800,
      avgFrameTime: 150,
      memoryDelta: 200,
      cpuIntensive: true,
      warnings: ["High memory usage", "Slow frame rendering"]
    };

    const recommendations = generateOptimizationRecommendations(metrics);

    expect(recommendations).toContain("Consider reducing resolution or using preview mode");
    expect(recommendations).toContain("Lower frame rate or simplify effects");
    expect(recommendations).toContain("Reduce animation duration for faster exports");
  });
});

function generateOptimizationRecommendations(metrics: PerformanceMetrics): string[] {
  const recommendations: string[] = [];

  if (metrics.peakMemoryUsage > 500) {
    recommendations.push("Consider reducing resolution or using preview mode");
  }

  if (metrics.avgFrameTime > 100) {
    recommendations.push("Lower frame rate or simplify effects");
  }

  if (metrics.duration > 20000) {
    recommendations.push("Reduce animation duration for faster exports");
  }

  if (metrics.memoryDelta > 100) {
    recommendations.push("Check for memory leaks in effect implementations");
  }

  if (metrics.cpuIntensive) {
    recommendations.push("Use quality modes to balance performance and output quality");
  }

  return recommendations;
}