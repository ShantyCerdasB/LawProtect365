import { getHeaders, extractHeaderToken, requireHeaderToken } from '../../src/http/headers.js';
import { AppError, ErrorCodes } from '../../src/index.js';

describe('getHeaders', () => {
  it('should return undefined when headers is undefined', () => {
    const result = getHeaders(undefined, 'content-type');

    expect(result).toBeUndefined();
  });

  it('should return undefined when headers is null', () => {
    const result = getHeaders(null as any, 'content-type');

    expect(result).toBeUndefined();
  });

  it('should return header value for exact match', () => {
    const headers = { 'content-type': 'application/json' };
    const result = getHeaders(headers, 'content-type');

    expect(result).toBe('application/json');
  });

  it('should return header value for case-insensitive match', () => {
    const headers = { 'Content-Type': 'application/json' };
    const result = getHeaders(headers, 'content-type');

    expect(result).toBe('application/json');
  });

  it('should return header value for mixed case match', () => {
    const headers = { 'Content-Type': 'application/json' };
    const result = getHeaders(headers, 'CONTENT-TYPE');

    expect(result).toBe('application/json');
  });

  it('should return first element when header value is array', () => {
    const headers = { 'content-type': ['application/json', 'text/html'] };
    const result = getHeaders(headers, 'content-type');

    expect(result).toBe('application/json');
  });

  it('should return undefined when header is not found', () => {
    const headers = { 'content-type': 'application/json' };
    const result = getHeaders(headers, 'authorization');

    expect(result).toBeUndefined();
  });

  it('should convert number to string', () => {
    const headers = { 'content-length': 123 };
    const result = getHeaders(headers, 'content-length');

    expect(result).toBe('123');
  });

  it('should convert boolean to string', () => {
    const headers = { 'x-custom': true };
    const result = getHeaders(headers, 'x-custom');

    expect(result).toBe('true');
  });

  it('should convert bigint to string', () => {
    const headers = { 'x-custom': BigInt(123) };
    const result = getHeaders(headers, 'x-custom');

    expect(result).toBe('123');
  });

  it('should convert symbol to string', () => {
    const headers = { 'x-custom': Symbol('test') };
    const result = getHeaders(headers, 'x-custom');

    expect(result).toBe('Symbol(test)');
  });

  it('should convert function to string', () => {
    const headers = { 'x-custom': () => {} };
    const result = getHeaders(headers, 'x-custom');

    expect(result).toBe('[Function]');
  });

  it('should convert object to string', () => {
    const headers = { 'x-custom': { key: 'value' } };
    const result = getHeaders(headers, 'x-custom');

    expect(result).toBe('[object Object]');
  });

  it('should return undefined for null value', () => {
    const headers = { 'x-custom': null };
    const result = getHeaders(headers, 'x-custom');

    expect(result).toBeUndefined();
  });

  it('should return undefined for undefined value', () => {
    const headers = { 'x-custom': undefined };
    const result = getHeaders(headers, 'x-custom');

    expect(result).toBeUndefined();
  });

  it('should handle array with non-string first element', () => {
    const headers = { 'x-custom': [123, 'string'] };
    const result = getHeaders(headers, 'x-custom');

    expect(result).toBe('123');
  });

  it('should handle array with object first element', () => {
    const headers = { 'x-custom': [{ key: 'value' }, 'string'] };
    const result = getHeaders(headers, 'x-custom');

    expect(result).toBe('[object Object]');
  });
});

