import { getHeader, getPathParam, getQueryParam, getJsonBody } from '../../src/http/request.js';
import { BadRequestError } from '../../src/errors/errors.js';

describe('getHeader', () => {
  let mockEvent: any;

  beforeEach(() => {
    mockEvent = {
      headers: {
        'content-type': 'application/json',
        'Authorization': 'Bearer token123',
        'X-Custom-Header': 'custom-value',
      },
    };
  });

  it('should return header value for exact match', () => {
    const result = getHeader(mockEvent, 'content-type');

    expect(result).toBe('application/json');
  });

  it('should return header value for case-insensitive match', () => {
    const result = getHeader(mockEvent, 'CONTENT-TYPE');

    expect(result).toBe('application/json');
  });

  it('should return header value for mixed case match', () => {
    const result = getHeader(mockEvent, 'authorization');

    expect(result).toBe('Bearer token123');
  });

  it('should return undefined when header is not found', () => {
    const result = getHeader(mockEvent, 'non-existent-header');

    expect(result).toBeUndefined();
  });

  it('should return undefined when headers is undefined', () => {
    const eventWithoutHeaders = { ...mockEvent };
    delete eventWithoutHeaders.headers;

    const result = getHeader(eventWithoutHeaders, 'content-type');

    expect(result).toBeUndefined();
  });

  it('should return undefined when headers is null', () => {
    const eventWithNullHeaders = { ...mockEvent, headers: null };

    const result = getHeader(eventWithNullHeaders, 'content-type');

    expect(result).toBeUndefined();
  });

  it('should handle empty headers object', () => {
    const eventWithEmptyHeaders = { ...mockEvent, headers: {} };

    const result = getHeader(eventWithEmptyHeaders, 'content-type');

    expect(result).toBeUndefined();
  });
});

describe('getPathParam', () => {
  let mockEvent: any;

  beforeEach(() => {
    mockEvent = {
      pathParameters: {
        id: '123',
        userId: 'user-456',
      },
    };
  });

  it('should return path parameter value when it exists', () => {
    const result = getPathParam(mockEvent, 'id');

    expect(result).toBe('123');
  });

  it('should return path parameter value for different parameter', () => {
    const result = getPathParam(mockEvent, 'userId');

    expect(result).toBe('user-456');
  });

  it('should return undefined when path parameter does not exist', () => {
    const result = getPathParam(mockEvent, 'non-existent-param');

    expect(result).toBeUndefined();
  });

  it('should return undefined when pathParameters is undefined', () => {
    const eventWithoutPathParams = { ...mockEvent };
    delete eventWithoutPathParams.pathParameters;

    const result = getPathParam(eventWithoutPathParams, 'id');

    expect(result).toBeUndefined();
  });

  it('should return undefined when pathParameters is null', () => {
    const eventWithNullPathParams = { ...mockEvent, pathParameters: null };

    const result = getPathParam(eventWithNullPathParams, 'id');

    expect(result).toBeUndefined();
  });

  it('should handle empty pathParameters object', () => {
    const eventWithEmptyPathParams = { ...mockEvent, pathParameters: {} };

    const result = getPathParam(eventWithEmptyPathParams, 'id');

    expect(result).toBeUndefined();
  });
});

describe('getQueryParam', () => {
  let mockEvent: any;

  beforeEach(() => {
    mockEvent = {
      queryStringParameters: {
        page: '1',
        limit: '10',
        search: 'test query',
      },
    };
  });

  it('should return query parameter value when it exists', () => {
    const result = getQueryParam(mockEvent, 'page');

    expect(result).toBe('1');
  });

  it('should return query parameter value for different parameter', () => {
    const result = getQueryParam(mockEvent, 'search');

    expect(result).toBe('test query');
  });

  it('should return undefined when query parameter does not exist', () => {
    const result = getQueryParam(mockEvent, 'non-existent-param');

    expect(result).toBeUndefined();
  });

  it('should return undefined when queryStringParameters is undefined', () => {
    const eventWithoutQueryParams = { ...mockEvent };
    delete eventWithoutQueryParams.queryStringParameters;

    const result = getQueryParam(eventWithoutQueryParams, 'page');

    expect(result).toBeUndefined();
  });

  it('should return undefined when queryStringParameters is null', () => {
    const eventWithNullQueryParams = { ...mockEvent, queryStringParameters: null };

    const result = getQueryParam(eventWithNullQueryParams, 'page');

    expect(result).toBeUndefined();
  });

  it('should handle empty queryStringParameters object', () => {
    const eventWithEmptyQueryParams = { ...mockEvent, queryStringParameters: {} };

    const result = getQueryParam(eventWithEmptyQueryParams, 'page');

    expect(result).toBeUndefined();
  });
});

