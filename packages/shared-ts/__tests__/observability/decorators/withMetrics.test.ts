/**
 * @file withMetrics.test.ts
 * @summary Tests for withMetrics decorator (100% line & branch coverage).
 */

import { withMetrics } from '../../../src/observability/decorators/withMetrics.js';

describe('withMetrics', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2020-01-01T00:00:00.000Z'));
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('records success counter and latency with provided tags and returns output', async () => {
    const metrics = { increment: jest.fn(), timing: jest.fn() };
    const ctx = { metrics } as any;
    const tags = { env: 'test', region: 'us-east-1' };

    const op = async (_ctx: any, input: unknown) => {
      // advance fake time to create a measurable latency
      jest.setSystemTime(new Date('2020-01-01T00:00:00.250Z'));
      return { echoed: input };
    };

    const wrapped = withMetrics(op, { name: 'myOp', tags });
    const result = await wrapped(ctx, { a: 1 });

    expect(result).toEqual({ echoed: { a: 1 } });
    expect(metrics.increment).toHaveBeenCalledTimes(1);
    expect(metrics.increment).toHaveBeenCalledWith('myOp.success', tags);
    expect(metrics.timing).toHaveBeenCalledTimes(1);
    expect(metrics.timing).toHaveBeenCalledWith('myOp.latency_ms', 250, tags);
  });

  it('records error counter and latency with provided tags and rethrows', async () => {
    const metrics = { increment: jest.fn(), timing: jest.fn() };
    const ctx = { metrics } as any;
    const tags = { svc: 'orders' };
    const err = new Error('boom');

    const failing = async () => {
      jest.setSystemTime(new Date('2020-01-01T00:00:00.123Z'));
      throw err;
    };

    const wrapped = withMetrics(failing, { name: 'calcTotal', tags });

    await expect(wrapped(ctx, 42)).rejects.toBe(err);

    expect(metrics.increment).toHaveBeenCalledTimes(1);
    expect(metrics.increment).toHaveBeenCalledWith('calcTotal.error', tags);
    expect(metrics.timing).toHaveBeenCalledTimes(1);
    expect(metrics.timing).toHaveBeenCalledWith('calcTotal.latency_ms', 123, tags);
  });

  it('passes undefined tags through unchanged', async () => {
    const metrics = { increment: jest.fn(), timing: jest.fn() };
    const ctx = { metrics } as any;

    const op = async () => {
      jest.setSystemTime(new Date('2020-01-01T00:00:00.001Z'));
      return 'ok';
    };

    const wrapped = withMetrics(op, { name: 'noTags' });
    const out = await wrapped(ctx, null);

    expect(out).toBe('ok');
    expect(metrics.increment).toHaveBeenCalledWith('noTags.success', undefined);
    expect(metrics.timing).toHaveBeenCalledWith('noTags.latency_ms', 1, undefined);
  });
});
