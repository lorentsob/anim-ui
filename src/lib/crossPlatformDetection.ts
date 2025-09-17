/**
 * Cross-platform detection and compatibility testing
 * Provides comprehensive browser and platform feature detection
 */

export type BrowserInfo = {
  name: string;
  version: string;
  platform: string;
  mobile: boolean;
  userAgent: string;
};

export type FeatureSupport = {
  mediaRecorder: boolean;
  webmCodecs: string[];
  gifSupport: boolean;
  pngSupport: boolean;
  canvasSupport: boolean;
  webglSupport: boolean;
  fileApiSupport: boolean;
  downloadSupport: boolean;
  streamSupport: boolean;
  performanceApi: boolean;
  requestAnimationFrame: boolean;
  localStorage: boolean;
  worker: boolean;
  offscreenCanvas: boolean;
  p5Compatibility: boolean;
};

export type CompatibilityReport = {
  browser: BrowserInfo;
  features: FeatureSupport;
  overallCompatibility: "excellent" | "good" | "limited" | "poor";
  limitations: string[];
  recommendations: string[];
  exportCapabilities: {
    webm: "full" | "limited" | "none";
    gif: "full" | "limited" | "none";
    png: "full" | "limited" | "none";
  };
};

class CrossPlatformDetector {
  private static instance: CrossPlatformDetector;

  static getInstance(): CrossPlatformDetector {
    if (!CrossPlatformDetector.instance) {
      CrossPlatformDetector.instance = new CrossPlatformDetector();
    }
    return CrossPlatformDetector.instance;
  }

  detectBrowser(): BrowserInfo {
    const ua = navigator.userAgent;
    let name = "Unknown";
    let version = "Unknown";

    // Browser detection
    if (ua.includes("Chrome") && !ua.includes("Edg")) {
      name = "Chrome";
      const match = ua.match(/Chrome\/(\d+\.\d+)/);
      version = match ? match[1] : "Unknown";
    } else if (ua.includes("Firefox")) {
      name = "Firefox";
      const match = ua.match(/Firefox\/(\d+\.\d+)/);
      version = match ? match[1] : "Unknown";
    } else if (ua.includes("Safari") && !ua.includes("Chrome")) {
      name = "Safari";
      const match = ua.match(/Version\/(\d+\.\d+)/);
      version = match ? match[1] : "Unknown";
    } else if (ua.includes("Edg")) {
      name = "Edge";
      const match = ua.match(/Edg\/(\d+\.\d+)/);
      version = match ? match[1] : "Unknown";
    }

    // Platform detection
    let platform = "Unknown";
    if (ua.includes("Windows")) platform = "Windows";
    else if (ua.includes("Mac")) platform = "macOS";
    else if (ua.includes("Linux")) platform = "Linux";
    else if (ua.includes("Android")) platform = "Android";
    else if (ua.includes("iPhone") || ua.includes("iPad")) platform = "iOS";

    const mobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);

