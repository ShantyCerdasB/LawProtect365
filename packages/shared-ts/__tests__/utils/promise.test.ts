/**
 * @file promise.test.ts
 * @summary Tests for Promise helpers: sleep, withTimeout, retry, and settleAll.
 * @remarks
 * - Uses Jest fake timers to simulate delays.
 * - Attaches rejection handlers BEFORE advancing timers to avoid unhandled rejections with fake timers.
 * - Verifies timer cleanup in withTimeout and backoff behavior in retry.
 * - Ensures settleAll preserves input order and shapes results.
 */

import { sleep, withTimeout, retry, settleAll } from "../../src/utils/promise.js";

const getTimerCount = (): number | undefined => (jest as any).getTimerCount?.();

/** Timer setup/teardown */
beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  jest.useRealTimers();
});

/** sleep */
describe("sleep", () => {
  it("resolves after the specified delay", async () => {
    let settled = false;
    const p = sleep(500).then(() => {
      settled = true;
    });

    await jest.advanceTimersByTimeAsync(499);
    expect(settled).toBe(false);

    await jest.advanceTimersByTimeAsync(1);
    await p;
    expect(settled).toBe(true);
  });
});

/** withTimeout */
describe("withTimeout", () => {
  it("resolves when the inner promise resolves before the timeout", async () => {
    let resolveInner!: (v: number) => void;
    const inner = new Promise<number>((res) => (resolveInner = res));

    const guarded = withTimeout(inner, 1000);
    const pending = expect(guarded).resolves.toBe(42); // attach handler first
    setTimeout(() => resolveInner(42), 100);

    await jest.advanceTimersByTimeAsync(100);
    await pending;

    const count = getTimerCount();
    if (typeof count === "number") expect(count).toBe(0);
  });

  it("rejects with the provided message when the timeout elapses", async () => {
    const never = new Promise<void>(() => {});
    const guarded = withTimeout(never, 500, "Boom");

    const pending = expect(guarded).rejects.toEqual(new Error("Boom")); // attach before advancing
    await jest.advanceTimersByTimeAsync(500);
    await pending;
  });

  it("propagates inner rejection and clears the timer", async () => {
    let rejectInner!: (e: Error) => void;
    const inner = new Promise<void>((_, rej) => (rejectInner = rej));
    const guarded = withTimeout(inner, 1000);

    const pending = expect(guarded).rejects.toThrow("fail fast"); // attach first
    setTimeout(() => rejectInner(new Error("fail fast")), 100);

    await jest.advanceTimersByTimeAsync(100);
    await pending;

    const count = getTimerCount();
    if (typeof count === "number") expect(count).toBe(0);
  });
});

/** retry */
describe("retry", () => {
  it("returns immediately when the first attempt succeeds", async () => {
    const fn = jest.fn(async () => "ok");
    const resultP = retry(fn);

    const pending = expect(resultP).resolves.toBe("ok"); // attach early
    await Promise.resolve(); // flush microtasks (no timers scheduled)
    const count = getTimerCount();
    if (typeof count === "number") expect(count).toBe(0);

    await pending;
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries with exponential backoff until success", async () => {
    const errors = [new Error("e1"), new Error("e2")];
    const fn = jest
      .fn<Promise<string>, [number]>()
      .mockRejectedValueOnce(errors[0])
      .mockRejectedValueOnce(errors[1])
      .mockResolvedValueOnce("ok");

    const opts = { retries: 3, minDelayMs: 100, factor: 2, maxDelayMs: 1000 };
    const resultP = retry(fn, opts);
    const pending = expect(resultP).resolves.toBe("ok"); // attach early

    await Promise.resolve();
    await jest.advanceTimersByTimeAsync(100); // after first failure

    await Promise.resolve();
    await jest.advanceTimersByTimeAsync(200); // after second failure

    await pending;
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("caps backoff at maxDelayMs", async () => {
    const fn = jest
      .fn<Promise<string>, [number]>()
      .mockRejectedValueOnce(new Error("e1"))
      .mockRejectedValueOnce(new Error("e2"))
      .mockRejectedValueOnce(new Error("e3"))
      .mockResolvedValueOnce("ok");

    const opts = { retries: 5, minDelayMs: 1000, factor: 10, maxDelayMs: 1500 };
    const resultP = retry(fn, opts);
    const pending = expect(resultP).resolves.toBe("ok"); // attach early

    await Promise.resolve();
    await jest.advanceTimersByTimeAsync(1000);

    await Promise.resolve();
    await jest.advanceTimersByTimeAsync(1500);

    await Promise.resolve();
    await jest.advanceTimersByTimeAsync(1500);

    await pending;
    expect(fn).toHaveBeenCalledTimes(4);
  });

  it("stops retrying when shouldRetry returns false", async () => {
    const err = new Error("fatal");
    const fn = jest.fn<Promise<never>, [number]>(async () => {
      throw err;
    });

    const resultP = retry(fn, {
      retries: 5,
      shouldRetry: (e) => (e as Error).message !== "fatal"});
    const pending = expect(resultP).rejects.toBe(err); // attach before flushing

    await Promise.resolve(); // flush microtasks
    const count = getTimerCount();
    if (typeof count === "number") expect(count).toBe(0);

    await pending;
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("throws the last error after exhausting retries", async () => {
    const err1 = new Error("e1");
    const err2 = new Error("e2");
    const err3 = new Error("e3");

    let i = 0;
    const fn = jest.fn<Promise<never>, [number]>(async () => {
      throw [err1, err2, err3][i++] ?? err3;
    });

    const resultP = retry(fn, { retries: 2, minDelayMs: 50 });
    const pending = expect(resultP).rejects.toBe(err3); // attach early

    await Promise.resolve();
    await jest.advanceTimersByTimeAsync(50);

    await Promise.resolve();
    await jest.advanceTimersByTimeAsync(100); // factor defaults to 2

    await pending;
    expect(fn).toHaveBeenCalledTimes(3);
  });
});

/** settleAll */
describe("settleAll", () => {
  it("preserves order and wraps results", async () => {
    const p1 = new Promise<number>((res) => setTimeout(() => res(1), 50));
    const p2 = new Promise<number>((_, rej) => setTimeout(() => rej(new Error("bad")), 10));
    const p3 = Promise.resolve(3);

    const resultP = settleAll([p1, p2, p3]);

    await jest.advanceTimersByTimeAsync(50);
    const results = await resultP;

    expect(results).toHaveLength(3);
    expect(results[0]).toEqual({ ok: true, value: 1 });
    expect(results[1].ok).toBe(false);
    if (!results[1].ok) {
      expect((results[1] as { ok: false; error: Error }).error.message).toBe("bad");
    }
    expect(results[2]).toEqual({ ok: true, value: 3 });
  });
});
