/**
 * @fileoverview UserId Tests - Unit tests for UserId value object
 * @summary Tests for UserId validation and methods
 * @description Tests the UserId value object including validation, UUID generation, and equality checks.
 */

import { describe, it, expect } from '@jest/globals';
import { UserId } from '../../../src/domain/value-objects/UserId';
import { TestUtils } from '../../helpers/testUtils';

describe('UserId', () => {
  describe('constructor', () => {
    it('should create UserId with valid UUID', () => {
      const uuid = TestUtils.generateUuid();
      const id = new UserId(uuid);

      expect(id.getValue()).toBe(uuid);
    });

    it('should throw error for empty string', () => {
      expect(() => new UserId('')).toThrow('User not found');
    });

    it('should throw error for non-string value', () => {
      expect(() => new UserId(null as any)).toThrow('User not found');
      expect(() => new UserId(undefined as any)).toThrow('User not found');
    });

    it('should throw error for invalid UUID', () => {
      expect(() => new UserId('not-a-uuid')).toThrow('User not found');
    });
  });

  describe('generate', () => {
    it('should generate new UserId with random UUID', () => {
      const id = UserId.generate();

      expect(id).toBeInstanceOf(UserId);
      expect(id.getValue()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should generate unique IDs', () => {
      const id1 = UserId.generate();
      const id2 = UserId.generate();

      expect(id1.getValue()).not.toBe(id2.getValue());
    });
  });

  describe('fromString', () => {
    it('should create UserId from UUID string', () => {
      const uuid = TestUtils.generateUuid();
      const id = UserId.fromString(uuid);

      expect(id).toBeInstanceOf(UserId);
      expect(id.getValue()).toBe(uuid);
    });
  });

  describe('equals', () => {
    it('should return true for equal UserIds', () => {
      const uuid = TestUtils.generateUuid();
      const id1 = new UserId(uuid);
      const id2 = new UserId(uuid);

      expect(id1.equals(id2)).toBe(true);
    });

    it('should return false for different UserIds', () => {
      const id1 = UserId.generate();
      const id2 = UserId.generate();

      expect(id1.equals(id2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return string representation', () => {
      const uuid = TestUtils.generateUuid();
      const id = new UserId(uuid);

      expect(id.toString()).toBe(uuid);
    });
  });

  describe('toJSON', () => {
    it('should return JSON representation', () => {
      const uuid = TestUtils.generateUuid();
      const id = new UserId(uuid);

      expect(id.toJSON()).toBe(uuid);
    });
  });
});

