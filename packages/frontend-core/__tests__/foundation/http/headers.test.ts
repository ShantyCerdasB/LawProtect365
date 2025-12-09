/**
 * @fileoverview Headers Tests - Unit tests for HTTP header utilities
 * @summary Tests for buildContextHeaders function
 */

import { buildContextHeaders } from '../../../src/foundation/http/headers';
import type { NetworkContext } from '../../../src/foundation/http/types';

describe('buildContextHeaders', () => {
  it('should build headers with token only', () => {
    const headers = buildContextHeaders({ token: 'test-token' });

    expect(headers).toEqual({
      authorization: 'Bearer test-token',
    });
  });

  it('should build headers with network context only', () => {
    const context: NetworkContext = {
      ip: '192.168.1.1',
      country: 'US',
      userAgent: 'Mozilla/5.0',
      requestId: 'req-123',
    };

    const headers = buildContextHeaders({ context });

    expect(headers).toEqual({
      'x-forwarded-for': '192.168.1.1',
      'x-country': 'US',
      'x-user-agent': 'Mozilla/5.0',
      'x-request-id': 'req-123',
    });
  });

  it('should build headers with token and context', () => {
    const context: NetworkContext = {
      ip: '192.168.1.1',
      country: 'US',
    };

    const headers = buildContextHeaders({
      token: 'test-token',
      context,
    });

    expect(headers).toEqual({
      authorization: 'Bearer test-token',
      'x-forwarded-for': '192.168.1.1',
      'x-country': 'US',
    });
  });

  it('should build headers with extra headers', () => {
    const headers = buildContextHeaders({
      token: 'test-token',
      extra: {
        'X-Custom-Header': 'custom-value',
        'X-Another-Header': 'another-value',
      },
    });

    expect(headers).toEqual({
      authorization: 'Bearer test-token',
      'x-custom-header': 'custom-value',
      'x-another-header': 'another-value',
    });
  });

  it('should lowercase all header keys', () => {
    const headers = buildContextHeaders({
      extra: {
        'X-Upper-Case': 'value',
        'Mixed-Case-Header': 'value',
      },
    });

    expect(headers).toEqual({
      'x-upper-case': 'value',
      'mixed-case-header': 'value',
    });
  });

  it('should ignore undefined extra header values', () => {
    const headers = buildContextHeaders({
      extra: {
        'X-Defined': 'value',
        'X-Undefined': undefined,
      },
    });

    expect(headers).toEqual({
      'x-defined': 'value',
    });
  });

  it('should handle empty context', () => {
    const headers = buildContextHeaders({});

    expect(headers).toEqual({});
  });

  it('should handle partial network context', () => {
    const context: NetworkContext = {
      ip: '192.168.1.1',
    };

    const headers = buildContextHeaders({ context });

    expect(headers).toEqual({
      'x-forwarded-for': '192.168.1.1',
    });
  });
});

