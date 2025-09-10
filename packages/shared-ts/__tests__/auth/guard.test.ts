/**
 * @file guard.test.ts
 * @summary Unit tests for auth guard helpers: requireAuth, requireScopes, requirePermissions, requireTenant.
 */

import {
  requireAuth,
  requireScopes,
  requirePermissions,
  requireTenant} from '../../src/auth/guard.js';
import type { ApiEvent } from '../../src/http/httpTypes.js';
import type { AuthContext } from '../../src/types/auth.js';
import type { Permission } from '../../src/types/security.js';
import type { TenantId, UserId } from '../../src/types/brand.js';
import { ErrorCodes } from '../../src/errors/codes.js';

const P = (s: string) => s as unknown as Permission;
const T = (s: string) => s as unknown as TenantId;
const U = (s: string) => s as unknown as UserId;

const evtWithAuth = (auth: Partial<AuthContext>): ApiEvent =>
  ({ auth: { userId: U('u-1'), roles: [], scopes: [], rawClaims: {}, ...auth } } as unknown as ApiEvent);

/**
 * Asserts a function throws and that the thrown value matches a partial shape.
 */
function expectToThrowMatching(fn: () => unknown, shape: Partial<Record<string, unknown>>) {
  try {
    fn();
    // eslint-disable-next-line no-undef
    fail('Expected function to throw');
  } catch (e: any) {
    expect(e).toBeInstanceOf(Error);
    expect(e).toMatchObject(shape);
  }
}

describe('requireAuth', () => {
  it('returns the attached AuthContext when present', () => {
    const evt = evtWithAuth({ roles: ['client'], scopes: ['x'] });
    const ctx = requireAuth(evt);
    expect(ctx.userId).toBe('u-1');
    expect(ctx.roles).toEqual(['client']);
  });

  it('throws Unauthorized when auth is missing', () => {
    const evt = {} as unknown as ApiEvent;
    expectToThrowMatching(() => requireAuth(evt), {
      name: 'UnauthorizedError',
      statusCode: 401,
      code: ErrorCodes.AUTH_UNAUTHORIZED,
      message: expect.stringMatching(/missing authentication/i)});
  });
});

describe('requireScopes', () => {
  it('allows when all required scopes are present', () => {
    const evt = evtWithAuth({ scopes: ['a', 'b', 'c'] });
    const ctx = requireScopes(evt, ['a', 'c']);
    expect(ctx.scopes).toEqual(['a', 'b', 'c']);
  });

  it('denies when a required scope is missing', () => {
    const evt = evtWithAuth({ scopes: ['a'] });
    expectToThrowMatching(() => requireScopes(evt, ['a', 'b']), {
      name: 'ForbiddenError',
      statusCode: 403,
      code: ErrorCodes.AUTH_FORBIDDEN,
      message: expect.stringMatching(/insufficient scopes/i)});
  });

  it('treats undefined scopes as empty set (nullish branch)', () => {
    const evt = evtWithAuth({ scopes: undefined });
    expectToThrowMatching(() => requireScopes(evt, ['x']), {
      name: 'ForbiddenError',
      statusCode: 403,
      code: ErrorCodes.AUTH_FORBIDDEN,
      message: expect.stringMatching(/insufficient scopes/i)});
  });
});

describe('requirePermissions', () => {
  it('allows when all required permissions are present', () => {
    const evt = evtWithAuth({ permissions: [P('document:read'), P('case:write')] });
    const ctx = requirePermissions(evt, [P('case:write')]);
    expect(ctx.permissions).toContain('case:write');
  });

  it('denies when a required permission is missing', () => {
    const evt = evtWithAuth({ permissions: [P('document:read')] });
    expectToThrowMatching(() => requirePermissions(evt, [P('document:read'), P('case:write')]), {
      name: 'ForbiddenError',
      statusCode: 403,
      code: ErrorCodes.AUTH_FORBIDDEN,
      message: expect.stringMatching(/insufficient permissions/i)});
  });

  it('handles undefined permissions as empty set', () => {
    const evt = evtWithAuth({ permissions: undefined });
    expectToThrowMatching(() => requirePermissions(evt, [P('payment:manage')]), {
      name: 'ForbiddenError',
      statusCode: 403,
      code: ErrorCodes.AUTH_FORBIDDEN});
  });
});

describe('requireTenant', () => {
  it('allows when tenant matches', () => {
    const evt = evtWithAuth({ });
    const ctx = requireTenant(evt, 't-1');
    expect(ctx).toBe('t-1');
  });

  it('denies when tenant mismatches', () => {
    const evt = evtWithAuth({ });
    expectToThrowMatching(() => requireTenant(evt, 't-2'), {
      name: 'ForbiddenError',
      statusCode: 403,
      code: ErrorCodes.AUTH_FORBIDDEN,
      message: expect.stringMatching(/tenant mismatch/i)});
  });

  it('denies when subject tenant is missing', () => {
    const evt = evtWithAuth({ });
    expectToThrowMatching(() => requireTenant(evt, 't-1'), {
      name: 'ForbiddenError',
      statusCode: 403,
      code: ErrorCodes.AUTH_FORBIDDEN});
  });
});
