/**
 * @file retry.test.ts
 * @summary Tests for exponential backoff and retry helpers with full branch coverage.
 */

import { backoffDelay, shouldRetry } from '../../src/aws/retry.js';
import type { BackoffOptions } from '../../src/aws/retry.js';

const originalRandom = Math.random;

/** Force Math.random() to a fixed value for the duration of a callback. */
const withRandom = (v: number, fn: () => void) => {
  const n = Math.min(0.999999, Math.max(0, v)); // avoid 1 to prevent off-by-one
  // @ts-ignore
  Math.random = () => n;
  try {
    fn();
  } finally {
    Math.random = originalRandom;
  }
};

/** Predicate helpers lifted to top level to avoid deep nesting in tests. */
const always = () => true;
const never = () => false;

/** Extracted assertion to keep function nesting shallow in the defaults passthrough test. */
function assertDefaultShouldRetryUpperBound() {
  const r = shouldRetry(1, 3, always, new Error());
  // backoffDelay(1) with defaults: exp = 200; full jitter upper bound -> 200
  expect(r).toEqual({ retry: true, delayMs: 200 });
}

describe('backoffDelay', () => {
  it('computes exponential delay without jitter', () => {
    const noneOpts: BackoffOptions = { jitter: 'none', baseMs: 100 };
    expect(backoffDelay(0, noneOpts)).toBe(100);
    expect(backoffDelay(3, noneOpts)).toBe(800);

    const cappedNone: BackoffOptions = { jitter: 'none', baseMs: 100, capMs: 1_000 };
    expect(backoffDelay(10, cappedNone)).toBe(1_000);
  });

  it('full jitter returns [0..exp] inclusive', () => {
    const opts: BackoffOptions = { jitter: 'full', baseMs: 100 }; // exp = 400
    withRandom(0, () => expect(backoffDelay(2, opts)).toBe(0));
    withRandom(0.999999, () => expect(backoffDelay(2, opts)).toBe(400));
    withRandom(0.5, () => {
      const d = backoffDelay(2, opts);
      expect(d).toBeGreaterThanOrEqual(0);
      expect(d).toBeLessThanOrEqual(400);
    });
  });

  it('decorrelated jitter returns [base..min(cap, exp*3)] inclusive when cap is the limiter', () => {
    // attempt=2 -> exp=400; exp*3=1200; cap=1000 -> max=min(1000,1200)=1000
    const opts: BackoffOptions = { jitter: 'decorrelated', baseMs: 100, capMs: 1_000 };
    withRandom(0, () => expect(backoffDelay(2, opts)).toBe(100));
    withRandom(0.999999, () => expect(backoffDelay(2, opts)).toBe(1_000));
    withRandom(0.5, () => {
      const d = backoffDelay(2, opts);
      expect(d).toBeGreaterThanOrEqual(100);
      expect(d).toBeLessThanOrEqual(1_000);
    });
  });

  it('decorrelated jitter uses exp*3 as limiter when below cap', () => {
    // attempt=2 -> exp=400; exp*3=1200; cap=5000 -> max=min(5000,1200)=1200
    const opts: BackoffOptions = { jitter: 'decorrelated', baseMs: 100, capMs: 5_000 };
    withRandom(0, () => expect(backoffDelay(2, opts)).toBe(100));        // lower bound = base
    withRandom(0.999999, () => expect(backoffDelay(2, opts)).toBe(1_200)); // upper bound = exp*3
  });

  it('enforces base >= 1 and cap >= base', () => {
    expect(backoffDelay(0, { jitter: 'none', baseMs: 0 } as BackoffOptions)).toBe(1);
    // capMs < baseMs -> cap is lifted to base; result capped at base = 200
    expect(backoffDelay(5, { jitter: 'none', baseMs: 200, capMs: 50 } as BackoffOptions)).toBe(200);
  });
});

describe('shouldRetry', () => {
  it('stops when attempts exceed maxAttempts - 1', () => {
    const opts: BackoffOptions = { jitter: 'none', baseMs: 10 };
    expect(shouldRetry(0, 3, always, new Error(), opts).retry).toBe(true);
    expect(shouldRetry(1, 3, always, new Error(), opts).retry).toBe(true);
    expect(shouldRetry(2, 3, always, new Error(), opts).retry).toBe(false);
  });

  it('does not retry when predicate is false', () => {
    const opts: BackoffOptions = { jitter: 'none', baseMs: 50 };
    expect(shouldRetry(0, 5, never, new Error('x'), opts)).toEqual({ retry: false, delayMs: 0 });
  });

  it('returns deterministic delay with jitter "none"', () => {
    const r0 = shouldRetry(0, 2, always, 'err', { jitter: 'none', baseMs: 100 } as BackoffOptions);
    const r3 = shouldRetry(3, 5, always, 'err', { jitter: 'none', baseMs: 100, capMs: 700 } as BackoffOptions);
    expect(r0).toEqual({ retry: true, delayMs: 100 });
    expect(r3).toEqual({ retry: true, delayMs: 700 });
  });

  it('respects jitter randomness (full jitter upper bound)', () => {
    const opts: BackoffOptions = { jitter: 'full', baseMs: 100 };
    withRandom(0.999999, () => {
      const r = shouldRetry(2, 4, always, 'e', opts);
      expect(r.retry).toBe(true);
      expect(r.delayMs).toBe(400);
    });
  });

  it('returns no retry when maxAttempts <= 0 (Math.max guard)', () => {
    const opts: BackoffOptions = { jitter: 'none', baseMs: 10 };
    // maxAttempts = 0 -> threshold 0 -> attempt 0 >= 0 => no retry
    expect(shouldRetry(0, 0, always, new Error(), opts)).toEqual({ retry: false, delayMs: 0 });
    // maxAttempts = 1 -> threshold 0 -> attempt 0 >= 0 => no retry
    expect(shouldRetry(0, 1, always, new Error(), opts)).toEqual({ retry: false, delayMs: 0 });
  });
});

describe('backoffDelay (defaults)', () => {
  it('uses default base=100, cap=10000, jitter=full when options are omitted', () => {
    // attempt=2 -> exp = min(10000, 100*2^2 = 400) = 400
    withRandom(0, () => expect(backoffDelay(2)).toBe(0));           // lower bound (full jitter)
    withRandom(0.999999, () => expect(backoffDelay(2)).toBe(400));  // upper bound (full jitter)
  });
});

describe('shouldRetry (defaults passthrough)', () => {
  it('works with undefined opts (defaults inside backoffDelay)', () => {
    // attempt 1 of maxAttempts 3 -> retries; delay computed with defaults
    withRandom(0.999999, assertDefaultShouldRetryUpperBound);
  });
});
