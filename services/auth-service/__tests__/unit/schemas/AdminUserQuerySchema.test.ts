/**
 * @fileoverview AdminUserQuerySchema Tests - Unit tests for AdminUserQuerySchema
 * @summary Tests for admin user query validation schema
 * @description Tests validation schemas for admin user listing queries including filters, sorting, and pagination.
 */

import { describe, it, expect } from '@jest/globals';
import { AdminUserQuerySchema } from '../../../src/domain/schemas/AdminUserQuerySchema';
import { UserRole, UserAccountStatus, OAuthProvider, AdminSortField, SortDirection, AdminIncludeField } from '../../../src/domain/enums';

describe('AdminUserQuerySchema', () => {
  it('should validate empty query', () => {
    const result = AdminUserQuerySchema.safeParse({});

    expect(result.success).toBe(true);
  });

  describe('search query', () => {
    it('should validate query with search text', () => {
      const result = AdminUserQuerySchema.safeParse({ q: 'test@example.com' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.q).toBe('test@example.com');
      }
    });

    it('should reject search query shorter than 1 character', () => {
      const result = AdminUserQuerySchema.safeParse({ q: '' });

      expect(result.success).toBe(false);
    });

    it('should reject search query longer than 100 characters', () => {
      const longQuery = 'a'.repeat(101);
      const result = AdminUserQuerySchema.safeParse({ q: longQuery });

      expect(result.success).toBe(false);
    });
  });

  describe('role filter', () => {
    it('should validate single role', () => {
      const result = AdminUserQuerySchema.safeParse({ role: UserRole.CUSTOMER });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toEqual([UserRole.CUSTOMER]);
      }
    });

    it('should validate multiple roles separated by commas', () => {
      const result = AdminUserQuerySchema.safeParse({ role: `${UserRole.CUSTOMER},${UserRole.ADMIN}` });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toEqual([UserRole.CUSTOMER, UserRole.ADMIN]);
      }
    });

    it('should trim whitespace from roles', () => {
      const result = AdminUserQuerySchema.safeParse({ role: ` ${UserRole.CUSTOMER} , ${UserRole.ADMIN} ` });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toEqual([UserRole.CUSTOMER, UserRole.ADMIN]);
      }
    });
  });

  describe('status filter', () => {
    it('should validate single status', () => {
      const result = AdminUserQuerySchema.safeParse({ status: UserAccountStatus.ACTIVE });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toEqual([UserAccountStatus.ACTIVE]);
      }
    });

    it('should validate multiple statuses separated by commas', () => {
      const result = AdminUserQuerySchema.safeParse({ status: `${UserAccountStatus.ACTIVE},${UserAccountStatus.SUSPENDED}` });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toEqual([UserAccountStatus.ACTIVE, UserAccountStatus.SUSPENDED]);
      }
    });
  });

  describe('mfa filter', () => {
    it('should validate enabled mfa', () => {
      const result = AdminUserQuerySchema.safeParse({ mfa: 'enabled' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.mfa).toBe('enabled');
      }
    });

    it('should validate disabled mfa', () => {
      const result = AdminUserQuerySchema.safeParse({ mfa: 'disabled' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.mfa).toBe('disabled');
      }
    });

    it('should reject invalid mfa value', () => {
      const result = AdminUserQuerySchema.safeParse({ mfa: 'invalid' });

      expect(result.success).toBe(false);
    });
  });

  describe('provider filter', () => {
    it('should validate single provider', () => {
      const result = AdminUserQuerySchema.safeParse({ provider: OAuthProvider.GOOGLE });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.provider).toEqual([OAuthProvider.GOOGLE]);
      }
    });

    it('should validate multiple providers separated by commas', () => {
      const result = AdminUserQuerySchema.safeParse({ provider: `${OAuthProvider.GOOGLE},${OAuthProvider.MICROSOFT_365}` });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.provider).toEqual([OAuthProvider.GOOGLE, OAuthProvider.MICROSOFT_365]);
      }
    });
  });

  describe('date ranges', () => {
    it('should validate createdFrom date', () => {
      const result = AdminUserQuerySchema.safeParse({ createdFrom: '2024-01-01T00:00:00Z' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.createdFrom).toBe('2024-01-01T00:00:00Z');
      }
    });

    it('should validate createdTo date', () => {
      const result = AdminUserQuerySchema.safeParse({ createdTo: '2024-12-31T23:59:59Z' });

      expect(result.success).toBe(true);
    });

    it('should validate both date range fields', () => {
      const result = AdminUserQuerySchema.safeParse({
        createdFrom: '2024-01-01T00:00:00Z',
        createdTo: '2024-12-31T23:59:59Z'
      });

      expect(result.success).toBe(true);
    });

    it('should reject invalid datetime format', () => {
      const result = AdminUserQuerySchema.safeParse({ createdFrom: 'invalid-date' });

      expect(result.success).toBe(false);
    });

    it('should validate lastLoginFrom date', () => {
      const result = AdminUserQuerySchema.safeParse({ lastLoginFrom: '2024-01-01T00:00:00Z' });

      expect(result.success).toBe(true);
    });

    it('should validate lastLoginTo date', () => {
      const result = AdminUserQuerySchema.safeParse({ lastLoginTo: '2024-12-31T23:59:59Z' });

      expect(result.success).toBe(true);
    });
  });

  describe('sorting', () => {
    it('should validate sortBy field', () => {
      const result = AdminUserQuerySchema.safeParse({ sortBy: AdminSortField.CREATED_AT });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sortBy).toBe(AdminSortField.CREATED_AT);
      }
    });

    it('should validate sortDir field', () => {
      const result = AdminUserQuerySchema.safeParse({ sortDir: SortDirection.ASC });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sortDir).toBe(SortDirection.ASC);
      }
    });

    it('should validate both sort fields', () => {
      const result = AdminUserQuerySchema.safeParse({
        sortBy: AdminSortField.EMAIL,
        sortDir: SortDirection.DESC
      });

      expect(result.success).toBe(true);
    });

    it('should reject invalid sortBy value', () => {
      const result = AdminUserQuerySchema.safeParse({ sortBy: 'invalid' as any });

      expect(result.success).toBe(false);
    });

    it('should reject invalid sortDir value', () => {
      const result = AdminUserQuerySchema.safeParse({ sortDir: 'invalid' as any });

      expect(result.success).toBe(false);
    });
  });

  describe('includes', () => {
    it('should validate single include field', () => {
      const result = AdminUserQuerySchema.safeParse({ include: AdminIncludeField.IDP });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.include).toEqual([AdminIncludeField.IDP]);
      }
    });

    it('should validate multiple include fields separated by commas', () => {
      const result = AdminUserQuerySchema.safeParse({ include: `${AdminIncludeField.IDP},${AdminIncludeField.PROFILE}` });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.include).toEqual([AdminIncludeField.IDP, AdminIncludeField.PROFILE]);
      }
    });

    it('should trim whitespace from includes', () => {
      const result = AdminUserQuerySchema.safeParse({ include: ` ${AdminIncludeField.IDP} , ${AdminIncludeField.PROFILE} ` });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.include).toEqual([AdminIncludeField.IDP, AdminIncludeField.PROFILE]);
      }
    });
  });

  describe('pagination', () => {
    it('should validate limit within range', () => {
      const result = AdminUserQuerySchema.safeParse({ limit: 25 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(25);
      }
    });

    it('should coerce string limit to number', () => {
      const result = AdminUserQuerySchema.safeParse({ limit: '50' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50);
      }
    });

    it('should reject limit below minimum', () => {
      const result = AdminUserQuerySchema.safeParse({ limit: 9 });

      expect(result.success).toBe(false);
    });

    it('should reject limit above maximum', () => {
      const result = AdminUserQuerySchema.safeParse({ limit: 201 });

      expect(result.success).toBe(false);
    });

    it('should validate cursor', () => {
      const result = AdminUserQuerySchema.safeParse({ cursor: 'cursor-123' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cursor).toBe('cursor-123');
      }
    });
  });

  describe('combined query', () => {
    it('should validate complex query with all fields', () => {
      const query = {
        q: 'test@example.com',
        role: `${UserRole.CUSTOMER},${UserRole.ADMIN}`,
        status: UserAccountStatus.ACTIVE,
        mfa: 'enabled',
        provider: OAuthProvider.GOOGLE,
        createdFrom: '2024-01-01T00:00:00Z',
        createdTo: '2024-12-31T23:59:59Z',
        sortBy: AdminSortField.CREATED_AT,
        sortDir: SortDirection.DESC,
        include: AdminIncludeField.IDP,
        limit: 50,
        cursor: 'cursor-123'
      };

      const result = AdminUserQuerySchema.safeParse(query);

      expect(result.success).toBe(true);
    });
  });
});

