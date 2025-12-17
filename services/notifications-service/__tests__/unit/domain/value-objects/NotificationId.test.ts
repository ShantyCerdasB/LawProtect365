/**
 * @fileoverview Unit tests for NotificationId value object
 * @summary Tests for notification ID validation and business logic
 * @description Comprehensive test suite for NotificationId value object covering validation,
 * static factory methods, equality, and serialization.
 */

import { NotificationId } from '../../../../src/domain/value-objects/NotificationId';
import { TestUtils } from '../../../helpers/testUtils';
import { NotFoundError } from '@lawprotect/shared-ts';

describe('NotificationId', () => {
  describe('Constructor and Validation', () => {
    it('should create NotificationId with valid UUID', () => {
      const validUuid = TestUtils.generateUuid();
      const notificationId = new NotificationId(validUuid);

      expect(notificationId.getValue()).toBe(validUuid);
    });

    it('should throw error when value is empty string', () => {
      expect(() => new NotificationId(''))
        .toThrow(NotFoundError);
    });

    it('should throw error when value is null', () => {
      expect(() => new NotificationId(null as any))
        .toThrow(NotFoundError);
    });

    it('should throw error when value is undefined', () => {
      expect(() => new NotificationId(undefined as any))
        .toThrow(NotFoundError);
    });

    it('should throw error when value is not a valid UUID', () => {
      const invalidUuids = [
        'invalid-uuid',
        '123',
        'not-a-uuid',
        '550e8400-e29b-41d4-a716',
        '550e8400-e29b-41d4-a716-44665544000g',
        '550e8400-e29b-41d4-a716-446655440000-extra',
        '550e8400-e29b-41d4-a716-44665544000',
        '550e8400-e29b-41d4-a716-4466554400000'
      ];

      for (const invalidUuid of invalidUuids) {
        expect(() => new NotificationId(invalidUuid)).toThrow(NotFoundError);
      }
    });

    it('should accept valid UUID v4 formats', () => {
      const validUuids = [
        TestUtils.generateUuid(),
        TestUtils.generateUuid(),
        TestUtils.generateUuid()
      ];

      for (const validUuid of validUuids) {
        expect(() => new NotificationId(validUuid)).not.toThrow();
        const notificationId = new NotificationId(validUuid);
        expect(notificationId.getValue()).toBe(validUuid);
      }
    });
  });

  describe('Static Factory Methods', () => {
    it('should generate new NotificationId', () => {
      const notificationId = NotificationId.generate();

      expect(notificationId).toBeInstanceOf(NotificationId);
      expect(notificationId.getValue()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('should create NotificationId from string', () => {
      const uuid = TestUtils.generateUuid();
      const notificationId = NotificationId.fromString(uuid);

      expect(notificationId.getValue()).toBe(uuid);
    });

    it('should throw error when fromString receives invalid UUID', () => {
      expect(() => NotificationId.fromString('invalid-uuid'))
        .toThrow(NotFoundError);
    });

    it('should generate unique NotificationIds', () => {
      const id1 = NotificationId.generate();
      const id2 = NotificationId.generate();

      expect(id1.getValue()).not.toBe(id2.getValue());
    });

    it('should return undefined when fromStringOrUndefined receives null', () => {
      const result = NotificationId.fromStringOrUndefined(null);
      expect(result).toBeUndefined();
    });

    it('should return undefined when fromStringOrUndefined receives undefined', () => {
      const result = NotificationId.fromStringOrUndefined(undefined);
      expect(result).toBeUndefined();
    });

    it('should create NotificationId when fromStringOrUndefined receives valid UUID', () => {
      const uuid = TestUtils.generateUuid();
      const result = NotificationId.fromStringOrUndefined(uuid);

      expect(result).toBeInstanceOf(NotificationId);
      expect(result?.getValue()).toBe(uuid);
    });
  });

  describe('Equality', () => {
    it('should return true for equal NotificationIds', () => {
      const uuid = TestUtils.generateUuid();
      const id1 = new NotificationId(uuid);
      const id2 = new NotificationId(uuid);

      expect(id1.equals(id2)).toBe(true);
    });

    it('should return false for different NotificationIds', () => {
      const id1 = NotificationId.generate();
      const id2 = NotificationId.generate();

      expect(id1.equals(id2)).toBe(false);
    });
  });

  describe('Serialization', () => {
    it('should return string representation', () => {
      const uuid = TestUtils.generateUuid();
      const notificationId = new NotificationId(uuid);

      expect(notificationId.toString()).toBe(uuid);
    });

    it('should return JSON representation', () => {
      const uuid = TestUtils.generateUuid();
      const notificationId = new NotificationId(uuid);

      expect(notificationId.toJSON()).toBe(uuid);
    });
  });
});

