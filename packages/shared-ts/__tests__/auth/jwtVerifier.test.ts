/**
 * @file jwtVerifier.test.ts
 * @summary Tests for bearerFromAuthHeader and verifyJwt (with jose/env mocks).
 */

import { bearerFromAuthHeader, verifyJwt } from '../../src/auth/jwtVerifier.js';
import * as jose from 'jose';

jest.mock('jose', () => ({
  createRemoteJWKSet: jest.fn(),
  jwtVerify: jest.fn(),
}));

jest.mock('../../src/utils/env.js', () => ({
  getEnv: jest.fn((name: string) => {
    if (name === 'JWT_ISSUER') return 'https://env-issuer.example';
    if (name === 'JWT_AUDIENCE') return 'env-client';
    return undefined;
  }),
  getNumber: jest.fn((_name: string, def: number) => def),
}));

describe('bearerFromAuthHeader', () => {
  it('extracts token with "Bearer" (any case)', () => {
    expect(bearerFromAuthHeader('Bearer abc.def.ghi')).toBe('abc.def.ghi');
    expect(bearerFromAuthHeader('bearer xyz')).toBe('xyz');
  });

  it('returns undefined on missing or malformed header', () => {
    expect(bearerFromAuthHeader(undefined)).toBeUndefined();
    expect(bearerFromAuthHeader(null as any)).toBeUndefined();
    expect(bearerFromAuthHeader('Basic foo')).toBeUndefined();
    expect(bearerFromAuthHeader('Bearer')).toBeUndefined();
  });
});

describe('verifyJwt', () => {
  const createRemoteJWKSetMock = jose.createRemoteJWKSet as unknown as jest.Mock;
  const jwtVerifyMock = jose.jwtVerify as unknown as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('verifies RS256 with provided issuer/audience and explicit jwksUri', async () => {
    createRemoteJWKSetMock.mockReturnValueOnce({ jwks: true });

    const payload = {
      sub: 'u-1',
      iss: 'https://issuer-x',
      aud: 'client-x',
      scope: 'a b',
      'cognito:groups': ['admin'],
      tenant_id: 't-1',
      email: 'a@b.c',
      email_verified: true,
      exp: 123,
      iat: 100,
      jti: 'j1',
    };

    jwtVerifyMock.mockResolvedValueOnce({
      payload,
      protectedHeader: { alg: 'RS256', kid: 'kid-1' },
    });

    const res = await verifyJwt('token-123', {
      issuer: 'https://issuer-x',
      audience: 'client-x',
      jwksUri: 'https://issuer-x/custom/jwks.json',
      clockToleranceSec: 7,
    });

    expect(createRemoteJWKSetMock).toHaveBeenCalledTimes(1);
    const urlArg = createRemoteJWKSetMock.mock.calls[0][0] as URL;
    expect(urlArg.href).toBe('https://issuer-x/custom/jwks.json');

    expect(jwtVerifyMock).toHaveBeenCalledWith(
      'token-123',
      expect.anything(),
      expect.objectContaining({
        issuer: 'https://issuer-x',
        audience: 'client-x',
        algorithms: ['RS256'],
        clockTolerance: 7,
      }),
    );

    expect(res.header).toEqual({ alg: 'RS256', kid: 'kid-1' });
    expect(res.payload).toMatchObject(payload);
    expect(res.claims.sub).toBe('u-1');
    expect(res.claims.roles).toEqual(['admin']);
    expect(res.claims.scopes).toEqual(['a', 'b']);
    expect(res.claims.tenantId).toBe('t-1');
    expect(res.claims.email).toBe('a@b.c');
    expect(res.claims.emailVerified).toBe(true);
  });

  it('falls back to issuer/.well-known/jwks.json and env issuer/audience, with default clock tolerance', async () => {
    createRemoteJWKSetMock.mockReturnValueOnce({ jwks: true });
    jwtVerifyMock.mockResolvedValueOnce({
      payload: { sub: 's', iss: 'i' },
      protectedHeader: {},
    });

    const res = await verifyJwt('tkn', {});

    expect(createRemoteJWKSetMock).toHaveBeenCalledTimes(1);
    const urlArg = createRemoteJWKSetMock.mock.calls[0][0] as URL;
    expect(urlArg.href).toBe('https://env-issuer.example/.well-known/jwks.json');

    expect(jwtVerifyMock).toHaveBeenCalledWith(
      'tkn',
      expect.anything(),
      expect.objectContaining({
        issuer: 'https://env-issuer.example',
        audience: 'env-client',
        algorithms: ['RS256'],
        clockTolerance: 5,
      }),
    );

    expect(res.claims.sub).toBe('s');
  });
});
