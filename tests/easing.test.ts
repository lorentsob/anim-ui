import { describe, it, expect } from "vitest";
import { applyEasing, easingFunctions, type EasingType } from "../src/lib/easing";

describe("Easing Functions", () => {
  it("should return 0 for t=0 and 1 for t=1 for all easing functions", () => {
    Object.keys(easingFunctions).forEach(easingType => {
      const easing = easingType as EasingType;
      expect(applyEasing(easing, 0)).toBeCloseTo(0, 5);
      expect(applyEasing(easing, 1)).toBeCloseTo(1, 5);
    });
  });

  it("should handle linear easing correctly", () => {
    expect(applyEasing("linear", 0.5)).toBe(0.5);
    expect(applyEasing("linear", 0.25)).toBe(0.25);
    expect(applyEasing("linear", 0.75)).toBe(0.75);
  });

  it("should apply cubic easing functions correctly", () => {
    // easeIn should be slower at the beginning
    expect(applyEasing("easeIn", 0.5)).toBeLessThan(0.5);

    // easeOut should be faster at the beginning
    expect(applyEasing("easeOut", 0.5)).toBeGreaterThan(0.5);

    // easeInOut should be slower at both ends
    expect(applyEasing("easeInOut", 0.25)).toBeLessThan(0.25);
    expect(applyEasing("easeInOut", 0.75)).toBeGreaterThan(0.75);
  });

  it("should handle elastic easing bounce behavior", () => {
    // Elastic easing can overshoot beyond 0-1 range during animation
    const elasticOut = applyEasing("easeOutElastic", 0.8);
    // Should be close to 1 but may overshoot slightly
    expect(elasticOut).toBeGreaterThan(0.9);
  });

  it("should clamp input values to 0-1 range", () => {
    expect(applyEasing("linear", -0.5)).toBe(0);
    expect(applyEasing("linear", 1.5)).toBe(1);
  });

  it("should handle unknown easing types gracefully", () => {
    // @ts-ignore - testing invalid input
    expect(applyEasing("invalid" as EasingType, 0.5)).toBe(0.5);
  });
});

describe("Timeline Store Integration", () => {
  it("should be compatible with timeline store keyframe interface", () => {
    // Test that all easing types are valid for keyframes
    const validEasings: EasingType[] = [
      "linear", "easeIn", "easeOut", "easeInOut",
      "easeInBack", "easeOutBack", "easeInOutBack",
      "easeInElastic", "easeOutElastic", "easeInOutElastic",
      "easeInBounce", "easeOutBounce", "easeInOutBounce"
    ];

    validEasings.forEach(easing => {
      expect(easingFunctions[easing]).toBeDefined();
      expect(typeof easingFunctions[easing]).toBe("function");
    });
  });
});