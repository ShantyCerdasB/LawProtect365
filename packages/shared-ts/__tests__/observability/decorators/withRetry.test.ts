/**
 * @file withRetry.test.ts
 * @summary Tests for withRetry decorator (100% line & branch coverage).
 */

import { withRetry } from '../../../src/observability/decorators/withRetry.js';

describe('withRetry', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2020-01-01T00:00:00.000Z'));
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('returns on first attempt without scheduling backoff', async () => {
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
    const op = jest.fn(async () => 'ok');
    const wrapped = withRetry(op, { maxAttempts: 3 });

    const out = await wrapped({} as any, 123);

    expect(out).toBe('ok');
    expect(op).toHaveBeenCalledTimes(1);
    expect(setTimeoutSpy).not.toHaveBeenCalled();
  });

  it('retries on error by default and honors backoffMs before retry, then succeeds', async () => {
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
    let calls = 0;
    const op = jest.fn(async () => {
      calls += 1;
      if (calls === 1) throw new Error('first');
      return 'done';
    });
    const wrapped = withRetry(op, {
      maxAttempts: 3,
      backoffMs: (attempt) => {
        expect(attempt).toBe(1); // 1-based attempt used for backoff
        return 200;
      }});

    const p = wrapped({} as any, 'in');

    // Allow microtasks to flush so the catch schedules setTimeout
    await Promise.resolve();

    expect(op).toHaveBeenCalledTimes(1);
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 200);

    jest.advanceTimersByTime(200);
    const out = await p;

    expect(out).toBe('done');
    expect(op).toHaveBeenCalledTimes(2);
  });

  it('does not retry when shouldRetry returns false; throws original error; no delay', async () => {
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
    const err = new Error('no-retry');
    const op = jest.fn(async () => {
      throw err;
    });
    const wrapped = withRetry(op, {
      maxAttempts: 5,
      shouldRetry: () => false,
      backoffMs: () => 999});

    await expect(wrapped({} as any, 'x')).rejects.toBe(err);
    expect(op).toHaveBeenCalledTimes(1);
    expect(setTimeoutSpy).not.toHaveBeenCalled();
  });

  it('performs exactly one attempt when maxAttempts=0 due to guard and throws without delay', async () => {
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
    const err = new Error('one-shot');
    const op = jest.fn(async () => {
      throw err;
    });
    const wrapped = withRetry(op, {
      maxAttempts: 0, // while guard makes it at least 1, but break uses raw maxAttempts
      shouldRetry: () => true,
      backoffMs: () => 500});

    await expect(wrapped({} as any, null as any)).rejects.toBe(err);
    expect(op).toHaveBeenCalledTimes(1);
    expect(setTimeoutSpy).not.toHaveBeenCalled();
  });

  it('clamps negative backoff to 0 and throws the last error after exhausting attempts', async () => {
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
    const e1 = new Error('first');
    const e2 = new Error('second');
    let n = 0;
    const op = jest.fn(async () => {
      n += 1;
      throw n === 1 ? e1 : e2;
    });
    const wrapped = withRetry(op, {
      maxAttempts: 2,
      shouldRetry: () => true,
      backoffMs: () => -50, // clamped to 0
    });

    const p = wrapped({} as any, undefined as any);

    // Allow microtasks to flush so the catch schedules setTimeout(0)
    await Promise.resolve();

    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 0);

    jest.runAllTimers();
    await expect(p).rejects.toBe(e2);

    expect(op).toHaveBeenCalledTimes(2);
  });
});
