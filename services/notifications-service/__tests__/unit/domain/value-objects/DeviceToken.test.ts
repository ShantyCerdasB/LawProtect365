/**
 * @fileoverview Unit tests for DeviceToken value object
 * @summary Tests for device token validation and business logic
 * @description Comprehensive test suite for DeviceToken value object covering validation,
 * static factory methods, and edge cases for FCM/APNS device tokens.
 */

import { DeviceToken } from '../../../../src/domain/value-objects/DeviceToken';
import { BadRequestError } from '@lawprotect/shared-ts';

describe('DeviceToken', () => {
  describe('Constructor and Validation', () => {
    it('should create DeviceToken with valid token (minimum length)', () => {
      const validToken = 'a'.repeat(32);
      const deviceToken = new DeviceToken(validToken);

      expect(deviceToken.getValue()).toBe(validToken);
    });

    it('should create DeviceToken with valid token (maximum length)', () => {
      const validToken = 'a'.repeat(200);
      const deviceToken = new DeviceToken(validToken);

      expect(deviceToken.getValue()).toBe(validToken);
    });

    it('should create DeviceToken with valid token (typical FCM token)', () => {
      const validToken = 'fcm-token-1234567890123456789012345678901234567890';
      const deviceToken = new DeviceToken(validToken);

      expect(deviceToken.getValue()).toBe(validToken);
    });

    it('should trim whitespace from token', () => {
      const token = '  fcm-token-123456789012345678901234567890  ';
      const deviceToken = new DeviceToken(token);

      expect(deviceToken.getValue()).toBe('fcm-token-123456789012345678901234567890');
    });

    it('should throw error when value is empty string', () => {
      expect(() => new DeviceToken(''))
        .toThrow(BadRequestError);
    });

    it('should throw error when value is null', () => {
      expect(() => new DeviceToken(null as any))
        .toThrow(BadRequestError);
    });

    it('should throw error when value is undefined', () => {
      expect(() => new DeviceToken(undefined as any))
        .toThrow(BadRequestError);
    });

    it('should throw error when token is too short', () => {
      const shortToken = 'a'.repeat(31);
      expect(() => new DeviceToken(shortToken))
        .toThrow(BadRequestError);
    });

    it('should throw error when token is too long', () => {
      const longToken = 'a'.repeat(201);
      expect(() => new DeviceToken(longToken))
        .toThrow(BadRequestError);
    });

    it('should throw error when token is only whitespace', () => {
      expect(() => new DeviceToken('   '))
        .toThrow(BadRequestError);
    });
  });

  describe('Static Factory Methods', () => {
    it('should create DeviceToken from string', () => {
      const token = 'fcm-token-123456789012345678901234567890';
      const deviceToken = DeviceToken.fromString(token);

      expect(deviceToken.getValue()).toBe(token);
    });

    it('should return undefined when fromStringOrUndefined receives null', () => {
      const result = DeviceToken.fromStringOrUndefined(null);
      expect(result).toBeUndefined();
    });

    it('should return undefined when fromStringOrUndefined receives undefined', () => {
      const result = DeviceToken.fromStringOrUndefined(undefined);
      expect(result).toBeUndefined();
    });

    it('should create DeviceToken when fromStringOrUndefined receives valid token', () => {
      const token = 'fcm-token-123456789012345678901234567890';
      const result = DeviceToken.fromStringOrUndefined(token);

      expect(result).toBeInstanceOf(DeviceToken);
      expect(result?.getValue()).toBe(token);
    });
  });

  describe('Static Validation Method', () => {
    it('should return true for valid token (32 chars)', () => {
      expect(DeviceToken.isValid('a'.repeat(32))).toBe(true);
    });

    it('should return true for valid token (200 chars)', () => {
      expect(DeviceToken.isValid('a'.repeat(200))).toBe(true);
    });

    it('should return false for token too short', () => {
      expect(DeviceToken.isValid('a'.repeat(31))).toBe(false);
    });

    it('should return false for token too long', () => {
      expect(DeviceToken.isValid('a'.repeat(201))).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(DeviceToken.isValid('')).toBe(false);
    });
  });
});

