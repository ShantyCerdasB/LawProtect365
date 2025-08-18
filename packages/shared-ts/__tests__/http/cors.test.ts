/**
 * @file cors.test.ts
 * @summary Tests for buildCorsHeaders, isPreflight, and preflightResponse (100% line & branch coverage).
 */

import type { ApiResponse, ApiResponseStructured } from '../../src/http/httpTypes.js';
import { buildCorsHeaders, isPreflight, preflightResponse } from '../../src/http/cors.js';

describe('buildCorsHeaders', () => {
  it('builds headers from a single origin string and includes only configured fields', () => {
    const headers = buildCorsHeaders({
      allowOrigins: ['https://a.example'],
      allowMethods: undefined,
      allowHeaders: undefined,
      exposeHeaders: undefined,
      allowCredentials: false,
      maxAgeSeconds: undefined,
    });

    expect(headers).toEqual({
      'Access-Control-Allow-Origin': 'https://a.example',
      Vary: 'Origin',
    });

    // No unintended fields
    expect(headers['Access-Control-Allow-Methods']).toBeUndefined();
    expect(headers['Access-Control-Allow-Headers']).toBeUndefined();
    expect(headers['Access-Control-Expose-Headers']).toBeUndefined();
    expect(headers['Access-Control-Allow-Credentials']).toBeUndefined();
    expect(headers['Access-Control-Max-Age']).toBeUndefined();
  });

  it('joins array origins and sets optional fields when provided', () => {
    const headers = buildCorsHeaders({
      allowOrigins: ['https://a.com', 'https://b.com'],
      allowMethods: ['GET', 'POST'],
      allowHeaders: ['content-type', 'authorization'],
      exposeHeaders: ['x-request-id'],
      allowCredentials: true,
      maxAgeSeconds: 600,
    });

    expect(headers).toEqual({
      'Access-Control-Allow-Origin': 'https://a.com,https://b.com',
      'Access-Control-Allow-Methods': 'GET,POST',
      'Access-Control-Allow-Headers': 'content-type,authorization',
      'Access-Control-Expose-Headers': 'x-request-id',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '600',
      Vary: 'Origin',
    });
  });

  it('omits optional fields when arrays are empty', () => {
    const headers = buildCorsHeaders({
      allowOrigins: '*',
      allowMethods: [],
      allowHeaders: [],
      exposeHeaders: [],
      allowCredentials: false,
    });

    expect(headers).toEqual({
      'Access-Control-Allow-Origin': '*',
      Vary: 'Origin',
    });
  });
});

describe('isPreflight', () => {
  it('returns true for OPTIONS (case-insensitive)', () => {
    expect(isPreflight({ requestContext: { http: { method: 'OPTIONS' } } } as any)).toBe(true);
    expect(isPreflight({ requestContext: { http: { method: 'options' } } } as any)).toBe(true);
  });

  it('returns false for non-OPTIONS and when method is missing', () => {
    expect(isPreflight({ requestContext: { http: { method: 'GET' } } } as any)).toBe(false);
    expect(isPreflight({ requestContext: { http: {} } } as any)).toBe(false);
  });
});

describe('preflightResponse', () => {
  // Narrow ApiResponse -> ApiResponseStructured for safe property assertions
  const asStructured = (r: ApiResponse): ApiResponseStructured =>
    (typeof r === 'string' ? { statusCode: 200, body: r } : r) as ApiResponseStructured;

  it('returns a 204 structured response with provided headers and empty body', () => {
    const corsHeaders = { 'Access-Control-Allow-Origin': '*' };
    const res = preflightResponse(corsHeaders);
    const s = asStructured(res);

    expect(s.statusCode).toBe(204);
    expect(s.headers).toBe(corsHeaders);
    expect(s.body).toBe('');
  });
});
