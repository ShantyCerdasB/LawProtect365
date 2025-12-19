/**
 * @fileoverview UserAuditEventId Tests - Unit tests for UserAuditEventId value object
 * @summary Tests for UserAuditEventId validation and methods
 * @description Tests the UserAuditEventId value object including validation, UUID generation, and equality checks.
 */

import { describe, it, expect } from '@jest/globals';
import { UserAuditEventId } from '../../../src/domain/value-objects/UserAuditEventId';
import { TestUtils } from '../../helpers/testUtils';

describe('UserAuditEventId', () => {
  describe('constructor', () => {
    it('should create UserAuditEventId with valid UUID', () => {
      const uuid = TestUtils.generateUuid();
      const id = new UserAuditEventId(uuid);

      expect(id.getValue()).toBe(uuid);
    });

    it('should throw error for empty string', () => {
      expect(() => new UserAuditEventId('')).toThrow('User not found');
    });

    it('should throw error for non-string value', () => {
      expect(() => new UserAuditEventId(null as any)).toThrow('User not found');
      expect(() => new UserAuditEventId(undefined as any)).toThrow('User not found');
    });

    it('should throw error for invalid UUID', () => {
      expect(() => new UserAuditEventId('not-a-uuid')).toThrow('User not found');
    });
  });

  describe('generate', () => {
    it('should generate new UserAuditEventId with random UUID', () => {
      const id = UserAuditEventId.generate();

      expect(id).toBeInstanceOf(UserAuditEventId);
      expect(id.getValue()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should generate unique IDs', () => {
      const id1 = UserAuditEventId.generate();
      const id2 = UserAuditEventId.generate();

      expect(id1.getValue()).not.toBe(id2.getValue());
    });
  });

  describe('fromString', () => {
    it('should create UserAuditEventId from UUID string', () => {
      const uuid = TestUtils.generateUuid();
      const id = UserAuditEventId.fromString(uuid);

      expect(id).toBeInstanceOf(UserAuditEventId);
      expect(id.getValue()).toBe(uuid);
    });
  });

  describe('equals', () => {
    it('should return true for equal UserAuditEventIds', () => {
      const uuid = TestUtils.generateUuid();
      const id1 = new UserAuditEventId(uuid);
      const id2 = new UserAuditEventId(uuid);

      expect(id1.equals(id2)).toBe(true);
    });

    it('should return false for different UserAuditEventIds', () => {
      const id1 = UserAuditEventId.generate();
      const id2 = UserAuditEventId.generate();

      expect(id1.equals(id2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return string representation', () => {
      const uuid = TestUtils.generateUuid();
      const id = new UserAuditEventId(uuid);

      expect(id.toString()).toBe(uuid);
    });
  });

  describe('toJSON', () => {
    it('should return JSON representation', () => {
      const uuid = TestUtils.generateUuid();
      const id = new UserAuditEventId(uuid);

      expect(id.toJSON()).toBe(uuid);
    });
  });
});

