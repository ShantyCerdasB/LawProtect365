/**
 * @file middleware.test.ts
 * @summary Tests for withAuth: token extraction, verification outcomes, and error mapping.
 */

import { withAuth } from '../../src/auth/middleware.js';
import type { ApiEvent, ApiResponse, HandlerFn } from '../../src/http/httpTypes.js';

jest.mock('../../src/auth/jwtVerifier.js', () => {
  const actual = jest.requireActual('../../src/auth/jwtVerifier.js');
  return { ...actual, verifyJwt: jest.fn() };
});
import { verifyJwt } from '../../src/auth/jwtVerifier.js';

jest.mock('@errors/mapError.js', () => ({
  mapError: jest.fn((e: any) => ({
    statusCode: e?.statusCode ?? 500,
    code: e?.code,
    message: e?.message ?? String(e),
    name: e?.name}))}));
import { mapError } from '../../src/errors/mapError.js';

const makeEvent = (headers: Record<string, string> = {}): ApiEvent =>
  ({
    version: '2.0',
    routeKey: '$default',
    rawPath: '/',
    rawQueryString: '',
    headers,
    requestContext: {} as any,
    isBase64Encoded: false} as unknown as ApiEvent);

const okResponse = (body: unknown): ApiResponse =>
  ({ statusCode: 200, body: JSON.stringify(body) } as ApiResponse);

describe('withAuth', () => {
  const verifyJwtMock = verifyJwt as unknown as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when Authorization is missing or not Bearer', async () => {
    const handler: HandlerFn = withAuth(async () => okResponse({ ok: true }));

    const res1 = await handler(makeEvent({}));
    expect(mapError).toHaveBeenCalled();
    expect(res1).toMatchObject({
      statusCode: 401,
      message: expect.stringMatching(/missing bearer token/i)});

    const res2 = await handler(makeEvent({ authorization: 'Basic x' }));
    expect(res2).toMatchObject({ statusCode: 401 });
  });

  it('attaches auth context and invokes inner handler on success', async () => {
    verifyJwtMock.mockResolvedValueOnce({
      header: { alg: 'RS256' },
      payload: {},
      claims: {
        sub: 'user-1',
        roles: ['lawyer'],
        scopes: ['case:read'],
        raw: { foo: 'bar' },
        email: 'u@example.com'}});

    const inner: HandlerFn = jest.fn(async (evt: ApiEvent) => okResponse({ received: true }));
    const handler = withAuth(inner, { issuer: 'https://issuer', audience: 'client' });

    const res = await handler(makeEvent({ authorization: 'Bearer token-abc' }));
    expect(res).toMatchObject({ statusCode: 200 });

    const authedEvt = (inner as jest.Mock).mock.calls[0][0] as any;
    expect(authedEvt.auth).toMatchObject({
      userId: 'user-1',
      roles: ['lawyer'],
      scopes: ['case:read'],
      email: 'u@example.com',
      token: 'token-abc'});
  });

  it('uses uppercase Authorization header and defaults roles/scopes when absent', async () => {
    verifyJwtMock.mockResolvedValueOnce({
      header: {},
      payload: {},
      claims: {
        sub: 'user-2',
        roles: undefined,
        scopes: undefined,
        raw: {},
        email: undefined}});

    const inner: HandlerFn = jest.fn(async (evt: ApiEvent) => okResponse({ ok: true, auth: (evt as any).auth }));
    const handler = withAuth(inner);

    const res = await handler(makeEvent({ Authorization: 'Bearer TOK' }));
    expect(res).toMatchObject({ statusCode: 200 });

    const authedEvt = (inner as jest.Mock).mock.calls[0][0] as any;
    expect(authedEvt.auth).toMatchObject({
      userId: 'user-2',
      roles: [],
      scopes: [],
      token: 'TOK'});
  });

  // 🔥 Nuevo: cubre el caso donde 'authorization' existe pero es '' (no nullish),
  // por lo que NO se usa el fallback 'Authorization' y se responde 401.
  it('does not fallback to Authorization when authorization is an empty string', async () => {
    const handler: HandlerFn = withAuth(async () => okResponse({ ok: true }));
    const res = await handler(
      makeEvent({
        authorization: '',             // existe pero es cadena vacía
        Authorization: 'Bearer SHOULD_NOT_BE_USED'}));

    expect(verifyJwtMock).not.toHaveBeenCalled();
    expect(res).toMatchObject({
      statusCode: 401,
      message: expect.stringMatching(/missing bearer token/i)});
  });

  it('maps JWTExpired to 401 Unauthorized', async () => {
    verifyJwtMock.mockRejectedValueOnce(Object.assign(new Error('exp'), { name: 'JWTExpired' }));
    const handler: HandlerFn = withAuth(async () => okResponse({}));

    const res = await handler(makeEvent({ authorization: 'Bearer tok' }));
    expect(res).toMatchObject({ statusCode: 401, message: expect.stringMatching(/token expired/i) });
  });

  it.each(['JWTInvalid', 'JWSInvalid', 'JWSSignatureVerificationFailed', 'JWTClaimValidationFailed'])(
    'maps %s to 401 Invalid token',
    async (name) => {
      verifyJwtMock.mockRejectedValueOnce(Object.assign(new Error('bad'), { name }));
      const handler: HandlerFn = withAuth(async () => okResponse({}));

      const res = await handler(makeEvent({ authorization: 'Bearer tok' }));
      expect(res).toMatchObject({ statusCode: 401, message: expect.stringMatching(/invalid token/i) });
    });

  it('delegates unexpected errors to mapError', async () => {
    const unknown = Object.assign(new Error('boom'), { name: 'SomethingElse', statusCode: 503, code: 'X' });
    verifyJwtMock.mockRejectedValueOnce(unknown);

    const handler: HandlerFn = withAuth(async () => okResponse({}));
    const res = await handler(makeEvent({ authorization: 'Bearer tok' }));

    expect((mapError as jest.Mock).mock.calls.pop()?.[0]).toBe(unknown);
    expect(res).toMatchObject({ statusCode: 503, code: 'X', message: 'boom' });
  });
});
