import { describe, expect, it } from "vitest";
import { calculateOptimalSettings, getQualityDescription, shouldWarnLargeExport } from "@/lib/qualityManager";

describe("qualityManager", () => {
  it("calculates optimal settings for small animations", () => {
    const settings = calculateOptimalSettings(320, 320, 12); // ~1.2M complexity

    expect(settings.previewScale).toBe(0.7); // Still in medium tier
    expect(settings.previewFPS).toBe(12);
    expect(settings.autoScale).toBe(true);
  });

  it("keeps full quality for very small animations", () => {
    const settings = calculateOptimalSettings(200, 200, 12); // ~480k complexity

    expect(settings.previewScale).toBe(1.0);
    expect(settings.previewFPS).toBe(12);
    expect(settings.autoScale).toBe(false);
  });

  it("scales down large animations", () => {
    const settings = calculateOptimalSettings(3840, 2160, 30); // 4K@30fps

    expect(settings.previewScale).toBeLessThan(1.0);
    expect(settings.previewFPS).toBeLessThanOrEqual(12);
    expect(settings.autoScale).toBe(true);
  });

  it("provides quality descriptions", () => {
    const settings = { mode: 'preview' as const, previewScale: 0.7, previewFPS: 24, autoScale: true };
    const description = getQualityDescription(settings, 30);

    expect(description).toContain("70%");
    expect(description).toContain("24fps");
  });

  it("warns for large exports", () => {
    const result = shouldWarnLargeExport(3840, 2160, 30, 30); // 4K@30fps for 30s

    expect(result.warn).toBe(true);
    expect(result.reason).toContain("Large export");
  });

  it("does not warn for reasonable exports", () => {
    const result = shouldWarnLargeExport(1920, 1080, 24, 10); // HD@24fps for 10s

    expect(result.warn).toBe(false);
  });
});