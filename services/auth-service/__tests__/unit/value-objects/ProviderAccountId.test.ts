/**
 * @fileoverview ProviderAccountId Tests - Unit tests for ProviderAccountId value object
 * @summary Tests for ProviderAccountId validation and methods
 * @description Tests the ProviderAccountId value object including validation, creation, and equality checks.
 */

import { describe, it, expect } from '@jest/globals';
import { ProviderAccountId } from '../../../src/domain/value-objects/ProviderAccountId';
import { BadRequestError } from '@lawprotect/shared-ts';

describe('ProviderAccountId', () => {
  describe('constructor', () => {
    it('should create ProviderAccountId with valid value', () => {
      const value = 'provider-account-123';
      const id = new ProviderAccountId(value);

      expect(id.getValue()).toBe(value);
    });

    it('should trim whitespace from value', () => {
      const value = '  provider-account-123  ';
      const id = new ProviderAccountId(value);

      expect(id.getValue()).toBe('provider-account-123');
    });

    it('should throw error for empty string', () => {
      expect(() => new ProviderAccountId('')).toThrow(BadRequestError);
    });

    it('should throw error for whitespace-only string', () => {
      expect(() => new ProviderAccountId('   ')).toThrow(BadRequestError);
    });

    it('should throw error for null value', () => {
      expect(() => new ProviderAccountId(null as any)).toThrow(BadRequestError);
    });

    it('should throw error for undefined value', () => {
      expect(() => new ProviderAccountId(undefined as any)).toThrow(BadRequestError);
    });
  });

  describe('fromString', () => {
    it('should create ProviderAccountId from string', () => {
      const value = 'provider-account-123';
      const id = ProviderAccountId.fromString(value);

      expect(id).toBeInstanceOf(ProviderAccountId);
      expect(id.getValue()).toBe(value);
    });
  });

  describe('fromStringOrUndefined', () => {
    it('should create ProviderAccountId from string', () => {
      const value = 'provider-account-123';
      const id = ProviderAccountId.fromStringOrUndefined(value);

      expect(id).toBeInstanceOf(ProviderAccountId);
      expect(id?.getValue()).toBe(value);
    });

    it('should return undefined for undefined input', () => {
      const id = ProviderAccountId.fromStringOrUndefined(undefined);

      expect(id).toBeUndefined();
    });
  });

  describe('equals', () => {
    it('should return true for equal ProviderAccountIds', () => {
      const value = 'provider-account-123';
      const id1 = new ProviderAccountId(value);
      const id2 = new ProviderAccountId(value);

      expect(id1.equals(id2)).toBe(true);
    });

    it('should return false for different ProviderAccountIds', () => {
      const id1 = new ProviderAccountId('provider-account-123');
      const id2 = new ProviderAccountId('provider-account-456');

      expect(id1.equals(id2)).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('should return string representation', () => {
      const value = 'provider-account-123';
      const id = new ProviderAccountId(value);

      expect(id.toJSON()).toBe(value);
    });
  });
});

