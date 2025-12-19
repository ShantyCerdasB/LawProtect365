/**
 * @fileoverview GetUserByIdSchema Tests - Unit tests for GetUserByIdSchema
 * @summary Tests for GetUserById query validation schema
 * @description Tests validation schemas for GET /admin/users/{id} query parameters.
 */

import { describe, it, expect } from '@jest/globals';
import { GetUserByIdQuerySchema } from '../../../src/domain/schemas/GetUserByIdSchema';
import { AdminIncludeField } from '../../../src/domain/enums';

describe('GetUserByIdQuerySchema', () => {
  it('should validate empty query', () => {
    const result = GetUserByIdQuerySchema.safeParse({});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.include).toBeUndefined();
    }
  });

  it('should validate query with single include field', () => {
    const result = GetUserByIdQuerySchema.safeParse({ include: AdminIncludeField.IDP });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.include).toEqual([AdminIncludeField.IDP]);
    }
  });

  it('should validate query with multiple include fields separated by commas', () => {
    const result = GetUserByIdQuerySchema.safeParse({ include: `${AdminIncludeField.IDP},${AdminIncludeField.PROFILE}` });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.include).toEqual([AdminIncludeField.IDP, AdminIncludeField.PROFILE]);
    }
  });

  it('should trim whitespace from include fields', () => {
    const result = GetUserByIdQuerySchema.safeParse({ include: ` ${AdminIncludeField.IDP} , ${AdminIncludeField.PROFILE} ` });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.include).toEqual([AdminIncludeField.IDP, AdminIncludeField.PROFILE]);
    }
  });

  it('should transform undefined include to undefined', () => {
    const result = GetUserByIdQuerySchema.safeParse({ include: undefined });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.include).toBeUndefined();
    }
  });

  it('should handle empty string include', () => {
    const result = GetUserByIdQuerySchema.safeParse({ include: '' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.include).toBeUndefined();
    }
  });
});

