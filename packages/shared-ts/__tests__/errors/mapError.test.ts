/**
 * @file mapError.test.ts
 * @summary Tests for mapError end-to-end (100% line & branch coverage).
 */

import type { APIGatewayProxyResultV2 } from 'aws-lambda';
import { mapError } from '../../src/errors/mapError.js';
import { AppError } from '../../src/errors/AppError.js';
import { ErrorCodes } from '../../src/errors/codes.js';

type Structured = Exclude<APIGatewayProxyResultV2, string>;

const asStructured = (r: APIGatewayProxyResultV2): Structured =>
  typeof r === 'string' ? (JSON.parse(r) as Structured) : r;

const parseBody = (r: APIGatewayProxyResultV2) =>
  typeof r === 'string' ? JSON.parse(r) : JSON.parse(String(r.body));

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('mapError → AppError passthrough', () => {
  it('renders AppError with headers, requestId, and without details by default (prod)', () => {
    delete process.env.ENV;
    const err = new AppError('CUSTOM_CODE' as any, 418, 'Teapot', { a: 1 });

    const res = mapError(err, {
      requestId: 'req-1',
      headers: { 'x-extra': 'ok' }});

    const s = asStructured(res);
    expect(s.statusCode).toBe(418);
    expect(s.headers).toEqual({
      'Content-Type': 'application/json; charset=utf-8',
      'x-request-id': 'req-1',
      'x-extra': 'ok'});

    const body = parseBody(res);
    expect(body).toEqual({
      error: 'CUSTOM_CODE',
      message: 'Teapot',
      requestId: 'req-1'});
  });

  it('exposes details when opts.exposeDetails=true regardless of ENV', () => {
    process.env.ENV = 'prod';
    const details = { reason: 'bad' };
    const err = new AppError('X' as any, 400, 'oops', details);

    const res = mapError(err, { exposeDetails: true, requestId: '123' });

    const s = asStructured(res);
    expect(s.statusCode).toBe(400);

    const body = parseBody(res);
    expect(body).toEqual({
      error: 'X',
      message: 'oops',
      details,
      requestId: '123'});
  });

  it('exposes details automatically in dev/staging when opts.exposeDetails is undefined', () => {
    process.env.ENV = 'StAgInG';
    const err = new AppError('Y' as any, 409, 'conflict', { id: '42' });

    const res = mapError(err);
    const s = asStructured(res);
    expect(s.statusCode).toBe(409);

    const body = parseBody(res);
    expect(body).toEqual({
      error: 'Y',
      message: 'conflict',
      details: { id: '42' }});
  });
});

describe('mapError → provider/classification mappings', () => {
  it('maps ZodError to 422 with issues; details shown in dev', () => {
    process.env.ENV = 'dev';
    const zodErr = { name: 'ZodError', issues: [{ path: ['a'], message: 'bad' }] };

    const res = mapError(zodErr);
    const s = asStructured(res);
    expect(s.statusCode).toBe(422);

    const body = parseBody(res);
    expect(body.error).toBe(ErrorCodes.COMMON_UNPROCESSABLE_ENTITY);
    expect(body.message).toBe('Unprocessable Entity');
    expect(body.details).toEqual({ issues: zodErr.issues });
  });

  it('maps JSON SyntaxError to 400', () => {
    const res = mapError(new SyntaxError('Unexpected token in JSON at position 1'));
    const s = asStructured(res);
    expect(s.statusCode).toBe(400);
    expect(parseBody(res)).toEqual({
      error: ErrorCodes.COMMON_BAD_REQUEST,
      message: 'Bad Request'});
  });

  it('maps throttling (by name) to 429 and adds Retry-After when missing', () => {
    const res = mapError({ name: 'ThrottlingException' });
    const s = asStructured(res);

    expect(s.statusCode).toBe(429);
    expect(s.headers?.['Retry-After']).toBe('1');

    const body = parseBody(res);
    expect(body).toEqual({
      error: ErrorCodes.COMMON_TOO_MANY_REQUESTS,
      message: 'Too Many Requests'});
  });

  it('maps throttling (by code) to 429 and preserves existing Retry-After header', () => {
    const res = mapError(
      { code: 'TooManyRequestsException' },
      { headers: { 'Retry-After': '10' } }
    );
    const s = asStructured(res);
    expect(s.statusCode).toBe(429);
    expect(s.headers?.['Retry-After']).toBe('10');
  });

  it('maps ConditionalCheckFailedException to 409', () => {
    const res1 = mapError({ name: 'ConditionalCheckFailedException' });
    const res2 = mapError({ code: 'ConditionalCheckFailedException' });

    expect(asStructured(res1).statusCode).toBe(409);
    expect(asStructured(res2).statusCode).toBe(409);
    expect(parseBody(res1)).toEqual({
      error: ErrorCodes.COMMON_CONFLICT,
      message: 'Conflict'});
  });

  it('maps ValidationException to 400', () => {
    const r1 = mapError({ name: 'ValidationException' });
    const r2 = mapError({ code: 'ValidationException' });

    expect(asStructured(r1).statusCode).toBe(400);
    expect(asStructured(r2).statusCode).toBe(400);
    expect(parseBody(r1)).toEqual({
      error: ErrorCodes.COMMON_BAD_REQUEST,
      message: 'Bad Request'});
  });

  it('maps AccessDeniedException to 403', () => {
    const r = mapError({ name: 'AccessDeniedException' });
    expect(asStructured(r).statusCode).toBe(403);
    expect(parseBody(r)).toEqual({
      error: ErrorCodes.AUTH_FORBIDDEN,
      message: 'Forbidden'});
  });

  it('maps ResourceNotFoundException to 404', () => {
    const r = mapError({ code: 'ResourceNotFoundException' });
    expect(asStructured(r).statusCode).toBe(404);
    expect(parseBody(r)).toEqual({
      error: ErrorCodes.COMMON_NOT_FOUND,
      message: 'Not Found'});
  });

  it('falls back to 500 for unknown errors', () => {
    const r = mapError(new Error('unknown'));
    expect(asStructured(r).statusCode).toBe(500);
    expect(parseBody(r)).toEqual({
      error: ErrorCodes.COMMON_INTERNAL_ERROR,
      message: 'Internal Error'});
  });
});

describe('mapError headers', () => {
  it('always includes Content-Type and merges provided headers', () => {
    const err = new AppError('X' as any, 400, 'bad');
    const res = mapError(err, { headers: { 'x-custom': '1' } });

    const s = asStructured(res);
    expect(s.headers).toMatchObject({
      'Content-Type': 'application/json; charset=utf-8',
      'x-custom': '1'});
  });

  it('omits x-request-id when not provided; includes when provided (stringified)', () => {
    const err = new AppError('X' as any, 400, 'bad');

    const r1 = mapError(err);
    expect(asStructured(r1).headers?.['x-request-id']).toBeUndefined();

    const r2 = mapError(err, { requestId: '12345' });
    expect(asStructured(r2).headers?.['x-request-id']).toBe('12345');

    const body = parseBody(r2);
    expect(body.requestId).toBe('12345');
  });
});
