/**
 * @file context.test.ts
 * @summary Tests for request-scoped AsyncLocalStorage context utilities (100% line & branch coverage).
 */

// Mock the exact specifier the SUT uses
jest.mock('ulid', () => ({
  ulid: jest.fn(),
}));

import {
  withRequestContext,
  getRequestContext,
  getRequestId,
  getTraceId,
  setContextFields,
} from '../../src/observability/index';
import { ulid } from 'ulid';

const ulidMock = ulid as unknown as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('withRequestContext', () => {
  it('generates missing ids, copies fields by value, exposes context inside scope, and returns callback result', () => {
    // Arrange deterministic ids for requestId and traceId
    ulidMock.mockReturnValueOnce('RID-GEN').mockReturnValueOnce('TID-GEN');

    const inputFields = { a: 1 };

    // Outside the scope there is no context
    expect(getRequestContext()).toBeUndefined();

    const result = withRequestContext({ fields: inputFields }, () => {
      const ctx = getRequestContext();
      expect(ctx).toBeDefined();
      expect(ctx?.requestId).toBe('RID-GEN');
      expect(ctx?.traceId).toBe('TID-GEN');
      expect(ctx?.parentSpanId).toBeUndefined();

      // Fields are copied, not referenced
      expect(ctx?.fields).toEqual({ a: 1 });
      expect(ctx?.fields).not.toBe(inputFields);

      // Merge new fields
      setContextFields({ b: 2 });
      expect(getRequestContext()?.fields).toEqual({ a: 1, b: 2 });

      return 42;
    });

    // Returned value from callback is propagated
    expect(result).toBe(42);

    // Context does not leak outside
    expect(getRequestContext()).toBeUndefined();

    // ulid invoked twice (requestId + traceId)
    expect(ulidMock).toHaveBeenCalledTimes(2);
  });

  it('respects provided ids and parentSpanId; does not generate new ones', () => {
    const ctxIn = { requestId: 'RID', traceId: 'TID', parentSpanId: 'SPAN', fields: { x: 'y' } };

    const res = withRequestContext(ctxIn, () => {
      const ctx = getRequestContext();
      expect(ctx?.requestId).toBe('RID');
      expect(ctx?.traceId).toBe('TID');
      expect(ctx?.parentSpanId).toBe('SPAN');
      expect(ctx?.fields).toEqual({ x: 'y' });

      // getRequestId/getTraceId should read from context (no new ulid())
      expect(getRequestId()).toBe('RID');
      expect(getTraceId()).toBe('TID');

      // Merge more fields
      setContextFields({ z: 1 });
      expect(getRequestContext()?.fields).toEqual({ x: 'y', z: 1 });

      return 'ok';
    });

    expect(res).toBe('ok');
    expect(ulidMock).not.toHaveBeenCalled();
  });
});

describe('fallback helpers outside of any scope', () => {
  it('getRequestId generates a new id when no context is present', () => {
    ulidMock.mockReturnValueOnce('RID-OUT');
    expect(getRequestId()).toBe('RID-OUT');
    expect(ulidMock).toHaveBeenCalledTimes(1);
  });

  it('getTraceId generates a new id when no context is present', () => {
    ulidMock.mockReturnValueOnce('TID-OUT');
    expect(getTraceId()).toBe('TID-OUT');
    expect(ulidMock).toHaveBeenCalledTimes(1);
  });

  it('setContextFields is a no-op when no context is present', () => {
    expect(() => setContextFields({ any: 'thing' })).not.toThrow();
  });
});
