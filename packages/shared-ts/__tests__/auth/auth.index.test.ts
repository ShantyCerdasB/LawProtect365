/**
 * @file auth.index.test.ts
 * @summary Verifies the auth barrel re-exports and spot-checks key helpers.
 */

import * as auth from '../../src/auth/index.js';

describe('auth barrel exports', () => {
  it('exposes role helpers', () => {
    expect(typeof auth.hasRole).toBe('function');
    expect(typeof auth.hasAtLeastRole).toBe('function');
    expect(typeof auth.maxRole).toBe('function');
    expect(typeof auth.normalizeRoles).toBe('function');
    expect(typeof auth.toRole).toBe('function');

    expect(auth.hasRole(['ADMIN'], 'admin')).toBe(true);
    expect(auth.toRole('SUPER-ADMIN')).toBe('super_admin');
    expect(auth.maxRole(['client', 'LAWYER'])).toBe('lawyer');
    expect(auth.hasAtLeastRole(['client', 'admin'], 'lawyer')).toBe(true);
  });

  it('exposes claims utilities', () => {
    expect(typeof auth.toJwtClaims).toBe('function');

    const claims = auth.toJwtClaims({
      sub: 'u1',
      iss: 'https://issuer',
      scope: 'a b',
      email: 'u@example.com',
      'cognito:groups': ['admin'],
      'custom:tenantId': 't-1'});
    expect(claims).toMatchObject({
      sub: 'u1',
      iss: 'https://issuer',
      scopes: ['a', 'b'],
      roles: ['admin'],
      email: 'u@example.com'});
  });

  it('exposes scope helpers', () => {
    expect(typeof auth.parseScopes).toBe('function');
    expect(typeof auth.hasAllScopes).toBe('function');
    expect(typeof auth.hasAnyScope).toBe('function');

    const s = auth.parseScopes('read:doc write:doc');
    expect(s).toEqual(['read:doc', 'write:doc']);
    expect(auth.hasAllScopes(s, ['read:doc'])).toBe(true);
    expect(auth.hasAnyScope(s, ['x', 'write:doc'])).toBe(true);
  });

  it('exposes access decision helper', () => {
    expect(typeof auth.can).toBe('function');

    // super_admin → allow everything
    const sa = { userId: 'u', roles: ['super_admin'], scopes: [], rawClaims: {} } as any;
    expect(auth.can(sa, 'delete', { resource: 'document' } as any)).toBe(true);

    // non-admin requires scope or permission
    const user = { userId: 'u2', roles: ['client'], scopes: ['document:read'], rawClaims: {} } as any;
    expect(auth.can(user, 'read', { resource: 'document' } as any)).toBe(true);
    expect(auth.can(user, 'write', { resource: 'document' } as any)).toBe(false);
  });

  it('exposes guards', () => {
    expect(typeof auth.requireAuth).toBe('function');
    expect(typeof auth.requireScopes).toBe('function');
    expect(typeof auth.requirePermissions).toBe('function');
    expect(typeof auth.requireTenant).toBe('function');

    const evt = { auth: { userId: 'u', roles: [], scopes: [], rawClaims: {} } } as any;
    const ctx = auth.requireAuth(evt);
    expect(ctx.userId).toBe('u');

    const evtScopes = { auth: { userId: 'u', roles: [], scopes: ['a', 'b'], rawClaims: {} } } as any;
    expect(auth.requireScopes(evtScopes, ['a'])).toBe(evtScopes.auth);
  });

  it('exposes middleware and jwt helpers', () => {
    expect(typeof auth.withAuth).toBe('function');
    expect(typeof auth.bearerFromAuthHeader).toBe('function');
    expect(typeof auth.verifyJwt).toBe('function'); // presence only; verifyJwt tested elsewhere

    expect(auth.bearerFromAuthHeader('Bearer tok-123')).toBe('tok-123');
    expect(auth.bearerFromAuthHeader('Basic xyz')).toBeUndefined();
  });

  it('exposes policy engine and common rules', async () => {
    expect(typeof auth.Policy).toBe('function');
    expect(typeof auth.allowSuperAdmin).toBe('function');
    expect(typeof auth.allowAdminSameTenant).toBe('function');
    expect(typeof auth.allowPermissionOrScope).toBe('function');

    const p = new auth.Policy()
      .addRule('sa', auth.allowSuperAdmin)
      .addRule('adminSame', auth.allowAdminSameTenant)
      .addRule('permOrScope', auth.allowPermissionOrScope);

    const superAdmin = { userId: 'u', roles: ['super_admin'], scopes: [], rawClaims: {} } as any;
    const admin = { userId: 'a', roles: ['admin'], scopes: [], rawClaims: {} } as any;
    const nonAdmin = { userId: 'n', roles: ['client'], scopes: ['document:read'], rawClaims: {} } as any;

    const r1 = await p.evaluate(superAdmin, 'manage', { resource: 'user' } as any);
    expect(r1).toEqual(expect.objectContaining({ effect: 'allow' }));

    const r2 = await p.evaluate(admin, 'read', { resource: 'case'} as any);
    expect(r2).toEqual(expect.objectContaining({ effect: 'allow' }));

    const r3 = await p.evaluate(nonAdmin, 'read', { resource: 'document' } as any);
    expect(r3).toEqual(expect.objectContaining({ effect: 'allow' }));
  });
});
