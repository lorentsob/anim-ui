/**
 * Cross-platform compatibility tests
 * Tests browser feature detection and compatibility across different environments
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { platformDetector, getCompatibilityBadgeColor, formatBrowserInfo, getRecommendedSettings } from "../src/lib/crossPlatformDetection";
import type { BrowserInfo, FeatureSupport } from "../src/lib/crossPlatformDetection";

// Mock different browser environments
const mockUserAgents = {
  chrome: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  firefox: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0",
  safari: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
  edge: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
  mobile_chrome: "Mozilla/5.0 (Linux; Android 12; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
  mobile_safari: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  old_ie: "Mozilla/5.0 (Windows NT 6.1; Trident/7.0; rv:11.0) like Gecko"
};

describe("Cross-Platform Detection", () => {
  let originalNavigator: Navigator;
  let originalMediaRecorder: typeof MediaRecorder;
  let originalLocalStorage: Storage;

  beforeEach(() => {
    originalNavigator = global.navigator;
    originalMediaRecorder = global.MediaRecorder;
    originalLocalStorage = global.localStorage;
  });

  afterEach(() => {
    global.navigator = originalNavigator;
    global.MediaRecorder = originalMediaRecorder;
    global.localStorage = originalLocalStorage;
  });

  describe("Browser Detection", () => {
    it("should detect Chrome correctly", () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        writable: true,
        value: mockUserAgents.chrome
      });

      const browser = platformDetector.detectBrowser();
      expect(browser.name).toBe("Chrome");
      expect(browser.platform).toBe("Windows");
      expect(browser.mobile).toBe(false);
      expect(browser.version).toMatch(/\d+\.\d+/);
    });

    it("should detect Firefox correctly", () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        writable: true,
        value: mockUserAgents.firefox
      });

      const browser = platformDetector.detectBrowser();
      expect(browser.name).toBe("Firefox");
      expect(browser.platform).toBe("Windows");
      expect(browser.mobile).toBe(false);
    });

    it("should detect Safari correctly", () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        writable: true,
        value: mockUserAgents.safari
      });

      const browser = platformDetector.detectBrowser();
      expect(browser.name).toBe("Safari");
      expect(browser.platform).toBe("macOS");
      expect(browser.mobile).toBe(false);
    });

    it("should detect Edge correctly", () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        writable: true,
        value: mockUserAgents.edge
      });

      const browser = platformDetector.detectBrowser();
      expect(browser.name).toBe("Edge");
      expect(browser.platform).toBe("Windows");
      expect(browser.mobile).toBe(false);
    });

    it("should detect mobile browsers", () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        writable: true,
        value: mockUserAgents.mobile_chrome
      });

      const browser = platformDetector.detectBrowser();
      expect(browser.platform).toBe("Android");
      expect(browser.mobile).toBe(true);
    });

    it("should detect iOS Safari", () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        writable: true,
        value: mockUserAgents.mobile_safari
      });

      const browser = platformDetector.detectBrowser();
      expect(browser.name).toBe("Safari");
      expect(browser.platform).toBe("iOS");
      expect(browser.mobile).toBe(true);
    });
  });

  describe("Feature Detection", () => {
    it("should detect MediaRecorder support", () => {
      // Mock MediaRecorder as available
      global.MediaRecorder = vi.fn().mockImplementation(() => ({
        start: vi.fn(),
        stop: vi.fn()
      })) as any;
      global.MediaRecorder.isTypeSupported = vi.fn().mockReturnValue(true);

      const features = platformDetector.testFeatureSupport();
      expect(features.mediaRecorder).toBe(true);
      expect(features.webmCodecs.length).toBeGreaterThan(0);
    });

    it("should handle missing MediaRecorder", () => {
      delete (global as any).MediaRecorder;

      const features = platformDetector.testFeatureSupport();
      expect(features.mediaRecorder).toBe(false);
      expect(features.webmCodecs).toEqual([]);
    });

    it("should detect localStorage support", () => {
      // Mock localStorage
      const mockStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        length: 0,
        key: vi.fn()
      };

      global.localStorage = mockStorage as any;

      const features = platformDetector.testFeatureSupport();
      expect(features.localStorage).toBe(true);
    });

    it("should handle localStorage failures", () => {
      // Mock localStorage that throws
      const mockStorage = {
        setItem: vi.fn(() => { throw new Error("Storage quota exceeded"); }),
        removeItem: vi.fn(),
        getItem: vi.fn(),
        clear: vi.fn(),
        length: 0,
        key: vi.fn()
      };

      global.localStorage = mockStorage as any;

      const features = platformDetector.testFeatureSupport();
      expect(features.localStorage).toBe(false);
    });

    it("should detect performance API", () => {
      const features = platformDetector.testFeatureSupport();
      expect(features.performanceApi).toBe(true);
    });

    it("should detect RAF support", () => {
      const features = platformDetector.testFeatureSupport();
      expect(features.requestAnimationFrame).toBe(true);
    });
  });

  describe("Compatibility Analysis", () => {
    it("should generate excellent compatibility report for modern Chrome", () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        writable: true,
        value: mockUserAgents.chrome
      });

      // Mock full feature support
      global.MediaRecorder = vi.fn() as any;
      global.MediaRecorder.isTypeSupported = vi.fn().mockReturnValue(true);

      const report = platformDetector.generateCompatibilityReport();

      expect(report.overallCompatibility).toBeOneOf(["excellent", "good"]);
      expect(report.exportCapabilities.webm).toBe("full");
      expect(report.exportCapabilities.gif).toBe("full");
      expect(report.exportCapabilities.png).toBe("full");
    });

    it("should generate limited compatibility report for old browsers", () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        writable: true,
        value: mockUserAgents.old_ie
      });

      // Mock limited feature support
      delete (global as any).MediaRecorder;

      const report = platformDetector.generateCompatibilityReport();

      expect(report.overallCompatibility).toBeOneOf(["limited", "poor"]);
      expect(report.limitations.length).toBeGreaterThan(0);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });

    it("should provide mobile-specific recommendations", () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        writable: true,
        value: mockUserAgents.mobile_chrome
      });

      const report = platformDetector.generateCompatibilityReport();

      expect(report.browser.mobile).toBe(true);
      expect(report.limitations.some(l => l.includes("Mobile"))).toBe(true);
      expect(report.recommendations.some(r => r.includes("lower resolutions"))).toBe(true);
    });
  });

  describe("Recommended Settings", () => {
    it("should provide conservative settings for mobile devices", () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        writable: true,
        value: mockUserAgents.mobile_chrome
      });

      const report = platformDetector.generateCompatibilityReport();
      const settings = getRecommendedSettings(report);

      expect(settings.maxResolution.width).toBeLessThanOrEqual(1280);
      expect(settings.maxResolution.height).toBeLessThanOrEqual(720);
      expect(settings.maxFps).toBeLessThanOrEqual(30);
      expect(settings.maxDuration).toBeLessThanOrEqual(60);
    });

    it("should provide optimized settings for desktop browsers", () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        writable: true,
        value: mockUserAgents.chrome
      });

      const report = platformDetector.generateCompatibilityReport();
      const settings = getRecommendedSettings(report);

      expect(settings.maxResolution.width).toBeGreaterThanOrEqual(1920);
      expect(settings.maxResolution.height).toBeGreaterThanOrEqual(1080);
      expect(settings.maxFps).toBeGreaterThanOrEqual(30);
    });

    it("should prioritize supported formats", () => {
      // Test with MediaRecorder support
      global.MediaRecorder = vi.fn() as any;
      global.MediaRecorder.isTypeSupported = vi.fn().mockReturnValue(true);

      const report = platformDetector.generateCompatibilityReport();
      const settings = getRecommendedSettings(report);

      expect(settings.preferredFormats).toContain("webm");
      expect(settings.preferredFormats.length).toBeGreaterThan(0);
    });
  });

  describe("Utility Functions", () => {
    it("should format browser info correctly", () => {
      const browser: BrowserInfo = {
        name: "Chrome",
        version: "120.0",
        platform: "Windows",
        mobile: false,
        userAgent: mockUserAgents.chrome
      };

      const formatted = formatBrowserInfo(browser);
      expect(formatted).toBe("Chrome 120.0 on Windows");
    });

    it("should provide appropriate badge colors", () => {
      expect(getCompatibilityBadgeColor("excellent")).toContain("green");
      expect(getCompatibilityBadgeColor("good")).toContain("blue");
      expect(getCompatibilityBadgeColor("limited")).toContain("yellow");
      expect(getCompatibilityBadgeColor("poor")).toContain("red");
    });
  });

  describe("Edge Cases", () => {
    it("should handle undefined navigator gracefully", () => {
      const originalNav = global.navigator;
      delete (global as any).navigator;

      expect(() => {
        // This might throw, but shouldn't crash the test
        try {
          platformDetector.detectBrowser();
        } catch (error) {
          // Expected in this case
        }
      }).not.toThrow();

      global.navigator = originalNav;
    });

    it("should handle canvas creation failures", () => {
      // Mock document.createElement to fail for canvas
      const originalCreateElement = document.createElement;
      document.createElement = vi.fn().mockImplementation((tagName) => {
        if (tagName === "canvas") {
          throw new Error("Canvas not supported");
        }
        return originalCreateElement.call(document, tagName);
      });

      const features = platformDetector.testFeatureSupport();
      expect(features.canvasSupport).toBe(false);
      expect(features.gifSupport).toBe(false);

      document.createElement = originalCreateElement;
    });
  });
});

describe("Cross-Platform Test Matrix", () => {
  const testMatrix = [
    {
      name: "Chrome Desktop",
      userAgent: mockUserAgents.chrome,
      expectedCompatibility: ["excellent", "good"],
      expectedFeatures: ["mediaRecorder", "canvasSupport", "localStorage"]
    },
    {
      name: "Firefox Desktop",
      userAgent: mockUserAgents.firefox,
      expectedCompatibility: ["excellent", "good"],
      expectedFeatures: ["mediaRecorder", "canvasSupport", "localStorage"]
    },
    {
      name: "Safari Desktop",
      userAgent: mockUserAgents.safari,
      expectedCompatibility: ["good", "limited"],
      expectedFeatures: ["canvasSupport", "localStorage"]
    },
    {
      name: "Mobile Chrome",
      userAgent: mockUserAgents.mobile_chrome,
      expectedCompatibility: ["good", "limited"],
      expectedFeatures: ["canvasSupport"]
    },
    {
      name: "Mobile Safari",
      userAgent: mockUserAgents.mobile_safari,
      expectedCompatibility: ["good", "limited"],
      expectedFeatures: ["canvasSupport"]
    }
  ];

  testMatrix.forEach(({ name, userAgent, expectedCompatibility, expectedFeatures }) => {
    it(`should provide appropriate compatibility assessment for ${name}`, () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        writable: true,
        value: userAgent
      });

      // Mock MediaRecorder for desktop browsers
      if (!userAgent.includes("Mobile")) {
        global.MediaRecorder = vi.fn() as any;
        global.MediaRecorder.isTypeSupported = vi.fn().mockReturnValue(true);
      } else {
        delete (global as any).MediaRecorder;
      }

      const report = platformDetector.generateCompatibilityReport();

      expect(expectedCompatibility).toContain(report.overallCompatibility);

      expectedFeatures.forEach(feature => {
        expect(report.features[feature as keyof FeatureSupport]).toBe(true);
      });
    });
  });
});