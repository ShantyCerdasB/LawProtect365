/**
 * Exponential backoff with jitter for retry policies.
 * Based on full-jitter and decorrelated jitter strategies.
 * @remarks
 * - Security scanners (e.g., Sonar rule S2245) flag any use or fallback to `Math.random()` for security-sensitive contexts.
 *   Even an unreachable or guarded fallback can be reported. To satisfy this rule, the fallback to `Math.random()` has been removed.
 * - RNG safety: uses `globalThis.crypto.getRandomValues` with unbiased rejection sampling; if no secure RNG is available, an error is thrown.
 */

export type Jitter = "none" | "full" | "decorrelated";

export interface BackoffOptions {
  /** Base delay in ms (default 100). */
  baseMs?: number;
  /** Maximum delay cap in ms (default 10000). */
  capMs?: number;
  /** Jitter strategy (default "full"). */
  jitter?: Jitter;
}

/**
 * Computes a backoff delay for a given attempt using exponential growth.
 * Attempt is zero-based: attempt=0 is the first retry.
 * @param attempt Zero-based retry attempt.
 * @param opts Backoff options.
 */
export const backoffDelay = (attempt: number, opts: BackoffOptions = {}): number => {
  const base = Math.max(1, opts.baseMs ?? 100);
  const cap = Math.max(base, opts.capMs ?? 10_000);
  const exp = Math.min(cap, base * Math.pow(2, attempt));
  const j = opts.jitter ?? "full";

  if (j === "none") return exp;

  if (j === "decorrelated") {
    // Decorrelated: random between base..min(cap, prev*3); for stateless use exp as prev
    const max = Math.min(cap, exp * 3);
    return randInt(base, max);
  }

  // Full jitter
  return randInt(0, exp);
};

/**
 * Stateless helper that returns [shouldRetry, delayMs].
 * @param attempt Zero-based retry attempt.
 * @param maxAttempts Maximum total attempts (retries = maxAttempts - 1).
 * @param isRetryable Predicate that decides if error is retryable.
 * @param err Error value.
 * @param opts Backoff options.
 */
export const shouldRetry = (
  attempt: number,
  maxAttempts: number,
  isRetryable: (err: unknown) => boolean,
  err: unknown,
  opts?: BackoffOptions
): { retry: boolean; delayMs: number } => {
  if (attempt >= Math.max(0, maxAttempts - 1)) return { retry: false, delayMs: 0 };
  if (!isRetryable(err)) return { retry: false, delayMs: 0 };
  return { retry: true, delayMs: backoffDelay(attempt, opts) };
};

/**
 * Returns a uniformly distributed integer in [min, max] inclusive.
 * Uses Web Crypto/Node global crypto with rejection sampling to avoid modulo bias.
 * If a secure RNG is not available, throws an error instead of falling back to `Math.random()`.
 * @param min Inclusive lower bound.
 * @param max Inclusive upper bound.
 */
const randInt = (min: number, max: number): number => {
  if (!Number.isFinite(min) || !Number.isFinite(max)) throw new Error("Invalid range");
  if (max < min) [min, max] = [max, min];

  const lower = Math.floor(min);
  const upper = Math.floor(max);
  const span = upper - lower + 1;
  if (span <= 0) return lower;

  const g = (globalThis as any)?.crypto as
    | { getRandomValues?: (arr: Uint32Array) => Uint32Array }
    | undefined;

  if (!g?.getRandomValues) {
    throw new Error("Secure RNG unavailable: globalThis.crypto.getRandomValues is required");
  }

  const range = 0x1_0000_0000; // 2^32
  const limit = range - (range % span); // rejection sampling to remove bias
  const buf = new Uint32Array(1);
  let x = 0;
  do {
    g.getRandomValues(buf);
    x = buf[0]!;
  } while (x >= limit);

  return lower + (x % span);
};
