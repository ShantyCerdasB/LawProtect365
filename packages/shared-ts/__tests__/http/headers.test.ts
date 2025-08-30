/**
 * @file headers.test.ts
 * @summary Tests for HTTP header utilities.
 */

import { getHeaders, extractHeaderToken, requireHeaderToken } from '../../src/http/headers.js';
import { AppError } from '../../src/errors/AppError.js';

describe('getHeaders', () => {
  it('returns undefined for null headers', () => {
    const result = getHeaders(undefined, 'content-type');
    expect(result).toBeUndefined();
  });

  it('returns undefined for empty headers', () => {
    const result = getHeaders({}, 'content-type');
    expect(result).toBeUndefined();
  });

  it('finds header with exact case', () => {
    const headers = { 'Content-Type': 'application/json' };
    const result = getHeaders(headers, 'Content-Type');
    expect(result).toBe('application/json');
  });

  it('finds header with different case', () => {
    const headers = { 'Content-Type': 'application/json' };
    const result = getHeaders(headers, 'content-type');
    expect(result).toBe('application/json');
  });

  it('finds header with mixed case', () => {
    const headers = { 'Content-Type': 'application/json' };
    const result = getHeaders(headers, 'CONTENT-TYPE');
    expect(result).toBe('application/json');
  });

  it('returns first item from array header', () => {
    const headers = { 'Accept': ['application/json', 'text/html'] };
    const result = getHeaders(headers, 'accept');
    expect(result).toBe('application/json');
  });

  it('converts non-string array item to string', () => {
    const headers = { 'X-Custom': [123, 'text'] };
    const result = getHeaders(headers, 'x-custom');
    expect(result).toBe('123');
  });

  it('converts non-string value to string', () => {
    const headers = { 'X-Number': 42 };
    const result = getHeaders(headers, 'x-number');
    expect(result).toBe('42');
  });

  it('returns undefined for null value', () => {
    const headers = { 'X-Null': null };
    const result = getHeaders(headers, 'x-null');
    expect(result).toBeUndefined();
  });

  it('returns undefined for undefined value', () => {
    const headers = { 'X-Undefined': undefined };
    const result = getHeaders(headers, 'x-undefined');
    expect(result).toBeUndefined();
  });

  it('converts falsy non-null values to string', () => {
    const headers = { 'X-Zero': 0, 'X-Empty': '' };
    expect(getHeaders(headers, 'x-zero')).toBe('0');
    expect(getHeaders(headers, 'x-empty')).toBe('');
  });
});

describe('extractHeaderToken', () => {
  it('returns null for missing header', () => {
    const headers = {};
    const result = extractHeaderToken(headers, 'x-auth-token');
    expect(result).toBeNull();
  });

  it('returns null for empty header', () => {
    const headers = { 'x-auth-token': '' };
    const result = extractHeaderToken(headers, 'x-auth-token');
    expect(result).toBeNull();
  });

  it('returns null for whitespace-only header', () => {
    const headers = { 'x-auth-token': '   ' };
    const result = extractHeaderToken(headers, 'x-auth-token');
    expect(result).toBeNull();
  });

  it('returns null for token shorter than minimum length', () => {
    const headers = { 'x-auth-token': 'short' };
    const result = extractHeaderToken(headers, 'x-auth-token', 10);
    expect(result).toBeNull();
  });

  it('returns trimmed token when length is sufficient', () => {
    const headers = { 'x-auth-token': '  valid-token-123  ' };
    const result = extractHeaderToken(headers, 'x-auth-token', 10);
    expect(result).toBe('valid-token-123');
  });

  it('uses default header name', () => {
    const headers = { 'x-request-token': 'valid-token-123456' };
    const result = extractHeaderToken(headers);
    expect(result).toBe('valid-token-123456');
  });

  it('uses default minimum length', () => {
    const headers = { 'x-auth-token': '1234567890123456' }; // 16 chars
    const result = extractHeaderToken(headers, 'x-auth-token');
    expect(result).toBe('1234567890123456');
  });

  it('returns null for token exactly at minimum length boundary', () => {
    const headers = { 'x-auth-token': '123456789012345' }; // 15 chars
    const result = extractHeaderToken(headers, 'x-auth-token', 16);
    expect(result).toBeNull();
  });
});

describe('requireHeaderToken', () => {
  it('returns token when valid', () => {
    const headers = { 'x-auth-token': 'valid-token-123' };
    const result = requireHeaderToken(headers, 'x-auth-token', 10);
    expect(result).toBe('valid-token-123');
  });

  it('throws AppError for missing header', () => {
    const headers = {};
    expect(() => {
      requireHeaderToken(headers, 'x-auth-token');
    }).toThrow(AppError);
  });

  it('throws AppError for invalid header', () => {
    const headers = { 'x-auth-token': 'short' };
    expect(() => {
      requireHeaderToken(headers, 'x-auth-token', 10);
    }).toThrow(AppError);
  });

  it('throws error with correct message', () => {
    const headers = {};
    expect(() => {
      requireHeaderToken(headers, 'x-custom-token', 20);
    }).toThrow('Missing/invalid header: x-custom-token');
  });

  it('uses default header name in error message', () => {
    const headers = {};
    expect(() => {
      requireHeaderToken(headers);
    }).toThrow('Missing/invalid header: x-request-token');
  });

  it('handles case-insensitive header lookup', () => {
    const headers = { 'X-REQUEST-TOKEN': 'valid-token-123456' };
    const result = requireHeaderToken(headers);
    expect(result).toBe('valid-token-123456');
  });
});
