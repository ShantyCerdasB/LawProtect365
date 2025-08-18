/**
 * @file request.test.ts
 * @summary Tests for getHeader, getPathParam, getQueryParam, and getJsonBody (100% line & branch coverage).
 */

import { getHeader, getPathParam, getQueryParam, getJsonBody } from '../../src/http/request.js';
import { BadRequestError } from '../../src/errors/errors.js';

const makeEvt = (overrides: Partial<any> = {}) =>
  ({
    headers: {},
    pathParameters: {},
    queryStringParameters: {},
    isBase64Encoded: false,
    body: undefined,
    requestContext: { http: { method: 'GET' } },
    ...overrides,
  } as any);

describe('getHeader', () => {
  it('returns a header value case-insensitively', () => {
    const evt = makeEvt({ headers: { 'X-Request-ID': 'ABC', accept: 'json' } });

    expect(getHeader(evt, 'x-request-id')).toBe('ABC');
    expect(getHeader(evt, 'ACCEPT')).toBe('json');
    expect(getHeader(evt, 'missing')).toBeUndefined();
  });

  it('handles missing headers object', () => {
    const evt = makeEvt({ headers: undefined });
    expect(getHeader(evt, 'anything')).toBeUndefined();
  });
});

describe('getPathParam', () => {
  it('returns the path parameter when present', () => {
    const evt = makeEvt({ pathParameters: { id: '42' } });
    expect(getPathParam(evt, 'id')).toBe('42');
  });

  it('returns undefined when absent or container missing', () => {
    expect(getPathParam(makeEvt({ pathParameters: { } }), 'id')).toBeUndefined();
    expect(getPathParam(makeEvt({ pathParameters: undefined }), 'id')).toBeUndefined();
  });
});

describe('getQueryParam', () => {
  it('returns the query parameter when present', () => {
    const evt = makeEvt({ queryStringParameters: { q: 'term' } });
    expect(getQueryParam(evt, 'q')).toBe('term');
  });

  it('returns undefined when absent or container missing', () => {
    expect(getQueryParam(makeEvt({ queryStringParameters: { } }), 'q')).toBeUndefined();
    expect(getQueryParam(makeEvt({ queryStringParameters: undefined }), 'q')).toBeUndefined();
  });
});

describe('getJsonBody', () => {
  it('returns {} when body is missing or empty', () => {
    expect(getJsonBody(makeEvt({ body: undefined }))).toEqual({});
    expect(getJsonBody(makeEvt({ body: '' }))).toEqual({});
  });

  it('parses plain JSON when not base64-encoded', () => {
    const payload = { a: 1, s: 'x' };
    const evt = makeEvt({ body: JSON.stringify(payload) });
    expect(getJsonBody<typeof payload>(evt)).toEqual(payload);
  });

  it('decodes base64 and parses JSON when isBase64Encoded=true', () => {
    const payload = { k: 'v', n: 7 };
    const b64 = Buffer.from(JSON.stringify(payload)).toString('base64');
    const evt = makeEvt({ isBase64Encoded: true, body: b64 });
    expect(getJsonBody<typeof payload>(evt)).toEqual(payload);
  });

  it('throws BadRequestError on invalid JSON', () => {
    const evt = makeEvt({ body: '{not-json' });
    expect(() => getJsonBody(evt)).toThrow(BadRequestError);
    try {
      getJsonBody(evt);
    } catch (e) {
      const err = e as BadRequestError;
      expect(err).toBeInstanceOf(BadRequestError);
      expect(err.message).toBe('Invalid JSON body');
      expect(err.statusCode).toBe(400);
    }
  });
});
