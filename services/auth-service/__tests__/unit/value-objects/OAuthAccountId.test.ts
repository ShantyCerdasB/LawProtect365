/**
 * @fileoverview OAuthAccountId Tests - Unit tests for OAuthAccountId value object
 * @summary Tests for OAuthAccountId validation and methods
 * @description Tests the OAuthAccountId value object including validation, UUID generation, and equality checks.
 */

import { describe, it, expect } from '@jest/globals';
import { OAuthAccountId } from '../../../src/domain/value-objects/OAuthAccountId';
import { TestUtils } from '../../helpers/testUtils';

describe('OAuthAccountId', () => {
  describe('constructor', () => {
    it('should create OAuthAccountId with valid UUID', () => {
      const uuid = TestUtils.generateUuid();
      const id = new OAuthAccountId(uuid);

      expect(id.getValue()).toBe(uuid);
    });

    it('should throw error for empty string', () => {
      expect(() => new OAuthAccountId('')).toThrow('User not found');
    });

    it('should throw error for non-string value', () => {
      expect(() => new OAuthAccountId(null as any)).toThrow('User not found');
      expect(() => new OAuthAccountId(undefined as any)).toThrow('User not found');
    });

    it('should throw error for invalid UUID', () => {
      expect(() => new OAuthAccountId('not-a-uuid')).toThrow('User not found');
    });

    it('should throw error for non-UUID v4 format', () => {
      expect(() => new OAuthAccountId('123e4567-e89b-12d3-a456-426614174000')).toThrow('User not found');
    });
  });

  describe('generate', () => {
    it('should generate new OAuthAccountId with random UUID', () => {
      const id = OAuthAccountId.generate();

      expect(id).toBeInstanceOf(OAuthAccountId);
      expect(id.getValue()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should generate unique IDs', () => {
      const id1 = OAuthAccountId.generate();
      const id2 = OAuthAccountId.generate();

      expect(id1.getValue()).not.toBe(id2.getValue());
    });
  });

  describe('fromString', () => {
    it('should create OAuthAccountId from UUID string', () => {
      const uuid = TestUtils.generateUuid();
      const id = OAuthAccountId.fromString(uuid);

      expect(id).toBeInstanceOf(OAuthAccountId);
      expect(id.getValue()).toBe(uuid);
    });
  });

  describe('equals', () => {
    it('should return true for equal OAuthAccountIds', () => {
      const uuid = TestUtils.generateUuid();
      const id1 = new OAuthAccountId(uuid);
      const id2 = new OAuthAccountId(uuid);

      expect(id1.equals(id2)).toBe(true);
    });

    it('should return false for different OAuthAccountIds', () => {
      const id1 = OAuthAccountId.generate();
      const id2 = OAuthAccountId.generate();

      expect(id1.equals(id2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return string representation', () => {
      const uuid = TestUtils.generateUuid();
      const id = new OAuthAccountId(uuid);

      expect(id.toString()).toBe(uuid);
    });
  });

  describe('toJSON', () => {
    it('should return JSON representation', () => {
      const uuid = TestUtils.generateUuid();
      const id = new OAuthAccountId(uuid);

      expect(id.toJSON()).toBe(uuid);
    });
  });
});

