/**
 * @fileoverview SetUserRoleSchema.test.ts - Unit tests for SetUserRoleSchema
 * @summary Tests for SetUserRole request validation schema
 * @description Tests validation schema for role change operations including valid roles and optional reason.
 */

import { describe, it, expect } from '@jest/globals';
import { SetUserRoleBodySchema } from '../../../src/domain/schemas/SetUserRoleSchema';
import { UserRole } from '../../../src/domain/enums/UserRole';

describe('SetUserRoleBodySchema', () => {
  it('should validate request with valid role and no reason', () => {
    const body = {
      role: UserRole.CUSTOMER
    };

    const result = SetUserRoleBodySchema.safeParse(body);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.role).toBe(UserRole.CUSTOMER);
      expect(result.data.reason).toBeUndefined();
    }
  });

  it('should validate request with valid role and reason', () => {
    const body = {
      role: UserRole.LAWYER,
      reason: 'Promoted to lawyer role'
    };

    const result = SetUserRoleBodySchema.safeParse(body);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.role).toBe(UserRole.LAWYER);
      expect(result.data.reason).toBe('Promoted to lawyer role');
    }
  });

  it('should validate all allowed roles', () => {
    const allowedRoles = [
      UserRole.CUSTOMER,
      UserRole.LAWYER,
      UserRole.ADMIN,
      UserRole.SUPER_ADMIN,
      UserRole.EXTERNAL_USER
    ];

    allowedRoles.forEach(role => {
      const body = { role };
      const result = SetUserRoleBodySchema.safeParse(body);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe(role);
      }
    });
  });

  it('should reject UNASSIGNED role', () => {
    const body = {
      role: UserRole.UNASSIGNED
    };

    const result = SetUserRoleBodySchema.safeParse(body);

    expect(result.success).toBe(false);
  });

  it('should reject invalid role', () => {
    const body = {
      role: 'INVALID_ROLE'
    };

    const result = SetUserRoleBodySchema.safeParse(body);

    expect(result.success).toBe(false);
  });

  it('should reject empty reason', () => {
    const body = {
      role: UserRole.CUSTOMER,
      reason: ''
    };

    const result = SetUserRoleBodySchema.safeParse(body);

    expect(result.success).toBe(false);
  });

  it('should reject reason longer than 512 characters', () => {
    const longReason = 'a'.repeat(513);
    const body = {
      role: UserRole.CUSTOMER,
      reason: longReason
    };

    const result = SetUserRoleBodySchema.safeParse(body);

    expect(result.success).toBe(false);
  });

  it('should accept reason with exactly 512 characters', () => {
    const reason = 'a'.repeat(512);
    const body = {
      role: UserRole.CUSTOMER,
      reason
    };

    const result = SetUserRoleBodySchema.safeParse(body);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.reason).toBe(reason);
    }
  });

  it('should accept reason with exactly 1 character', () => {
    const body = {
      role: UserRole.CUSTOMER,
      reason: 'a'
    };

    const result = SetUserRoleBodySchema.safeParse(body);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.reason).toBe('a');
    }
  });

  it('should reject missing role', () => {
    const body = {};

    const result = SetUserRoleBodySchema.safeParse(body);

    expect(result.success).toBe(false);
  });

  it('should reject null role', () => {
    const body = {
      role: null
    };

    const result = SetUserRoleBodySchema.safeParse(body);

    expect(result.success).toBe(false);
  });
});
