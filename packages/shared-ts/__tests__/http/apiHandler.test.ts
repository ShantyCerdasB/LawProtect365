/**
 * @file apiHandler.test.ts
 * @summary Tests for apiHandler wrapper (100% line & branch coverage).
 *
 * Mocks:
 *  - @errors/mapError.js
 *  - ./cors.js (buildCorsHeaders, isPreflight, preflightResponse)
 */

// Mock with the exact specifiers the SUT uses
jest.mock('@errors/mapError.js', () => ({
  mapError: jest.fn(),
}));

jest.mock('../../src/http/cors.js', () => ({
  buildCorsHeaders: jest.fn(),
  isPreflight: jest.fn(),
  preflightResponse: jest.fn(),
}));

import type { ApiResponse, ApiResponseStructured } from '../../src/http/httpTypes.js';
import { apiHandler } from '../../src/http/apiHandler.js';
import { mapError } from '../../src/errors/mapError.js';
import { buildCorsHeaders, isPreflight, preflightResponse } from '../../src/http/cors.js';

const mapErrorMock = mapError as unknown as jest.Mock;
const buildCorsHeadersMock = buildCorsHeaders as unknown as jest.Mock;
const isPreflightMock = isPreflight as unknown as jest.Mock;
const preflightResponseMock = preflightResponse as unknown as jest.Mock;

const baseEvent = (): any => ({
  headers: {},
  requestContext: { requestId: 'req-ctx-1' },
});

// Narrow ApiResponse -> ApiResponseStructured before accessing props
const asStructured = (res: ApiResponse): ApiResponseStructured =>
  typeof res === 'string'
    ? ({ statusCode: 200, body: res } as ApiResponseStructured)
    : (res as ApiResponseStructured);

const bodyText = (res: ApiResponse) =>
  typeof res === 'string' ? res : String((res as ApiResponseStructured).body);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('apiHandler — success path', () => {
  it('wraps a handler that returns a string and produces a structured response; merges headers with correct precedence', async () => {
    const fn = jest.fn(async () => 'hello');
    const handler = apiHandler(fn, {
      defaultHeaders: { X: 'def', K: 'keep' },
    });

    const res = await handler(baseEvent());
    const s = asStructured(res);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(s.statusCode).toBe(200);
    expect(s.body).toBe('hello');
    expect(s.headers).toEqual({ X: 'def', K: 'keep' });
    expect(isPreflightMock).not.toHaveBeenCalled();
  });

  it('merges defaultHeaders, CORS headers, then response headers (response has highest precedence)', async () => {
    const fn = jest.fn(async () => ({
      statusCode: 201,
      body: 'ok',
      headers: { X: 'resp', A: '1' },
    }));

    buildCorsHeadersMock.mockReturnValueOnce({ X: 'cors', C: 'cv' });

    const handler = apiHandler(fn, {
      cors: { allowOrigins: '*', allowMethods: ['GET'] } as any,
      defaultHeaders: { X: 'def', K: 'keep' },
    });

    const res = await handler(baseEvent());
    const s = asStructured(res);

    expect(s.statusCode).toBe(201);
    expect(s.body).toBe('ok');
    expect(s.headers).toEqual({
      K: 'keep', // default
      C: 'cv',   // CORS
      X: 'resp', // response overrides both
      A: '1',    // response
    });

    // Because opts.cors is spread last, allowMethods from opts overrides defaults
    expect(buildCorsHeadersMock).toHaveBeenCalledWith(
      expect.objectContaining({
        allowMethods: ['GET'],
        allowHeaders: ['*'],
        allowOrigins: '*',
      }),
    );
  });
});

describe('apiHandler — preflight', () => {
  it('handles preflight when CORS is enabled and isPreflight returns true', async () => {
    const fn = jest.fn(); // should not be called
    buildCorsHeadersMock.mockReturnValueOnce({ 'Access-Control-Allow-Origin': '*' });
    isPreflightMock.mockReturnValueOnce(true);

    preflightResponseMock.mockImplementationOnce((_h: any) => ({
      statusCode: 204,
      body: '',
      headers: { P: '1' },
    }));

    const handler = apiHandler(fn, { cors: { allowOrigins: '*' } as any });

    const res = await handler(baseEvent());
    const s = asStructured(res);

    expect(fn).not.toHaveBeenCalled();
    expect(isPreflightMock).toHaveBeenCalledTimes(1);
    expect(s.statusCode).toBe(204);
    expect(s.headers).toEqual({
      'Access-Control-Allow-Origin': '*',
      P: '1',
    });
  });
});

describe('apiHandler — error path', () => {
  it('maps errors via mapError and merges headers; uses requestId from requestContext', async () => {
    const boom = new Error('boom');
    const fn = jest.fn(async () => {
      throw boom;
    });

    mapErrorMock.mockReturnValueOnce({
      statusCode: 500,
      body: JSON.stringify({ error: 'E', message: 'm', requestId: 'req-ctx-1' }),
      headers: { H: 'map' },
    });

    buildCorsHeadersMock.mockReturnValueOnce({ C: 'cors' });

    const handler = apiHandler(fn, {
      cors: { allowOrigins: '*' } as any,
      defaultHeaders: { D: 'def' },
    });

    const res = await handler(baseEvent());
    const s = asStructured(res);

    expect(mapErrorMock).toHaveBeenCalledWith(boom, { requestId: 'req-ctx-1' });
    expect(s.headers).toEqual({ D: 'def', C: 'cors', H: 'map' });
    expect(s.statusCode).toBe(500);
    expect(JSON.parse(bodyText(res))).toMatchObject({
      error: 'E',
      message: 'm',
      requestId: 'req-ctx-1',
    });
  });

  it('falls back to x-request-id (lowercase) header when requestContext id is missing', async () => {
    const event = {
      ...baseEvent(),
      requestContext: { requestId: '' },
      headers: { 'x-request-id': 'hdr-lower' },
    };

    const fn = jest.fn(async () => {
      throw new Error('x');
    });

    mapErrorMock.mockReturnValueOnce({ statusCode: 400, body: '{"ok":true}' });

    const handler = apiHandler(fn);
    await handler(event as any);

    expect(mapErrorMock).toHaveBeenCalledWith(expect.any(Error), { requestId: 'hdr-lower' });
  });

  it('falls back to X-Request-Id (capitalized) header if lowercase not present', async () => {
    const event = {
      ...baseEvent(),
      requestContext: { requestId: '' },
      headers: { 'X-Request-Id': 'HDR-UP' },
    };

    const fn = jest.fn(async () => {
      throw new Error('y');
    });

    mapErrorMock.mockReturnValueOnce({ statusCode: 500, body: '{}' });

    const handler = apiHandler(fn);
    await handler(event as any);

    expect(mapErrorMock).toHaveBeenCalledWith(expect.any(Error), { requestId: 'HDR-UP' });
  });
});