describe('extractHeaderToken', () => {
  it('should return token when header exists and meets minimum length', () => {
    const headers = { 'x-request-token': 'valid-token-123456' };
    const result = extractHeaderToken(headers);

    expect(result).toBe('valid-token-123456');
  });

  it('should return token when header exists and meets custom minimum length', () => {
    const headers = { 'x-request-token': 'valid-token-123456' };
    const result = extractHeaderToken(headers, 'x-request-token', 8);

    expect(result).toBe('valid-token-123456');
  });

  it('should return null when header is missing', () => {
    const headers = { 'content-type': 'application/json' };
    const result = extractHeaderToken(headers);

    expect(result).toBeNull();
  });

  it('should return null when header is undefined', () => {
    const result = extractHeaderToken(undefined);

    expect(result).toBeNull();
  });

  it('should return null when header value is too short', () => {
    const headers = { 'x-request-token': 'short' };
    const result = extractHeaderToken(headers);

    expect(result).toBeNull();
  });

  it('should return null when header value is exactly minimum length minus 1', () => {
    const headers = { 'x-request-token': '123456789012345' }; // 15 chars
    const result = extractHeaderToken(headers);

    expect(result).toBeNull();
  });

  it('should return token when header value is exactly minimum length', () => {
    const headers = { 'x-request-token': '1234567890123456' }; // 16 chars
    const result = extractHeaderToken(headers);

    expect(result).toBe('1234567890123456');
  });

  it('should trim whitespace from token', () => {
    const headers = { 'x-request-token': '  valid-token-123456  ' };
    const result = extractHeaderToken(headers);

    expect(result).toBe('valid-token-123456');
  });

  it('should return null when trimmed token is too short', () => {
    const headers = { 'x-request-token': '  short  ' };
    const result = extractHeaderToken(headers);

    expect(result).toBeNull();
  });

  it('should work with custom header name', () => {
    const headers = { 'authorization': 'Bearer valid-token-123456' };
    const result = extractHeaderToken(headers, 'authorization');

    expect(result).toBe('Bearer valid-token-123456');
  });

  it('should work with case-insensitive header name', () => {
    const headers = { 'X-Request-Token': 'valid-token-123456' };
    const result = extractHeaderToken(headers, 'x-request-token');

    expect(result).toBe('valid-token-123456');
  });

  it('should handle array header values', () => {
    const headers = { 'x-request-token': ['valid-token-123456', 'other-token'] };
    const result = extractHeaderToken(headers);

    expect(result).toBe('valid-token-123456');
  });

  it('should handle non-string header values', () => {
    const headers = { 'x-request-token': 1234567890123456 };
    const result = extractHeaderToken(headers);

    expect(result).toBe('1234567890123456');
  });
});

describe('requireHeaderToken', () => {
  it('should return token when header exists and meets minimum length', () => {
    const headers = { 'x-request-token': 'valid-token-123456' };
    const result = requireHeaderToken(headers);

    expect(result).toBe('valid-token-123456');
  });

  it('should throw AppError when header is missing', () => {
    const headers = { 'content-type': 'application/json' };

    expect(() => requireHeaderToken(headers)).toThrow(AppError);
    expect(() => requireHeaderToken(headers)).toThrow('Missing/invalid header: x-request-token');
  });

  it('should throw AppError when header is undefined', () => {
    expect(() => requireHeaderToken(undefined)).toThrow(AppError);
    expect(() => requireHeaderToken(undefined)).toThrow('Missing/invalid header: x-request-token');
  });

  it('should throw AppError when header value is too short', () => {
    const headers = { 'x-request-token': 'short' };

    expect(() => requireHeaderToken(headers)).toThrow(AppError);
    expect(() => requireHeaderToken(headers)).toThrow('Missing/invalid header: x-request-token');
  });

  it('should throw AppError with correct error code and status', () => {
    const headers = { 'x-request-token': 'short' };

    expect(() => requireHeaderToken(headers)).toThrow(AppError);
    try {
      requireHeaderToken(headers);
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe(ErrorCodes.AUTH_FORBIDDEN);
      expect((error as AppError).statusCode).toBe(403);
    }
  });

  it('should work with custom header name', () => {
    const headers = { 'authorization': 'Bearer valid-token-123456' };
    const result = requireHeaderToken(headers, 'authorization');

    expect(result).toBe('Bearer valid-token-123456');
  });

  it('should throw AppError with custom header name', () => {
    const headers = { 'content-type': 'application/json' };

    expect(() => requireHeaderToken(headers, 'authorization')).toThrow('Missing/invalid header: authorization');
  });

  it('should work with custom minimum length', () => {
    const headers = { 'x-request-token': 'valid-token-123456' };
    const result = requireHeaderToken(headers, 'x-request-token', 8);

    expect(result).toBe('valid-token-123456');
  });

  it('should throw AppError when token is too short for custom minimum length', () => {
    const headers = { 'x-request-token': '123456789012345' }; // 15 chars

    expect(() => requireHeaderToken(headers, 'x-request-token', 16)).toThrow('Missing/invalid header: x-request-token');
  });

  it('should trim whitespace from token', () => {
    const headers = { 'x-request-token': '  valid-token-123456  ' };
    const result = requireHeaderToken(headers);

    expect(result).toBe('valid-token-123456');
  });

  it('should throw AppError when trimmed token is too short', () => {
    const headers = { 'x-request-token': '  short  ' };

    expect(() => requireHeaderToken(headers)).toThrow('Missing/invalid header: x-request-token');
  });
});