/**
 * @file access.test.ts
 * @summary Unit tests for `can` with role hierarchy, tenant boundary, permissions, and scopes.
 * @remarks
 * Place next to `access.ts` (e.g., `packages/shared-ts/src/auth/access.test.ts`).
 */

import { can } from '../../src/auth/access';
import type {
  SecurityContext,
  ResourceRef,
  Permission,
  Scope,
} from '../../src/types/security';
import type { TenantId, UserId } from '../../src/types/brand';

const P = (s: string) => s as unknown as Permission;
const S = (s: string) => s as unknown as Scope;
const T = (s: string) => s as unknown as TenantId;
const U = (s: string) => s as unknown as UserId;

// Make all fields optional (including roles) and allow tenantId as string or TenantId
type PartialSubject = Partial<Omit<SecurityContext, 'userId' | 'tenantId'>> & {
  tenantId?: string | TenantId;
};

const subject = (s: PartialSubject = {}): SecurityContext => {
  let tenant: TenantId | undefined;
  if (s.tenantId != null) {
    tenant = typeof s.tenantId === 'string' ? T(s.tenantId) : s.tenantId;
  }

  return {
    userId: U('user-1'),
    roles: s.roles ?? [],
    scopes: s.scopes,
    permissions: s.permissions,
    tenantId: tenant,
  };
};

const resource = (
  r: ResourceRef['resource'],
  tenantId?: string | TenantId,
  id?: string,
): ResourceRef => {
  let t: TenantId | undefined;
  if (tenantId != null) {
    t = typeof tenantId === 'string' ? T(tenantId) : tenantId;
  }

  return {
    resource: r,
    tenantId: t,
    id,
  };
};

describe('can', () => {
  describe('super_admin', () => {
    it('allows any action on any resource regardless of tenant', () => {
      const sub = subject({ roles: ['super_admin'] });
      expect(can(sub, 'manage', resource('case'))).toBe(true);
      expect(can(sub, 'delete', resource('document', 't-A'))).toBe(true);
    });

    it('is tolerant to "super-admin" synonym via normalization', () => {
      const sub = subject({ roles: ['super-admin'] });
      expect(can(sub, 'read', resource('user', 't-1'))).toBe(true);
    });
  });

  describe('admin', () => {
    it('allows within the same tenant', () => {
      const sub = subject({ roles: ['admin'], tenantId: 't-1' });
      expect(can(sub, 'read', resource('case', 't-1'))).toBe(true);
    });

    it('denies when subject tenant is missing', () => {
      const sub = subject({ roles: ['admin'] });
      expect(can(sub, 'read', resource('case', 't-1'))).toBe(false);
    });

    it('denies when resource tenant is missing', () => {
      const sub = subject({ roles: ['admin'], tenantId: 't-1' });
      expect(can(sub, 'read', resource('case'))).toBe(false);
    });

    it('denies across tenants', () => {
      const sub = subject({ roles: ['admin'], tenantId: 't-1' });
      expect(can(sub, 'read', resource('case', 't-2'))).toBe(false);
    });

    it('accepts mixed-case role strings via normalization', () => {
      const sub = subject({ roles: ['ADMIN'], tenantId: 'x' });
      expect(can(sub, 'write', resource('document', 'x'))).toBe(true);
    });
  });

  describe('non-admin users', () => {
    it('allows with an exact Permission match', () => {
      const sub = subject({
        roles: ['lawyer'],
        permissions: [P('document:read')],
      });
      expect(can(sub, 'read', resource('document', 't-1'))).toBe(true);
    });

    it('denies when Permission does not match', () => {
      const sub = subject({
        roles: ['lawyer'],
        permissions: [P('document:write')],
      });
      expect(can(sub, 'read', resource('document', 't-1'))).toBe(false);
    });

    it('allows with an exact Scope match', () => {
      const sub = subject({
        roles: ['client'],
        scopes: [S('payment:approve')],
      });
      expect(can(sub, 'approve', resource('payment'))).toBe(true);
    });

    it('denies when neither Permission nor Scope matches', () => {
      const sub = subject({
        roles: ['client'],
        scopes: [S('user:read')],
        permissions: [P('report:read')],
      });
      expect(can(sub, 'write', resource('document'))).toBe(false);
    });

    it('handles undefined scopes/permissions safely', () => {
      const sub = subject({ roles: ['client'] });
      expect(can(sub, 'read', resource('document'))).toBe(false);
    });

    it('ignores tenant boundary for non-admins (permission/scope solely decides)', () => {
      const sub = subject({
        roles: ['lawyer'],
        permissions: [P('case:delete')],
        tenantId: 't-1',
      });
      expect(can(sub, 'delete', resource('case', 't-2'))).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('works when resource id is present but unused by policy', () => {
      const sub = subject({ roles: ['client'], scopes: [S('kyc:read')] });
      expect(can(sub, 'read', { ...resource('kyc', 't-9'), id: 'kyc-123' })).toBe(true);
    });

    it('treats branded Permission equality by string value', () => {
      const sub = subject({ roles: ['client'], permissions: [P('subscription:manage')] });
      expect(can(sub, 'manage', resource('subscription'))).toBe(true);
    });

    it('system role behaves as non-admin (requires permission/scope)', () => {
      const sub = subject({ roles: ['system'] });
      expect(can(sub, 'read', resource('report'))).toBe(false);
      const sub2 = subject({ roles: ['system'], permissions: [P('report:read')] });
      expect(can(sub2, 'read', resource('report'))).toBe(true);
    });
  });
});
