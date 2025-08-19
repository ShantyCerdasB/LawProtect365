/**
 * Promise utilities for timing, retries, timeouts and settlements.
 */

/** Resolves after given milliseconds. */
export const sleep = (ms: number): Promise<void> =>
  new Promise((r) => setTimeout(r, ms));

/**
 * Wraps a promise with a timeout that rejects if exceeded.
 * - Avoids unhandled rejections with fake timers by resolving a sentinel on timeout.
 * - Attaches a handler to the inner promise immediately so its rejection is handled.
 */
export const withTimeout = <T>(
  p: Promise<T>,
  ms: number,
  message = "Timeout",
): Promise<T> => {
  type Result =
    | { t: "value"; v: T }
    | { t: "error"; e: unknown }
    | { t: "timeout" };

  let timerId: ReturnType<typeof setTimeout> | undefined;

  // ✓ Provide both generics so the rejection handler returns Result, not never
  const guarded: Promise<Result> = p.then<Result, Result>(
    (v) => ({ t: "value", v }),
    (e) => ({ t: "error", e }),
  );

  const timeoutP: Promise<Result> = new Promise((res) => {
    timerId = setTimeout(() => res({ t: "timeout" }), ms);
  });

  return Promise.race([guarded, timeoutP]).then((r) => {
    if (timerId !== undefined) clearTimeout(timerId);
    if (r.t === "timeout") throw new Error(message);
    if (r.t === "error") throw r.e;
    return r.v;
  });
};


/**
 * Retries an async function with exponential backoff.
 * @param fn Function to execute.
 * @param opts Retry options.
 */
export const retry = async <T>(
  fn: (attempt: number) => Promise<T>,
  opts: {
    retries?: number;
    minDelayMs?: number;
    maxDelayMs?: number;
    factor?: number;
    shouldRetry?: (e: unknown) => boolean;
  } = {},
): Promise<T> => {
  const retries = opts.retries ?? 3;
  const factor = opts.factor ?? 2;
  const min = opts.minDelayMs ?? 100;
  const max = opts.maxDelayMs ?? 2_000;
  const should = opts.shouldRetry ?? (() => true);

  let attempt = 0;
  let lastErr: unknown;

  while (attempt <= retries) {
    try {
      return await fn(attempt);
    } catch (e) {
      lastErr = e;
      if (attempt === retries || !should(e)) break;
      const delay = Math.min(max, Math.floor(min * Math.pow(factor, attempt)));
      await sleep(delay);
      attempt++;
    }
  }
  throw lastErr;
};

/** Waits for all promises and returns settled results preserving order. */
export const settleAll = async <T>(
  promises: Promise<T>[],
): Promise<Array<{ ok: true; value: T } | { ok: false; error: unknown }>> => {
  const results = await Promise.allSettled(promises);
  return results.map((r) =>
    r.status === "fulfilled"
      ? { ok: true, value: r.value }
      : { ok: false, error: r.reason },
  );
};
