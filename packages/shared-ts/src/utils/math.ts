/**
 * Math helpers for clamping, rounding, randoms and basic statistics.
 * @remarks
 * - Made `randomInt` safe and unbiased: prefers cryptographically strong randomness via `globalThis.crypto.getRandomValues`
 *   with rejection sampling; falls back to `Math.random()` if not available. Also validates and normalizes the input range.
 */

/** Clamps a number into [min, max]. */
export const clamp = (n: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, n));

/** Rounds a number to N decimal places. */
export const roundTo = (n: number, decimals = 0): number => {
  const f = Math.pow(10, decimals);
  return Math.round(n * f) / f;
};

/** Linear interpolation between a and b by t in [0,1]. */
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/**
 * Random integer in [min, max] inclusive.
 * Prefers crypto-strong RNG with rejection sampling to avoid modulo bias.
 * Falls back to Math.random() if crypto is unavailable.
 */
export const randomInt = (min: number, max: number): number => {
  if (!Number.isFinite(min) || !Number.isFinite(max)) throw new Error("Invalid range");
  if (max < min) [min, max] = [max, min];

  const lower = Math.floor(min);
  const upper = Math.floor(max);
  const span = upper - lower + 1;
  if (span <= 0) return lower;

  const g = (globalThis as any)?.crypto as
    | { getRandomValues?: (arr: Uint32Array) => Uint32Array }
    | undefined;

  if (g?.getRandomValues) {
    const range = 0x1_0000_0000; // 2^32
    const limit = range - (range % span); // rejection sampling to remove bias
    const buf = new Uint32Array(1);
    let x = 0;
    do {
      g.getRandomValues(buf);
      x = buf[0]!;
    } while (x >= limit);
    return lower + (x % span);
  }

  // Fallback: sufficiently good for non-cryptographic use.
  return Math.floor(Math.random() * span) + lower;
};

/** Sum of array of numbers. */
export const sum = (arr: number[]): number => arr.reduce((acc, n) => acc + n, 0);

/** Mean (average) of array of numbers. */
export const mean = (arr: number[]): number => (arr.length ? sum(arr) / arr.length : 0);

/** Median of array of numbers. */
export const median = (arr: number[]): number => {
  if (!arr.length) return 0;
  const a = [...arr].sort((x, y) => x - y);
  const mid = Math.floor(a.length / 2);
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
};
