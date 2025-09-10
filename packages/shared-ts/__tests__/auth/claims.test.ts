/**
 * @file claims.test.ts
 * @summary Unit tests for `toJwtClaims` normalization.
 */

import { toJwtClaims } from '../../src/auth/claims.js';

describe('toJwtClaims', () => {
  it('maps standard OpenID claims with string audience', () => {
    const payload = {
      sub: 'u-1',
      iss: 'https://issuer.example.com',
      aud: 'client-123',
      exp: 1234567890,
      iat: 1234567000,
      jti: 'jti-1',
      email: 'a@example.com',
      email_verified: true};
    const c = toJwtClaims(payload);

    expect(c.sub).toBe('u-1');
    expect(c.iss).toBe('https://issuer.example.com');
    expect(c.aud).toBe('client-123');
    expect(c.exp).toBe(1234567890);
    expect(c.iat).toBe(1234567000);
    expect(c.jti).toBe('jti-1');
    expect(c.email).toBe('a@example.com');
    expect(c.emailVerified).toBe(true);
    expect(c.roles).toEqual([]);
    expect(c.scopes).toEqual([]);
    expect(c).toBeUndefined();
    expect(c.raw).toBe(payload);
  });

  it('supports audience as an array', () => {
    const payload = { sub: 'u-2', iss: 'iss', aud: ['a', 'b'] };
    const c = toJwtClaims(payload as any);
    expect(c.aud).toEqual(['a', 'b']);
  });

  it('parses scopes from "scope" (space-delimited)', () => {
    const payload = { sub: 'u', iss: 'iss', scope: 'read:docs write:docs  admin' };
    const c = toJwtClaims(payload as any);
    expect(c.scopes).toEqual(['read:docs', 'write:docs', 'admin']);
  });

  it('parses scopes from "scp" when "scope" is absent', () => {
    const payload = { sub: 'u', iss: 'iss', scp: 'User.Read offline_access' };
    const c = toJwtClaims(payload as any);
    expect(c.scopes).toEqual(['User.Read', 'offline_access']);
  });

  it('prefers roles from cognito:groups over roles array', () => {
    const payload = {
      sub: 'u',
      iss: 'iss',
      'cognito:groups': ['admin', 'lawyer', 123, null],
      roles: ['client']};
    const c = toJwtClaims(payload as any);
    expect(c.roles).toEqual(['admin', 'lawyer']);
  });

  it('falls back to roles array when cognito:groups is missing', () => {
    const payload = { sub: 'u', iss: 'iss', roles: ['client', 'lawyer', 0] };
    const c = toJwtClaims(payload as any);
    expect(c.roles).toEqual(['client', 'lawyer']);
  });

  it('resolves tenantId from "tenant_id"', () => {
    const payload = { sub: 'u', iss: 'iss', tenant_id: 't-1' };
    const c = toJwtClaims(payload as any);
    expect(c).toBe('t-1');
  });

  it('resolves tenantId from "custom:tenantId"', () => {
    const payload = { sub: 'u', iss: 'iss', 'custom:tenantId': 't-2' };
    const c = toJwtClaims(payload as any);
    expect(c).toBe('t-2');
  });

  it('resolves tenantId from namespaced claim', () => {
    const payload = {
      sub: 'u',
      iss: 'iss',
      'https://claims.example.com/tenant_id': 't-3'};
    const c = toJwtClaims(payload as any);
    expect(c).toBe('t-3');
  });

  it('filters non-string roles and normalizes missing fields', () => {
    const payload = {
      aud: 123, // ignored
      exp: 'bad', // ignored
      iat: 'bad', // ignored
      jti: 99, // ignored
      email_verified: 'nope', // ignored
      email: 42, // ignored
      roles: ['r1', 2, null]};
    const c = toJwtClaims(payload as any);
    expect(c.sub).toBe(''); // defaulted
    expect(c.iss).toBe(''); // defaulted
    expect(c.aud).toBeUndefined();
    expect(c.exp).toBeUndefined();
    expect(c.iat).toBeUndefined();
    expect(c.jti).toBeUndefined();
    expect(c.email).toBeUndefined();
    expect(c.emailVerified).toBeUndefined();
    expect(c.roles).toEqual(['r1']);
    expect(c.scopes).toEqual([]);
    expect(c).toBeUndefined();
  });
});
