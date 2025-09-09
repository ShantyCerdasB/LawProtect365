import { assertTenantBoundary, belongsToTenant } from '../../src/rules/Multitenancy.rules.js';
import { AppError } from '../../src/errors/AppError.js';
import { ErrorCodes } from '../../src/errors/codes.js';

describe('Multitenancy Rules', () => {
  describe('assertTenantBoundary', () => {
    it('should throw when ctxTenantId is undefined', () => {
      expect(() => assertTenantBoundary(undefined, 'tenant-123')).toThrow(AppError);
      expect(() => assertTenantBoundary(undefined, 'tenant-123')).toThrow('Tenant boundary violation');
    });

    it('should throw when resourceTenantId is undefined', () => {
      expect(() => assertTenantBoundary('tenant-123', undefined)).toThrow(AppError);
      expect(() => assertTenantBoundary('tenant-123', undefined)).toThrow('Tenant boundary violation');
    });

    it('should throw when both tenant IDs are undefined', () => {
      expect(() => assertTenantBoundary(undefined, undefined)).toThrow(AppError);
      expect(() => assertTenantBoundary(undefined, undefined)).toThrow('Tenant boundary violation');
    });

    it('should throw when tenant IDs do not match', () => {
      expect(() => assertTenantBoundary('tenant-123', 'tenant-456')).toThrow(AppError);
      expect(() => assertTenantBoundary('tenant-123', 'tenant-456')).toThrow('Tenant boundary violation');
    });

    it('should not throw when tenant IDs match', () => {
      expect(() => assertTenantBoundary('tenant-123', 'tenant-123')).not.toThrow();
    });

    it('should throw with correct error code and status', () => {
      try {
        assertTenantBoundary('tenant-123', 'tenant-456');
        fail('Expected AppError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).code).toBe(ErrorCodes.AUTH_FORBIDDEN);
        expect((error as AppError).statusCode).toBe(403);
        expect((error as AppError).message).toBe('Tenant boundary violation');
      }
    });

    it('should handle empty string tenant IDs', () => {
      expect(() => assertTenantBoundary('', 'tenant-123')).toThrow(AppError);
      expect(() => assertTenantBoundary('tenant-123', '')).toThrow(AppError);
      expect(() => assertTenantBoundary('', '')).not.toThrow(); // Both empty strings are equal
    });

    it('should handle null tenant IDs', () => {
      expect(() => assertTenantBoundary(null as any, 'tenant-123')).toThrow(AppError);
      expect(() => assertTenantBoundary('tenant-123', null as any)).toThrow(AppError);
      expect(() => assertTenantBoundary(null as any, null as any)).toThrow(AppError);
    });

    it('should be case sensitive', () => {
      expect(() => assertTenantBoundary('Tenant-123', 'tenant-123')).toThrow(AppError);
      expect(() => assertTenantBoundary('tenant-123', 'Tenant-123')).toThrow(AppError);
    });
  });

  describe('belongsToTenant', () => {
    it('should return true when tenant IDs match', () => {
      expect(belongsToTenant('tenant-123', 'tenant-123')).toBe(true);
    });

    it('should return false when tenant IDs do not match', () => {
      expect(belongsToTenant('tenant-123', 'tenant-456')).toBe(false);
    });

    it('should return true when both tenant IDs are empty strings', () => {
      expect(belongsToTenant('', '')).toBe(true);
    });

    it('should return false when one tenant ID is empty and other is not', () => {
      expect(belongsToTenant('', 'tenant-123')).toBe(false);
      expect(belongsToTenant('tenant-123', '')).toBe(false);
    });

    it('should be case sensitive', () => {
      expect(belongsToTenant('Tenant-123', 'tenant-123')).toBe(false);
      expect(belongsToTenant('tenant-123', 'Tenant-123')).toBe(false);
    });

    it('should handle special characters in tenant IDs', () => {
      expect(belongsToTenant('tenant-123!@#', 'tenant-123!@#')).toBe(true);
      expect(belongsToTenant('tenant-123!@#', 'tenant-123')).toBe(false);
    });

    it('should handle very long tenant IDs', () => {
      const longTenantId = 'a'.repeat(1000);
      expect(belongsToTenant(longTenantId, longTenantId)).toBe(true);
      expect(belongsToTenant(longTenantId, 'different-tenant')).toBe(false);
    });

    it('should handle numeric tenant IDs', () => {
      expect(belongsToTenant('123', '123')).toBe(true);
      expect(belongsToTenant('123', '456')).toBe(false);
    });
  });
});
