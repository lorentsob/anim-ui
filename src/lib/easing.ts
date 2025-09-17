/**
 * Easing functions for smooth animations
 * All functions take a time value between 0 and 1 and return the eased value
 */

export type EasingType = "linear" | "easeIn" | "easeOut" | "easeInOut" | "easeInBack" | "easeOutBack" | "easeInOutBack" | "easeInElastic" | "easeOutElastic" | "easeInOutElastic" | "easeInBounce" | "easeOutBounce" | "easeInOutBounce";

export const easingFunctions: Record<EasingType, (t: number) => number> = {
  linear: (t: number) => t,

  // Cubic easing
  easeIn: (t: number) => t * t * t,
  easeOut: (t: number) => 1 - Math.pow(1 - t, 3),
  easeInOut: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,

  // Back easing (overshoot)
  easeInBack: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  },
  easeOutBack: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  easeInOutBack: (t: number) => {
    const c1 = 1.70158;
    const c2 = c1 * 1.525;
    return t < 0.5
      ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
  },

  // Elastic easing
  easeInElastic: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
  },
  easeOutElastic: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  easeInOutElastic: (t: number) => {
    const c5 = (2 * Math.PI) / 4.5;
    return t === 0 ? 0 : t === 1 ? 1 : t < 0.5
      ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
      : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
  },

  // Bounce easing
  easeInBounce: (t: number) => 1 - easingFunctions.easeOutBounce(1 - t),
  easeOutBounce: (t: number) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  },
  easeInOutBounce: (t: number) => t < 0.5
    ? (1 - easingFunctions.easeOutBounce(1 - 2 * t)) / 2
    : (1 + easingFunctions.easeOutBounce(2 * t - 1)) / 2,
};

/**
 * Apply easing to a normalized time value (0-1)
 */
export function applyEasing(easing: EasingType, t: number): number {
  // Clamp t to 0-1 range
  t = Math.max(0, Math.min(1, t));

  const easingFn = easingFunctions[easing];
  if (!easingFn) {
    console.warn(`Unknown easing type: ${easing}, falling back to linear`);
    return t;
  }

  return easingFn(t);
}

/**
 * Get all available easing types with display names
 */
export const easingOptions: { value: EasingType; label: string }[] = [
  { value: "linear", label: "Linear" },
  { value: "easeIn", label: "Ease In" },
  { value: "easeOut", label: "Ease Out" },
  { value: "easeInOut", label: "Ease In Out" },
  { value: "easeInBack", label: "Ease In Back" },
  { value: "easeOutBack", label: "Ease Out Back" },
  { value: "easeInOutBack", label: "Ease In Out Back" },
  { value: "easeInElastic", label: "Ease In Elastic" },
  { value: "easeOutElastic", label: "Ease Out Elastic" },
  { value: "easeInOutElastic", label: "Ease In Out Elastic" },
  { value: "easeInBounce", label: "Ease In Bounce" },
  { value: "easeOutBounce", label: "Ease Out Bounce" },
  { value: "easeInOutBounce", label: "Ease In Out Bounce" },
];