/**
 * Math helpers for clamping, rounding, randoms and basic statistics.
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

/** Random integer in [min, max] inclusive. */
export const randomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

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
