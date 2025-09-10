/**
 * @file context.test.ts
 * @summary Tests for request context utilities.
 */

import {
  withRequestContexts,
  getRequestContext,
  getRequestId,
  getTraceId,
  setContextFields} from '../../src/observability/context.js';

describe('withRequestContexts', () => {
  it('runs function with provided context', () => {
    const ctx = { requestId: 'test-request', traceId: 'test-trace' };
    let capturedContext: any = null;
    
    const result = withRequestContexts(ctx, () => {
      capturedContext = getRequestContext();
      return 'test-result';
    });
    
    expect(result).toBe('test-result');
    expect(capturedContext).toEqual({
      requestId: 'test-request',
      traceId: 'test-trace',
      fields: {}});
  });

  it('auto-generates missing requestId', () => {
    const ctx = { traceId: 'test-trace' };
    let capturedContext: any = null;
    
    withRequestContexts(ctx, () => {
      capturedContext = getRequestContext();
    });
    
    expect(capturedContext?.requestId).toBeDefined();
    expect(capturedContext?.requestId).toMatch(/^[0-9A-Z]{26}$/); // ULID format
    expect(capturedContext?.traceId).toBe('test-trace');
  });

  it('auto-generates missing traceId', () => {
    const ctx = { requestId: 'test-request' };
    let capturedContext: any = null;
    
    withRequestContexts(ctx, () => {
      capturedContext = getRequestContext();
    });
    
    expect(capturedContext?.requestId).toBe('test-request');
    expect(capturedContext?.traceId).toBeDefined();
    expect(capturedContext?.traceId).toMatch(/^[0-9A-Z]{26}$/); // ULID format
  });

  it('auto-generates both IDs when not provided', () => {
    const ctx = {};
    let capturedContext: any = null;
    
    withRequestContexts(ctx, () => {
      capturedContext = getRequestContext();
    });
    
    expect(capturedContext?.requestId).toBeDefined();
    expect(capturedContext?.traceId).toBeDefined();
    expect(capturedContext?.requestId).toMatch(/^[0-9A-Z]{26}$/);
    expect(capturedContext?.traceId).toMatch(/^[0-9A-Z]{26}$/);
    expect(capturedContext?.requestId).not.toBe(capturedContext?.traceId);
  });

  it('preserves parentSpanId when provided', () => {
    const ctx = { parentSpanId: 'parent-123' };
    let capturedContext: any = null;
    
    withRequestContexts(ctx, () => {
      capturedContext = getRequestContext();
    });
    
    expect(capturedContext?.parentSpanId).toBe('parent-123');
  });

  it('initializes empty fields object', () => {
    const ctx = {};
    let capturedContext: any = null;
    
    withRequestContexts(ctx, () => {
      capturedContext = getRequestContext();
    });
    
    expect(capturedContext?.fields).toEqual({});
  });

  it('preserves provided fields', () => {
    const ctx = { fields: { tenant: 'test-tenant', user: 'test-user' } };
    let capturedContext: any = null;
    
    withRequestContexts(ctx, () => {
      capturedContext = getRequestContext();
    });
    
    expect(capturedContext?.fields).toEqual({
      tenant: 'test-tenant',
      user: 'test-user'});
  });

  it('isolates context between different calls', () => {
    const ctx1 = { requestId: 'request-1', traceId: 'trace-1' };
    const ctx2 = { requestId: 'request-2', traceId: 'trace-2' };
    let context1: any = null;
    let context2: any = null;
    
    withRequestContexts(ctx1, () => {
      context1 = getRequestContext();
    });
    
    withRequestContexts(ctx2, () => {
      context2 = getRequestContext();
    });
    
    expect(context1?.requestId).toBe('request-1');
    expect(context2?.requestId).toBe('request-2');
  });

  it('returns undefined context outside of scope', () => {
    const context = getRequestContext();
    expect(context).toBeUndefined();
  });
});

describe('getRequestContext', () => {
  it('returns undefined when no context is set', () => {
    const context = getRequestContext();
    expect(context).toBeUndefined();
  });

  it('returns current context when set', () => {
    const ctx = { requestId: 'test-request', traceId: 'test-trace' };
    let capturedContext: any = null;
    
    withRequestContexts(ctx, () => {
      capturedContext = getRequestContext();
    });
    
    expect(capturedContext).toBeDefined();
    expect(capturedContext?.requestId).toBe('test-request');
  });
});

describe('getRequestId', () => {
  it('returns generated ID when no context exists', () => {
    const requestId = getRequestId();
    expect(requestId).toBeDefined();
    expect(requestId).toMatch(/^[0-9A-Z]{26}$/);
  });

  it('returns context requestId when available', () => {
    const ctx = { requestId: 'test-request' };
    let requestId: string = '';
    
    withRequestContexts(ctx, () => {
      requestId = getRequestId();
    });
    
    expect(requestId).toBe('test-request');
  });

  it('generates different IDs on multiple calls outside context', () => {
    const id1 = getRequestId();
    const id2 = getRequestId();
    expect(id1).not.toBe(id2);
  });
});

describe('getTraceId', () => {
  it('returns generated ID when no context exists', () => {
    const traceId = getTraceId();
    expect(traceId).toBeDefined();
    expect(traceId).toMatch(/^[0-9A-Z]{26}$/);
  });

  it('returns context traceId when available', () => {
    const ctx = { traceId: 'test-trace' };
    let traceId: string = '';
    
    withRequestContexts(ctx, () => {
      traceId = getTraceId();
    });
    
    expect(traceId).toBe('test-trace');
  });

  it('generates different IDs on multiple calls outside context', () => {
    const id1 = getTraceId();
    const id2 = getTraceId();
    expect(id1).not.toBe(id2);
  });
});

describe('setContextFields', () => {
  it('does nothing when no context exists', () => {
    expect(() => {
      setContextFields({ test: 'value' });
    }).not.toThrow();
  });

  it('merges fields into existing context', () => {
    const ctx = { fields: { existing: 'value' } };
    let capturedContext: any = null;
    
    withRequestContexts(ctx, () => {
      setContextFields({ new: 'value', another: 'field' });
      capturedContext = getRequestContext();
    });
    
    expect(capturedContext?.fields).toEqual({
      existing: 'value',
      new: 'value',
      another: 'field'});
  });

  it('creates fields object when none exists', () => {
    const ctx = {};
    let capturedContext: any = null;
    
    withRequestContexts(ctx, () => {
      setContextFields({ test: 'value' });
      capturedContext = getRequestContext();
    });
    
    expect(capturedContext?.fields).toEqual({ test: 'value' });
  });

  it('overwrites existing fields with same keys', () => {
    const ctx = { fields: { key: 'old-value' } };
    let capturedContext: any = null;
    
    withRequestContexts(ctx, () => {
      setContextFields({ key: 'new-value' });
      capturedContext = getRequestContext();
    });
    
    expect(capturedContext?.fields).toEqual({ key: 'new-value' });
  });

  it('preserves other fields when overwriting', () => {
    const ctx = { fields: { key1: 'value1', key2: 'value2' } };
    let capturedContext: any = null;
    
    withRequestContexts(ctx, () => {
      setContextFields({ key1: 'new-value1' });
      capturedContext = getRequestContext();
    });
    
    expect(capturedContext?.fields).toEqual({
      key1: 'new-value1',
      key2: 'value2'});
  });
});
