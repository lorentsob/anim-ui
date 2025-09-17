const FNV_OFFSET = 2166136261 >>> 0;
const FNV_PRIME = 16777619;

function fnv1a(str: string): number {
  let hash = FNV_OFFSET;
  for (let i = 0; i < str.length; i += 1) {
    hash ^= str.charCodeAt(i) >>> 0;
    hash = Math.imul(hash, FNV_PRIME) >>> 0;
  }
  return hash >>> 0;
}

export function hashSeed(seed: string): number {
  const base = seed.trim() || "animator";
  return fnv1a(base);
}

export function createRng(seed: string): () => number {
  let state = hashSeed(seed) || 0x1a2b3c4d;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return ((state >>> 0) & 0xffffffff) / 0x100000000;
  };
}

const SEED_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateSeed(): string {
  let out = "";
  for (let i = 0; i < 8; i += 1) {
    if (i === 4) out += "-";
    const idx = Math.floor(Math.random() * SEED_CHARS.length);
    out += SEED_CHARS[idx];
  }
  return out;
}
