/** Deterministic RNG utilities — daily challenges replay the same seed for everyone. */

/** mulberry32: tiny, fast, good-enough seeded PRNG returning floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a string hash → 32-bit seed. */
export function hashString(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Seed for today's daily challenge, e.g. "2026-06-12". */
export function dailySeed(date = new Date()): { seed: number; label: string } {
  const label = date.toISOString().slice(0, 10);
  return { seed: hashString(`glyphwars:${label}`), label };
}
