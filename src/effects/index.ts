import type { Effect } from "./types";
import { asciiDither } from "./asciiDither";
import { cellular1D } from "./cellular1D";
import { orbitingBars } from "./orbitingBars";
import { rippleQuantized } from "./rippleQuantized";
import { scanlineReveal } from "./scanlineReveal";
import { squareDrift } from "./squareDrift";
import { typographic } from "./typographic";
import { grid } from "./grid";
import { particle } from "./particle";
import { geometric } from "./geometric";
import { customDemo } from "./customDemo";

export const effects: Effect[] = [
  squareDrift,
  asciiDither,
  cellular1D,
  scanlineReveal,
  orbitingBars,
  rippleQuantized,
  typographic,
  grid,
  particle,
  geometric,
  customDemo,
];

export const getEffect = (id: string): Effect => {
  return effects.find((effect) => effect.id === id) ?? effects[0];
};