    return {
      name,
      version,
      platform,
      mobile,
      userAgent: ua
    };
  }

  testFeatureSupport(): FeatureSupport {
    return {
      mediaRecorder: this.testMediaRecorder(),
      webmCodecs: this.getWebMCodecs(),
      gifSupport: this.testGifSupport(),
      pngSupport: this.testPngSupport(),
      canvasSupport: this.testCanvasSupport(),
      webglSupport: this.testWebGLSupport(),
      fileApiSupport: this.testFileApiSupport(),
      downloadSupport: this.testDownloadSupport(),
      streamSupport: this.testStreamSupport(),
      performanceApi: this.testPerformanceApi(),
      requestAnimationFrame: this.testRequestAnimationFrame(),
      localStorage: this.testLocalStorage(),
      worker: this.testWorkerSupport(),
      offscreenCanvas: this.testOffscreenCanvas(),
      p5Compatibility: this.testP5Compatibility()
    };
  }

  generateCompatibilityReport(): CompatibilityReport {
    const browser = this.detectBrowser();
    const features = this.testFeatureSupport();

    const limitations: string[] = [];
    const recommendations: string[] = [];

    // Analyze limitations
    if (!features.mediaRecorder) {
      limitations.push("MediaRecorder API not supported - WebM export unavailable");
      recommendations.push("Use GIF or PNG export instead");
    }

    if (features.webmCodecs.length === 0 && features.mediaRecorder) {
      limitations.push("No WebM codecs available");
      recommendations.push("Update browser for better WebM support");
    }

    if (!features.canvasSupport) {
      limitations.push("Canvas API not supported - app will not function");
      recommendations.push("Use a modern browser with Canvas support");
    }

    if (!features.performanceApi) {
      limitations.push("Performance API limited - timing data unavailable");
    }

    if (!features.localStorage) {
      limitations.push("Local storage unavailable - presets cannot be saved");
      recommendations.push("Check browser privacy settings");
    }

    if (browser.mobile) {
      limitations.push("Mobile device - performance may be limited");
      recommendations.push("Use lower resolutions and shorter durations");
    }

    if (!features.offscreenCanvas) {
      limitations.push("OffscreenCanvas not supported - export performance may be reduced");
    }

    // Determine overall compatibility
    let overallCompatibility: "excellent" | "good" | "limited" | "poor";
    if (limitations.length === 0) {
      overallCompatibility = "excellent";
    } else if (limitations.length <= 2 && features.canvasSupport) {
      overallCompatibility = "good";
    } else if (features.canvasSupport) {
      overallCompatibility = "limited";
    } else {
      overallCompatibility = "poor";
    }

    // Determine export capabilities
    const exportCapabilities = {
      webm: features.mediaRecorder && features.webmCodecs.length > 0 ? "full" as const :
             features.mediaRecorder ? "limited" as const : "none" as const,
      gif: features.canvasSupport ? "full" as const : "none" as const,
      png: features.canvasSupport && features.fileApiSupport ? "full" as const :
           features.canvasSupport ? "limited" as const : "none" as const
    };

    return {
      browser,
      features,
      overallCompatibility,
      limitations,
      recommendations,
      exportCapabilities
    };
  }

  private testMediaRecorder(): boolean {
    return typeof MediaRecorder !== "undefined";
  }

  private getWebMCodecs(): string[] {
    if (!this.testMediaRecorder()) return [];

    const codecs = [
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm;codecs=h264",
      "video/webm"
    ];

    return codecs.filter(codec => MediaRecorder.isTypeSupported(codec));
  }

  private testGifSupport(): boolean {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1;
      const ctx = canvas.getContext("2d");
      return !!ctx;
    } catch {
      return false;
    }
  }

  private testPngSupport(): boolean {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1;
      return canvas.toDataURL("image/png").indexOf("image/png") === 5;
    } catch {
      return false;
    }
  }

  private testCanvasSupport(): boolean {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      return !!ctx;
    } catch {
      return false;
    }
  }

  private testWebGLSupport(): boolean {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      return !!gl;
    } catch {
      return false;
    }
  }

  private testFileApiSupport(): boolean {
    return typeof File !== "undefined" &&
           typeof FileReader !== "undefined" &&
           typeof Blob !== "undefined";
  }

  private testDownloadSupport(): boolean {
    const a = document.createElement("a");
    return "download" in a;
  }

  private testStreamSupport(): boolean {
    try {
      const canvas = document.createElement("canvas");
      return typeof canvas.captureStream === "function";
    } catch {
      return false;
    }
  }

  private testPerformanceApi(): boolean {
    return typeof performance !== "undefined" &&
           typeof performance.now === "function";
  }

  private testRequestAnimationFrame(): boolean {
    return typeof requestAnimationFrame === "function";
  }

  private testLocalStorage(): boolean {
    try {
      const test = "__test__";
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  private testWorkerSupport(): boolean {
    return typeof Worker !== "undefined";
  }

  private testOffscreenCanvas(): boolean {
    return typeof OffscreenCanvas !== "undefined";
  }

  private testP5Compatibility(): boolean {
    // Check for basic requirements for p5.js
    return this.testCanvasSupport() &&
           this.testRequestAnimationFrame() &&
           typeof document !== "undefined" &&
           typeof window !== "undefined";
  }
}

export const platformDetector = CrossPlatformDetector.getInstance();

// Utility functions for UI integration
export function getCompatibilityBadgeColor(compatibility: string): string {
  switch (compatibility) {
    case "excellent": return "text-green-700 bg-green-100";
    case "good": return "text-blue-700 bg-blue-100";
    case "limited": return "text-yellow-700 bg-yellow-100";
    case "poor": return "text-red-700 bg-red-100";
    default: return "text-gray-700 bg-gray-100";
  }
}

export function formatBrowserInfo(browser: BrowserInfo): string {
  return `${browser.name} ${browser.version} on ${browser.platform}`;
}

export function getRecommendedSettings(report: CompatibilityReport): {
  maxResolution: { width: number; height: number };
  maxFps: number;
  maxDuration: number;
  preferredFormats: string[];
} {
  const { browser, features, overallCompatibility } = report;

  let maxResolution = { width: 1920, height: 1080 };
  let maxFps = 60;
  let maxDuration = 300; // 5 minutes
  let preferredFormats = ["webm", "gif", "png"];

  // Adjust based on platform
  if (browser.mobile) {
    maxResolution = { width: 1280, height: 720 };
    maxFps = 30;
    maxDuration = 60; // 1 minute
  }

  // Adjust based on compatibility
  if (overallCompatibility === "limited" || overallCompatibility === "poor") {
    maxResolution = { width: 800, height: 600 };
    maxFps = 24;
    maxDuration = 30; // 30 seconds
  }

  // Adjust preferred formats based on support
  preferredFormats = [];
  if (features.mediaRecorder && features.webmCodecs.length > 0) {
    preferredFormats.push("webm");
  }
  if (features.gifSupport) {
    preferredFormats.push("gif");
  }
  if (features.pngSupport) {
    preferredFormats.push("png");
  }

  return {
    maxResolution,
    maxFps,
    maxDuration,
    preferredFormats
  };
}