describe('getJsonBody', () => {
  let mockEvent: any;

  beforeEach(() => {
    mockEvent = {
      body: '{"name": "test", "value": 123}',
      isBase64Encoded: false,
    };
  });

  it('should parse valid JSON body', () => {
    const result = getJsonBody(mockEvent);

    expect(result).toEqual({ name: 'test', value: 123 });
  });

  it('should parse valid JSON body with type parameter', () => {
    interface TestBody {
      name: string;
      value: number;
    }

    const result = getJsonBody<TestBody>(mockEvent);

    expect(result).toEqual({ name: 'test', value: 123 });
  });

  it('should return empty object when body is undefined', () => {
    const eventWithoutBody = { ...mockEvent };
    delete eventWithoutBody.body;

    const result = getJsonBody(eventWithoutBody);

    expect(result).toEqual({});
  });

  it('should return empty object when body is null', () => {
    const eventWithNullBody = { ...mockEvent, body: null };

    const result = getJsonBody(eventWithNullBody);

    expect(result).toEqual({});
  });

  it('should return empty object when body is empty string', () => {
    const eventWithEmptyBody = { ...mockEvent, body: '' };

    const result = getJsonBody(eventWithEmptyBody);

    expect(result).toEqual({});
  });

  it('should throw BadRequestError for invalid JSON', () => {
    const eventWithInvalidJson = { ...mockEvent, body: 'invalid json' };

    expect(() => getJsonBody(eventWithInvalidJson)).toThrow(BadRequestError);
    expect(() => getJsonBody(eventWithInvalidJson)).toThrow('Invalid JSON body');
  });

  it('should throw BadRequestError for malformed JSON', () => {
    const eventWithMalformedJson = { ...mockEvent, body: '{"name": "test", "value":}' };

    expect(() => getJsonBody(eventWithMalformedJson)).toThrow(BadRequestError);
    expect(() => getJsonBody(eventWithMalformedJson)).toThrow('Invalid JSON body');
  });

  it('should decode base64 encoded body', () => {
    const jsonString = '{"name": "test", "value": 123}';
    const base64Body = Buffer.from(jsonString, 'utf8').toString('base64');
    const eventWithBase64Body = { ...mockEvent, body: base64Body, isBase64Encoded: true };

    const result = getJsonBody(eventWithBase64Body);

    expect(result).toEqual({ name: 'test', value: 123 });
  });

  it('should throw BadRequestError for invalid base64 encoded body', () => {
    const eventWithInvalidBase64 = { ...mockEvent, body: 'invalid-base64', isBase64Encoded: true };

    expect(() => getJsonBody(eventWithInvalidBase64)).toThrow(BadRequestError);
    expect(() => getJsonBody(eventWithInvalidBase64)).toThrow('Invalid JSON body');
  });

  it('should handle complex JSON objects', () => {
    const complexJson = {
      users: [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' }
      ],
      metadata: {
        total: 2,
        page: 1
      }
    };
    const eventWithComplexJson = { ...mockEvent, body: JSON.stringify(complexJson) };

    const result = getJsonBody(eventWithComplexJson);

    expect(result).toEqual(complexJson);
  });

  it('should handle JSON arrays', () => {
    const jsonArray = [1, 2, 3, 'test'];
    const eventWithJsonArray = { ...mockEvent, body: JSON.stringify(jsonArray) };

    const result = getJsonBody(eventWithJsonArray);

    expect(result).toEqual(jsonArray);
  });

  it('should handle JSON primitives', () => {
    const eventWithString = { ...mockEvent, body: '"test string"' };
    const eventWithNumber = { ...mockEvent, body: '123' };
    const eventWithBoolean = { ...mockEvent, body: 'true' };
    const eventWithNull = { ...mockEvent, body: 'null' };

    expect(getJsonBody(eventWithString)).toBe('test string');
    expect(getJsonBody(eventWithNumber)).toBe(123);
    expect(getJsonBody(eventWithBoolean)).toBe(true);
    expect(getJsonBody(eventWithNull)).toBeNull();
  });

  it('should handle whitespace in JSON body', () => {
    const eventWithWhitespace = { ...mockEvent, body: '  {"name": "test"}  ' };

    const result = getJsonBody(eventWithWhitespace);

    expect(result).toEqual({ name: 'test' });
  });
});