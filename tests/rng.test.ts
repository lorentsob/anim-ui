import { describe, it, expect } from "vitest";

import { createRng, hashSeed } from "@/lib/rng";

describe("rng utilities", () => {
  it("produces deterministic sequences for identical seeds", () => {
    const rngA = createRng("TEST-SEED");
    const rngB = createRng("TEST-SEED");

    const sequenceA = Array.from({ length: 5 }, () => rngA());
    const sequenceB = Array.from({ length: 5 }, () => rngB());

    expect(sequenceA).toEqual(sequenceB);
  });

  it("hashSeed is stable and non-zero for non-empty input", () => {
    const value = hashSeed("alpha");
    expect(value).not.toBe(0);
    expect(value).toBe(hashSeed("alpha"));
  });
});
