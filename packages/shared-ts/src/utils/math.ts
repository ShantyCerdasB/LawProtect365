/**
 * @file math.ts
 * @summary Mathematical utilities for clamping, rounding, secure random generation, and basic statistics.
 * 
 * @description
 * Provides a comprehensive set of mathematical utilities including:
 * - Number clamping and range validation
 * - Precision rounding and formatting
 * - Linear interpolation for smooth transitions
 * - Cryptographically secure random number generation
 * - Statistical functions (sum, mean, median)
 * 
 * @security
 * The `randomInt` function uses cryptographically secure random number generation
 * with rejection sampling to prevent bias and ensure uniform distribution.
 */

import * as nodeCrypto from "node:crypto";

/**
 * Clamps a number into the inclusive range `[min, max]`.
 * 
 * @description
 * Ensures a number stays within specified bounds by limiting it to the given range.
 * If the number is less than the minimum, it returns the minimum. If it's greater
 * than the maximum, it returns the maximum. Otherwise, it returns the original number.
 * 
 * @param n - Input value to clamp.
 * @param min - Inclusive lower bound of the range.
 * @param max - Inclusive upper bound of the range.
 * @returns The clamped value, guaranteed to be in the range `[min, max]`.
 * 
 * @example
 * ```ts
 * clamp(10, 0, 5) // => 5 (clamped to max)
 * clamp(-1, 0, 5) // => 0 (clamped to min)
 * clamp(3, 0, 5)  // => 3 (no change needed)
 * clamp(5, 0, 5)  // => 5 (at boundary)
 * ```
 */
export const clamp = (n: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, n));

/**
 * Rounds a number to a fixed number of decimal places.
 *
 * @param n Number to round.
 * @param decimals Number of decimal places (default: `0`).
 * @returns The rounded value.
 *
 * @example
 * roundTo(1.2345, 2) // => 1.23
 * roundTo(12.5)      // => 13
 */
export const roundTo = (n: number, decimals = 0): number => {
  const f = Math.pow(10, decimals);
  return Math.round(n * f) / f;
};

/**
 * Linear interpolation between two values.
 *
 * @param a Start value.
 * @param b End value.
 * @param t Interpolation factor in `[0, 1]` where `0` returns `a` and `1` returns `b`.
 * @returns Interpolated value `a + (b - a) * t`.
 *
 * @example
 * lerp(0, 10, 0.5) // => 5
 * lerp(10, 20, 0)  // => 10
 * lerp(10, 20, 1)  // => 20
 */
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/**
 * Generates a uniformly distributed random integer in the inclusive range `[min, max]`.
 * Uses a cryptographically strong RNG where available.
 *
 * @param min Inclusive lower bound. If `min > max`, the values are swapped.
 * @param max Inclusive upper bound.
 * @returns A uniformly distributed integer `n` such that `min <= n <= max`.
 * @throws If no secure RNG is available in the current environment.
 * @throws If `min` or `max` is not a finite number.
 *
 * @remarks
 * - **Security:** Prefers `globalThis.crypto.getRandomValues` (browser / Node 18+).
 *   If unavailable, uses Node's `crypto.randomInt`. If neither exists, throws.
 * - **Uniformity:** Applies rejection sampling to remove modulo bias, ensuring each
 *   value in `[min, max]` is equally likely.
 *
 * @example
 * randomInt(1, 6) // => integer from 1 to 6
 */
export const randomInt = (min: number, max: number): number => {
  if (!Number.isFinite(min) || !Number.isFinite(max)) throw new Error("Invalid range");
  if (max < min) [min, max] = [max, min];

  const lower = Math.floor(min);
  const upper = Math.floor(max);
  const span = upper - lower + 1;
  if (span <= 0) return lower;

  // Prefer Web Crypto when available (browser / Node >= 18).
  const web = (globalThis as any)?.crypto as
    | { getRandomValues?: (arr: Uint32Array) => Uint32Array }
    | undefined;

  if (web?.getRandomValues) {
    const range = 0x100000000; // 2^32
    const limit = range - (range % span); // rejection sampling to avoid bias
    const buf = new Uint32Array(1);
    let x = 0;
    let attempts = 0;
    const maxAttempts = 1000; // Prevent infinite loops
    
    do {
      web.getRandomValues(buf);
      x = buf[0]!;
      attempts++;
      if (attempts > maxAttempts) {
        // Fallback to simple modulo if rejection sampling takes too long
        return lower + (x % span);
      }
    } while (x >= limit);
    return lower + (x % span);
  }

  // Fallback to Node's crypto.randomInt (upper bound is exclusive).
  if (typeof (nodeCrypto as any).randomInt === "function") {
    return lower + nodeCrypto.randomInt(0, span);
  }

  // No secure RNG available.
  throw new Error("Secure RNG unavailable: crypto.getRandomValues or crypto.randomInt is required");
};

/**
 * Computes the sum of an array of numbers.
 *
 * @param arr Array of numbers.
 * @returns Sum of all elements, or `0` for an empty array.
 *
 * @example
 * sum([1, 2, 3]) // => 6
 */
export const sum = (arr: number[]): number => arr.reduce((acc, n) => acc + n, 0);

/**
 * Computes the arithmetic mean (average) of an array of numbers.
 *
 * @param arr Array of numbers.
 * @returns Mean value, or `0` for an empty array.
 *
 * @example
 * mean([1, 2, 3]) // => 2
 */
export const mean = (arr: number[]): number => (arr.length ? sum(arr) / arr.length : 0);

/**
 * Computes the median of an array of numbers.
 *
 * @param arr Array of numbers.
 * @returns Median value, or `0` for an empty array.
 *
 * @remarks
 * - Does not mutate the input array; it sorts a shallow copy.
 * - For even length, returns the average of the two middle values.
 *
 * @example
 * median([1, 3, 2])    // => 2
 * median([1, 2, 3, 4]) // => 2.5
 */
export const median = (arr: number[]): number => {
  if (!arr.length) return 0;
  const a = [...arr].sort((x, y) => x - y);
  const mid = Math.floor(a.length / 2);
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
};
