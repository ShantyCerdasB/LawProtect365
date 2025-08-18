/**
 * @file withTracing.test.ts
 * @summary Unit tests for the withTracing decorator with full line and branch coverage.
 */

import { withTracing } from '../../../src/observability/decorators/withTracing.js';

describe('withTracing', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('starts a span with name and attributes, ends it, and returns the result', async () => {
    const end = jest.fn();
    const recordException = jest.fn();
    const span = { end, recordException };
    const tracer = { startSpan: jest.fn(() => span) };
    const ctx = { tracer } as any;

    const attributes = { env: 'test', region: 'us-east-1' };
    const op = async (_ctx: any, input: unknown) => ({ echoed: input });

    const wrapped = withTracing(op, { name: 'myOp', attributes });
    const result = await wrapped(ctx, { a: 1 });

    expect(result).toEqual({ echoed: { a: 1 } });
    expect(tracer.startSpan).toHaveBeenCalledTimes(1);
    expect(tracer.startSpan).toHaveBeenCalledWith('myOp', attributes);
    expect(recordException).not.toHaveBeenCalled();
    expect(end).toHaveBeenCalledTimes(1);
  });

  it('records the exception when supported, ends the span, and rethrows', async () => {
    const end = jest.fn();
    const recordException = jest.fn();
    const span = { end, recordException };
    const tracer = { startSpan: jest.fn(() => span) };
    const ctx = { tracer } as any;

    const err = new Error('boom');
    const failing = async () => {
      throw err;
    };

    const wrapped = withTracing(failing, {
      name: 'calcTotal',
      attributes: { svc: 'orders' },
    });

    await expect(wrapped(ctx, 42)).rejects.toBe(err);

    expect(tracer.startSpan).toHaveBeenCalledWith('calcTotal', { svc: 'orders' });
    expect(recordException).toHaveBeenCalledTimes(1);
    expect(recordException).toHaveBeenCalledWith(err);
    expect(end).toHaveBeenCalledTimes(1);
  });

  it('handles missing recordException and forwards undefined attributes', async () => {
    const end = jest.fn();
    const span = { end }; // no recordException
    const tracer = { startSpan: jest.fn(() => span) };
    const ctx = { tracer } as any;

    const err = new Error('no-rec-exception');
    const failing = async () => {
      throw err;
    };

    const wrapped = withTracing(failing, { name: 'noAttrs' });

    await expect(wrapped(ctx, null)).rejects.toBe(err);

    expect(tracer.startSpan).toHaveBeenCalledWith('noAttrs', undefined);
    expect(end).toHaveBeenCalledTimes(1);
  });
});
