import type { Effect } from "./types";
import { asciiDither } from "./asciiDither";
import { cellular1D } from "./cellular1D";
import { orbitingBars } from "./orbitingBars";
import { rippleQuantized } from "./rippleQuantized";
import { scanlineReveal } from "./scanlineReveal";
import { squareDrift } from "./squareDrift";

export const effects: Effect[] = [
  squareDrift,
  asciiDither,
  cellular1D,
  scanlineReveal,
  orbitingBars,
  rippleQuantized,
];

export const getEffect = (id: string): Effect => {
  return effects.find((effect) => effect.id === id) ?? effects[0];
};
