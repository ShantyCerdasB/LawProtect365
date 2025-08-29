/**
 * @file retry.test.ts
 * @summary Tests for exponential backoff helpers: backoffDelay and shouldRetry.
 * @remarks
 * - Randomness is controlled by mocking `globalThis.crypto.getRandomValues`.
 * - Full-jitter and decorrelated-jitter paths are tested with deterministic values.
 * - Rejection sampling is exercised to ensure unbiased range mapping.
 */

import { backoffDelay, shouldRetry, type BackoffOptions } from "../../src/aws/retry.js";

/** Minimal shape to avoid depending on DOM lib types in test env. */
type CryptoLike = { getRandomValues?: (arr: Uint32Array) => Uint32Array };

/** Preserve and restore the real crypto between tests. */
let realCrypto: CryptoLike | undefined;

beforeEach(() => {
  realCrypto = (globalThis as any).crypto;
});

afterEach(() => {
  (globalThis as any).crypto = realCrypto;
  jest.resetAllMocks();
});

/** Install a deterministic crypto.getRandomValues that feeds numbers from `values`. */
const mockCrypto = (values: number[]) => {
  let i = 0;
  (globalThis as any).crypto = {
    getRandomValues: (buf: Uint32Array) => {
      if (i >= values.length) throw new Error("Mock RNG exhausted");
      buf[0] = values[i++]!;
      return buf;
    },
  } satisfies CryptoLike;
};

describe("backoffDelay", () => {
  it("uses exponential growth with no jitter and respects the cap", () => {
    // base=100, attempt=0..4 => 100,200,400,800,1600 -> capped at 1000
    const opts: BackoffOptions = { baseMs: 100, capMs: 1000, jitter: "none" };
    expect(backoffDelay(0, opts)).toBe(100);
    expect(backoffDelay(1, opts)).toBe(200);
    expect(backoffDelay(2, opts)).toBe(400);
    expect(backoffDelay(3, opts)).toBe(800);
    expect(backoffDelay(4, opts)).toBe(1000); // capped
    expect(backoffDelay(10, opts)).toBe(1000); // capped
  });

  it("full jitter returns inclusive values in [0, exp]", () => {
    // base=100, attempt=3 => exp = 100 * 2^3 = 800
    // Mock RNG first to 0, then to 800 to test both ends of the interval.
    mockCrypto([0, 800]);
    expect(backoffDelay(3, { baseMs: 100, jitter: "full" })).toBe(0);
    expect(backoffDelay(3, { baseMs: 100, jitter: "full" })).toBe(800);
  });

  it("decorrelated jitter returns inclusive values in [base, min(cap, exp*3)]", () => {
    // base=100, attempt=2 => exp = 400, range = [100, 1200]
    // randInt maps via: result = lower + (x % span) with lower=100, span=1101.
    // To hit the inclusive bounds, use x=0 -> 100 and x=1100 -> 1200.
    mockCrypto([0, 1100]);
    expect(backoffDelay(2, { baseMs: 100, jitter: "decorrelated" })).toBe(100);
    expect(backoffDelay(2, { baseMs: 100, jitter: "decorrelated" })).toBe(1200);
  });

  it("throws when secure RNG is unavailable and jitter requires randomness", () => {
    (globalThis as any).crypto = undefined;
    expect(() => backoffDelay(0, { jitter: "full" })).toThrow(
      "Secure RNG unavailable",
    );

    // With no jitter, RNG is not needed.
    expect(() => backoffDelay(0, { jitter: "none" })).not.toThrow();
  });

  it("performs rejection sampling to remove modulo bias", () => {
    // Choose exp=5 => span = (max - min + 1) = 6
    // limit = 2^32 - (2^32 % 6) = 4294967292
    // First draw: >= limit -> rejected; second draw: < limit -> accepted.
    const REJECT = 4294967294; // >= limit
    const ACCEPT = 3; // < limit
    mockCrypto([REJECT, ACCEPT]);

    const delay = backoffDelay(0, { baseMs: 5, jitter: "full" }); // randInt(0,5)
    expect(delay).toBe(ACCEPT % 6); // lower(0) + (ACCEPT % span)
  });

  it("honors custom base and cap values", () => {
    // base=250, attempt=1 => exp=500; cap=400 -> result 400 with no jitter
    expect(backoffDelay(1, { baseMs: 250, capMs: 400, jitter: "none" })).toBe(400);
  });
});

describe("shouldRetry", () => {
  it("returns {retry:false} when attempt reaches the last allowed try", () => {
    // maxAttempts is total tries; attempt is zero-based
    expect(
      shouldRetry(0, 1, () => true, new Error("x"), { jitter: "none" }),
    ).toEqual({ retry: false, delayMs: 0 });

    expect(
      shouldRetry(1, 2, () => true, new Error("x"), { jitter: "none" }),
    ).toEqual({ retry: false, delayMs: 0 });
  });

  it("returns {retry:false} when error is not retryable", () => {
    const nonRetryable = (e: unknown) => (e as Error).message !== "retry";
    expect(
      shouldRetry(0, 5, nonRetryable, new Error("retry"), { jitter: "none" }),
    ).toEqual({ retry: false, delayMs: 0 });
  });

  it("returns {retry:true, delayMs:N} otherwise (delegates to backoffDelay)", () => {
    // For deterministic delay, use no jitter.
    const res = shouldRetry(2, 5, () => true, new Error("x"), {
      baseMs: 50,
      capMs: 10000,
      jitter: "none",
    });
    // base=50, attempt=2 => exp = 50 * 4 = 200
    expect(res).toEqual({ retry: true, delayMs: 200 });
  });

  it("uses jittered delay when configured", () => {
    // attempt=1, base=100 => exp=200, full jitter => [0..200]
    mockCrypto([123]);
    const res = shouldRetry(1, 5, () => true, new Error("x"), {
      baseMs: 100,
      jitter: "full",
    });
    // With full jitter in [0, 200], the mocked value maps directly to 123.
    expect(res.retry).toBe(true);
    expect(res.delayMs).toBe(123);
  });

  it("handles edge cases for maxAttempts", () => {
    // Test with maxAttempts = 0 (invalid but should handle gracefully)
    expect(shouldRetry(0, 0, () => true, new Error("x"))).toEqual({ retry: false, delayMs: 0 });
    
    // Test with negative maxAttempts
    expect(shouldRetry(0, -1, () => true, new Error("x"))).toEqual({ retry: false, delayMs: 0 });
  });
});


