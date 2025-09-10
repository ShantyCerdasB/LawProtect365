/**
 * @file policy.test.ts
 * @summary Tests for Policy, allowSuperAdmin, allowAdminSameTenant, allowPermissionOrScope.
 */

import { Policy, allowSuperAdmin, allowAdminSameTenant, allowPermissionOrScope } from '../../src/auth/policy.js';
import type { SecurityContext, ResourceRef, Permission, Scope } from '../../src/types/security.js';
import type { TenantId, UserId } from '../../src/types/brand.js';

const P = (s: string) => s as unknown as Permission;
const S = (s: string) => s as unknown as Scope;
const T = (s: string) => s as unknown as TenantId;
const U = (s: string) => s as unknown as UserId;

const subject = (s: Partial<SecurityContext> = {}): SecurityContext => ({
  userId: (s.userId as UserId) ?? U('u-1'),
  roles: s.roles ?? [],
  scopes: s.scopes,
  permissions: s.permissions as Permission[] | undefined});

const resource = (res: ResourceRef['resource'], ?: string): ResourceRef => ({
  resource: res});

describe('Policy', () => {
  it('evaluates rules in order and returns first allow', async () => {
    const p = new Policy()
      .addRule('deny-1', () => false)
      .addRule('allow-2', () => true)
      .addRule('skip-3', () => {
        throw new Error('should not run');
      });

    const out = await p.evaluate(subject(), 'read', resource('document'));
    expect(out).toEqual({ effect: 'allow', reason: 'allow-2' });
  });

  it('returns deny when no rule matches', async () => {
    const p = new Policy().addRule('check', () => false);
    const out = await p.evaluate(subject(), 'read', resource('document'));
    expect(out).toEqual({ effect: 'deny', reason: 'no_rule_matched' });
  });

  it('supports async rules', async () => {
    const p = new Policy().addRule('async-allow', async () => {
      await Promise.resolve();
      return true;
    });
    const out = await p.evaluate(subject(), 'read', resource('document'));
    expect(out.effect).toBe('allow');
    expect(out.reason).toBe('async-allow');
  });
});

describe('allowSuperAdmin', () => {
  it('allows when role super_admin is present', () => {
    expect(allowSuperAdmin(subject({ roles: ['super_admin'] }), 'manage', resource('case'))).toBe(true);
  });

  it('denies otherwise', () => {
    expect(allowSuperAdmin(subject({ roles: ['admin'] }), 'manage', resource('case'))).toBe(false);
  });
});

describe('allowAdminSameTenant', () => {
  it('allows for admin in same tenant', () => {
    expect(
      allowAdminSameTenant(subject({ roles: ['admin']}), 'read', resource('case', 't-1'))).toBe(true);
  });

  it('denies when tenant differs or is missing', () => {
    expect(
      allowAdminSameTenant(subject({ roles: ['admin']}), 'read', resource('case', 't-2'))).toBe(false);
    expect(allowAdminSameTenant(subject({ roles: ['admin'] }), 'read', resource('case', 't-1'))).toBe(false);
    expect(allowAdminSameTenant(subject({ roles: ['admin']}), 'read', resource('case'))).toBe(
      false);
  });
});

describe('allowPermissionOrScope', () => {
  it('allows when permission matches', () => {
    const s = subject({ permissions: [P('document:write')] });
    expect(allowPermissionOrScope(s, 'write', resource('document'))).toBe(true);
  });

  it('allows when scope matches', () => {
    const s = subject({ scopes: [S('payment:approve')] });
    expect(allowPermissionOrScope(s, 'approve', resource('payment'))).toBe(true);
  });

  it('denies when neither matches', () => {
    const s = subject({ permissions: [P('document:read')], scopes: [S('user:read')] });
    expect(allowPermissionOrScope(s, 'delete', resource('document'))).toBe(false);
  });
});
