/**
 * @fileoverview SetUserStatusSchema.test.ts - Unit tests for SetUserStatusSchema
 * @summary Tests for SetUserStatus request and response validation schemas
 * @description Tests validation schemas for user status change operations including status validation, reason requirements, and suspendUntil date validation.
 */

import { describe, it, expect } from '@jest/globals';
import { SetUserStatusBodySchema, SetUserStatusResponseSchema } from '../../../src/domain/schemas/SetUserStatusSchema';
import { UserAccountStatus } from '../../../src/domain/enums/UserAccountStatus';

describe('SetUserStatusBodySchema', () => {
  describe('ACTIVE status', () => {
    it('should validate ACTIVE status without reason', () => {
      const body = {
        status: UserAccountStatus.ACTIVE
      };

      const result = SetUserStatusBodySchema.safeParse(body);

      expect(result.success).toBe(true);
    });

    it('should validate ACTIVE status with optional reason', () => {
      const body = {
        status: UserAccountStatus.ACTIVE,
        reason: 'Account reactivated'
      };

      const result = SetUserStatusBodySchema.safeParse(body);

      expect(result.success).toBe(true);
    });
  });

  describe('PENDING_VERIFICATION status', () => {
    it('should validate PENDING_VERIFICATION status without reason', () => {
      const body = {
        status: UserAccountStatus.PENDING_VERIFICATION
      };

      const result = SetUserStatusBodySchema.safeParse(body);

      expect(result.success).toBe(true);
    });
  });

  describe('SUSPENDED status', () => {
    it('should require reason for SUSPENDED status', () => {
      const body = {
        status: UserAccountStatus.SUSPENDED
      };

      const result = SetUserStatusBodySchema.safeParse(body);

      expect(result.success).toBe(false);
    });

    it('should validate SUSPENDED status with reason', () => {
      const body = {
        status: UserAccountStatus.SUSPENDED,
        reason: 'Violation of terms of service'
      };

      const result = SetUserStatusBodySchema.safeParse(body);

      expect(result.success).toBe(true);
    });

    it('should validate SUSPENDED status with reason and suspendUntil', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      
      const body = {
        status: UserAccountStatus.SUSPENDED,
        reason: 'Temporary suspension',
        suspendUntil: futureDate.toISOString()
      };

      const result = SetUserStatusBodySchema.safeParse(body);

      expect(result.success).toBe(true);
    });

    it('should reject suspendUntil with non-SUSPENDED status', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      
      const body = {
        status: UserAccountStatus.ACTIVE,
        suspendUntil: futureDate.toISOString()
      };

      const result = SetUserStatusBodySchema.safeParse(body);

      expect(result.success).toBe(false);
    });

    it('should reject suspendUntil in the past', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      
      const body = {
        status: UserAccountStatus.SUSPENDED,
        reason: 'Suspension',
        suspendUntil: pastDate.toISOString()
      };

      const result = SetUserStatusBodySchema.safeParse(body);

      expect(result.success).toBe(false);
    });

    it('should reject suspendUntil more than 180 days in the future', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 181);
      
      const body = {
        status: UserAccountStatus.SUSPENDED,
        reason: 'Long suspension',
        suspendUntil: futureDate.toISOString()
      };

      const result = SetUserStatusBodySchema.safeParse(body);

      expect(result.success).toBe(false);
    });

    it('should accept suspendUntil exactly 180 days in the future', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 180);
      
      const body = {
        status: UserAccountStatus.SUSPENDED,
        reason: 'Maximum suspension period',
        suspendUntil: futureDate.toISOString()
      };

      const result = SetUserStatusBodySchema.safeParse(body);

      expect(result.success).toBe(true);
    });
  });

  describe('INACTIVE status', () => {
    it('should require reason for INACTIVE status', () => {
      const body = {
        status: UserAccountStatus.INACTIVE
      };

      const result = SetUserStatusBodySchema.safeParse(body);

      expect(result.success).toBe(false);
    });

    it('should validate INACTIVE status with reason', () => {
      const body = {
        status: UserAccountStatus.INACTIVE,
        reason: 'User requested deactivation'
      };

      const result = SetUserStatusBodySchema.safeParse(body);

      expect(result.success).toBe(true);
    });
  });

  describe('DELETED status', () => {
    it('should require reason for DELETED status', () => {
      const body = {
        status: UserAccountStatus.DELETED
      };

      const result = SetUserStatusBodySchema.safeParse(body);

      expect(result.success).toBe(false);
    });

    it('should validate DELETED status with reason', () => {
      const body = {
        status: UserAccountStatus.DELETED,
        reason: 'User requested account deletion'
      };

      const result = SetUserStatusBodySchema.safeParse(body);

      expect(result.success).toBe(true);
    });
  });

  describe('reason validation', () => {
    it('should reject empty reason when required', () => {
      const body = {
        status: UserAccountStatus.SUSPENDED,
        reason: ''
      };

      const result = SetUserStatusBodySchema.safeParse(body);

      expect(result.success).toBe(false);
    });

    it('should reject reason longer than 512 characters', () => {
      const longReason = 'a'.repeat(513);
      const body = {
        status: UserAccountStatus.SUSPENDED,
        reason: longReason
      };

      const result = SetUserStatusBodySchema.safeParse(body);

      expect(result.success).toBe(false);
    });

    it('should accept reason with exactly 512 characters', () => {
      const reason = 'a'.repeat(512);
      const body = {
        status: UserAccountStatus.SUSPENDED,
        reason
      };

      const result = SetUserStatusBodySchema.safeParse(body);

      expect(result.success).toBe(true);
    });
  });
});

describe('SetUserStatusResponseSchema', () => {
  it('should validate response with all fields', () => {
    const response = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      status: UserAccountStatus.SUSPENDED,
      suspendedUntil: '2024-12-31T23:59:59Z',
      deactivationReason: 'Violation of terms',
      deletedAt: undefined,
      updatedAt: '2024-01-15T00:00:00Z'
    };

    const result = SetUserStatusResponseSchema.safeParse(response);

    expect(result.success).toBe(true);
  });

  it('should validate response with ACTIVE status', () => {
    const response = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      status: UserAccountStatus.ACTIVE,
      updatedAt: '2024-01-15T00:00:00Z'
    };

    const result = SetUserStatusResponseSchema.safeParse(response);

    expect(result.success).toBe(true);
  });

  it('should validate response with DELETED status and deletedAt', () => {
    const response = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      status: UserAccountStatus.DELETED,
      deactivationReason: 'User requested deletion',
      deletedAt: '2024-01-15T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z'
    };

    const result = SetUserStatusResponseSchema.safeParse(response);

    expect(result.success).toBe(true);
  });

  it('should reject invalid datetime format', () => {
    const response = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      status: UserAccountStatus.ACTIVE,
      updatedAt: 'invalid-date'
    };

    const result = SetUserStatusResponseSchema.safeParse(response);

    expect(result.success).toBe(false);
  });

  it('should reject invalid status enum', () => {
    const response = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      status: 'INVALID_STATUS',
      updatedAt: '2024-01-15T00:00:00Z'
    };

    const result = SetUserStatusResponseSchema.safeParse(response);

    expect(result.success).toBe(false);
  });

  it('should reject missing required fields', () => {
    const response = {
      status: UserAccountStatus.ACTIVE
    };

    const result = SetUserStatusResponseSchema.safeParse(response);

    expect(result.success).toBe(false);
  });
});

