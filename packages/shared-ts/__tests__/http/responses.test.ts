/**
 * @file responses.test.ts
 * @summary Tests for JSON response helpers (100% line & branch coverage).
 */

import type { ApiResponse, ApiResponseStructured } from '../../src/http/httpTypes.js';
import {
  json,
  ok,
  created,
  noContent,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  unsupportedMedia,
  unprocessable,
  tooManyRequests,
  internalError,
  notImplemented,
} from '../../src/http/responses.js';
import { HttpStatus } from '../../src/http/httpTypes.js';

// Narrow ApiResponse -> ApiResponseStructured for safe property access in tests
const asStructured = (r: ApiResponse): ApiResponseStructured =>
  (typeof r === 'string' ? { statusCode: 200, body: r } : r) as ApiResponseStructured;

const bodyText = (r: ApiResponse) =>
  typeof r === 'string' ? r : String((r as ApiResponseStructured).body);

describe('json()', () => {
  it('returns a structured response with default JSON content-type and empty body when data is undefined', () => {
    const res = json(HttpStatus.OK);
    const s = asStructured(res);

    expect(s.statusCode).toBe(200);
    expect(s.headers).toEqual({
      'Content-Type': 'application/json; charset=utf-8',
    });
    expect(s.body).toBe('');
  });

  it('stringifies data and merges headers with caller overrides taking precedence (including Content-Type)', () => {
    const res = json(
      HttpStatus.CREATED,
      { a: 1 },
      { 'X-Custom': 'v', 'Content-Type': 'application/vnd.api+json' }
    );
    const s = asStructured(res);

    expect(s.statusCode).toBe(201);
    expect(s.headers).toEqual({
      'Content-Type': 'application/vnd.api+json',
      'X-Custom': 'v',
    });
    expect(s.body).toBe(JSON.stringify({ a: 1 }));
  });

  it('stringifies non-object values and preserves null explicitly', () => {
    expect(asStructured(json(HttpStatus.OK, 'hi')).body).toBe(JSON.stringify('hi'));
    expect(asStructured(json(HttpStatus.OK, 123)).body).toBe(JSON.stringify(123));
    expect(asStructured(json(HttpStatus.OK, null)).body).toBe('null');
    expect(asStructured(json(HttpStatus.OK, false)).body).toBe('false');
  });
});

describe('shortcut helpers', () => {
  it('ok()', () => {
    const res = ok({ ok: true }, { A: '1' });
    const s = asStructured(res);
    expect(s.statusCode).toBe(200);
    expect(s.headers).toMatchObject({ A: '1' });
    expect(s.body).toBe(JSON.stringify({ ok: true }));
  });

  it('created()', () => {
    const res = created({ id: 'x' });
    const s = asStructured(res);
    expect(s.statusCode).toBe(201);
    expect(s.body).toBe(JSON.stringify({ id: 'x' }));
  });

  it('noContent()', () => {
    const res = noContent({ H: 'v' });
    const s = asStructured(res);
    expect(s.statusCode).toBe(204);
    expect(s.headers).toMatchObject({ H: 'v' });
    expect(s.body).toBe('');
  });
});

describe('error helpers', () => {
  it('badRequest() with default and custom details', () => {
    const dflt = asStructured(badRequest());
    expect(dflt.statusCode).toBe(400);
    expect(JSON.parse(bodyText(dflt))).toEqual({
      error: 'BadRequest',
      message: 'Bad Request',
      details: undefined,
    });

    const details = { field: 'name' };
    const custom = asStructured(badRequest('Invalid', details));
    expect(JSON.parse(bodyText(custom))).toEqual({
      error: 'BadRequest',
      message: 'Invalid',
      details,
    });
  });

  it('unauthorized() default and custom', () => {
    const d = asStructured(unauthorized());
    expect(d.statusCode).toBe(401);
    expect(JSON.parse(bodyText(d))).toEqual({ error: 'Unauthorized', message: 'Unauthorized' });

    const c = asStructured(unauthorized('Auth needed'));
    expect(c.statusCode).toBe(401);
    expect(JSON.parse(bodyText(c))).toEqual({ error: 'Unauthorized', message: 'Auth needed' });
  });

  it('forbidden() custom', () => {
    const res = asStructured(forbidden('Nope'));
    expect(res.statusCode).toBe(403);
    expect(JSON.parse(bodyText(res))).toEqual({
      error: 'Forbidden',
      message: 'Nope',
    });
  });

  it('notFound() default and custom', () => {
    const d = asStructured(notFound());
    expect(d.statusCode).toBe(404);
    expect(JSON.parse(bodyText(d))).toEqual({ error: 'NotFound', message: 'Not Found' });

    const c = asStructured(notFound('Missing resource'));
    expect(c.statusCode).toBe(404);
    expect(JSON.parse(bodyText(c))).toEqual({ error: 'NotFound', message: 'Missing resource' });
  });

  it('conflict() custom', () => {
    const res = asStructured(conflict('Already exists'));
    expect(res.statusCode).toBe(409);
    expect(JSON.parse(bodyText(res))).toEqual({
      error: 'Conflict',
      message: 'Already exists',
    });
  });

  it('unsupportedMedia() default and custom', () => {
    const d = asStructured(unsupportedMedia());
    expect(d.statusCode).toBe(415);
    expect(JSON.parse(bodyText(d))).toEqual({
      error: 'UnsupportedMediaType',
      message: 'Unsupported Media Type',
    });

    const c = asStructured(unsupportedMedia('Bad type'));
    expect(JSON.parse(bodyText(c))).toEqual({
      error: 'UnsupportedMediaType',
      message: 'Bad type',
    });
  });

  it('unprocessable() with and without details', () => {
    const r1 = asStructured(unprocessable());
    expect(r1.statusCode).toBe(422);
    expect(JSON.parse(bodyText(r1))).toEqual({
      error: 'UnprocessableEntity',
      message: 'Unprocessable Entity',
      details: undefined,
    });

    const details = [{ path: ['a'], message: 'bad' }];
    const r2 = asStructured(unprocessable('Invalid', details));
    expect(JSON.parse(bodyText(r2))).toEqual({
      error: 'UnprocessableEntity',
      message: 'Invalid',
      details,
    });
  });

  it('tooManyRequests() default and custom', () => {
    const d = asStructured(tooManyRequests());
    expect(d.statusCode).toBe(429);
    expect(JSON.parse(bodyText(d))).toEqual({
      error: 'TooManyRequests',
      message: 'Too Many Requests',
    });

    const c = asStructured(tooManyRequests('Slow down'));
    expect(JSON.parse(bodyText(c))).toEqual({
      error: 'TooManyRequests',
      message: 'Slow down',
    });
  });

  it('internalError() default and custom', () => {
    const d = asStructured(internalError());
    expect(d.statusCode).toBe(500);
    expect(JSON.parse(bodyText(d))).toEqual({
      error: 'InternalError',
      message: 'Internal Error',
    });

    const c = asStructured(internalError('Oops'));
    expect(JSON.parse(bodyText(c))).toEqual({
      error: 'InternalError',
      message: 'Oops',
    });
  });

  it('notImplemented() custom', () => {
    const res = asStructured(notImplemented('Soon'));
    expect(res.statusCode).toBe(501);
    expect(JSON.parse(bodyText(res))).toEqual({
      error: 'NotImplemented',
      message: 'Soon',
    });
  });
});
