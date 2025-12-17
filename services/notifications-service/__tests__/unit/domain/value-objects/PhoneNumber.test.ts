/**
 * @fileoverview Unit tests for PhoneNumber value object
 * @summary Tests for phone number validation and business logic
 * @description Comprehensive test suite for PhoneNumber value object covering validation,
 * normalization, static factory methods, and E.164 format compliance.
 */

import { PhoneNumber } from '../../../../src/domain/value-objects/PhoneNumber';
import { BadRequestError } from '@lawprotect/shared-ts';

describe('PhoneNumber', () => {
  describe('Constructor and Validation', () => {
    it('should create PhoneNumber with valid E.164 format', () => {
      const validPhone = '+1234567890';
      const phoneNumber = new PhoneNumber(validPhone);

      expect(phoneNumber.getValue()).toBe(validPhone);
    });

    it('should create PhoneNumber with valid international format', () => {
      const validPhone = '+12345678901234';
      const phoneNumber = new PhoneNumber(validPhone);

      expect(phoneNumber.getValue()).toBe(validPhone);
    });

    it('should normalize phone number by removing formatting', () => {
      const formattedPhone = '+1 (234) 567-8901';
      const phoneNumber = new PhoneNumber(formattedPhone);

      expect(phoneNumber.getValue()).toBe('+12345678901');
    });

    it('should normalize phone number with spaces', () => {
      const formattedPhone = '+1 234 567 8901';
      const phoneNumber = new PhoneNumber(formattedPhone);

      expect(phoneNumber.getValue()).toBe('+12345678901');
    });

    it('should normalize phone number with dashes', () => {
      const formattedPhone = '+1-234-567-8901';
      const phoneNumber = new PhoneNumber(formattedPhone);

      expect(phoneNumber.getValue()).toBe('+12345678901');
    });

    it('should throw error when value is empty string', () => {
      expect(() => new PhoneNumber(''))
        .toThrow(BadRequestError);
    });

    it('should throw error when value is null', () => {
      expect(() => new PhoneNumber(null as any))
        .toThrow(BadRequestError);
    });

    it('should throw error when value is undefined', () => {
      expect(() => new PhoneNumber(undefined as any))
        .toThrow(BadRequestError);
    });

    it('should throw error for phone number without plus', () => {
      expect(() => new PhoneNumber('1234567890'))
        .toThrow(BadRequestError);
    });

    it('should throw error for invalid phone format (too short)', () => {
      expect(() => new PhoneNumber('+1'))
        .toThrow(BadRequestError);
    });

    it('should throw error for invalid phone format (too long)', () => {
      expect(() => new PhoneNumber('+123456789012345'))
        .toThrow(BadRequestError);
    });

    it('should throw error for invalid phone format (letters)', () => {
      expect(() => new PhoneNumber('+1-800-FLOWERS'))
        .toThrow(BadRequestError);
    });

    it('should throw error for invalid phone format (special chars)', () => {
      expect(() => new PhoneNumber('+1@234#567$890'))
        .toThrow(BadRequestError);
    });
  });

  describe('Static Factory Methods', () => {
    it('should create PhoneNumber from string', () => {
      const phone = '+1234567890';
      const phoneNumber = PhoneNumber.fromString(phone);

      expect(phoneNumber.getValue()).toBe(phone);
    });

    it('should return undefined when fromStringOrUndefined receives null', () => {
      const result = PhoneNumber.fromStringOrUndefined(null);
      expect(result).toBeUndefined();
    });

    it('should return undefined when fromStringOrUndefined receives undefined', () => {
      const result = PhoneNumber.fromStringOrUndefined(undefined);
      expect(result).toBeUndefined();
    });

    it('should create PhoneNumber when fromStringOrUndefined receives valid phone', () => {
      const phone = '+1234567890';
      const result = PhoneNumber.fromStringOrUndefined(phone);

      expect(result).toBeInstanceOf(PhoneNumber);
      expect(result?.getValue()).toBe(phone);
    });
  });

  describe('Static Normalization Method', () => {
    it('should remove spaces from phone number', () => {
      expect(PhoneNumber.normalize('+1 234 567 8901')).toBe('+12345678901');
    });

    it('should remove dashes from phone number', () => {
      expect(PhoneNumber.normalize('+1-234-567-8901')).toBe('+12345678901');
    });

    it('should remove parentheses from phone number', () => {
      expect(PhoneNumber.normalize('+1 (234) 567-8901')).toBe('+12345678901');
    });

    it('should remove all formatting characters', () => {
      expect(PhoneNumber.normalize('+1 (234) 567-8901')).toBe('+12345678901');
    });

    it('should not modify already normalized phone', () => {
      const normalized = '+1234567890';
      expect(PhoneNumber.normalize(normalized)).toBe(normalized);
    });
  });

  describe('Static Validation Method', () => {
    it('should return true for valid E.164 format', () => {
      expect(PhoneNumber.isValid('+1234567890')).toBe(true);
    });

    it('should return true for valid international format', () => {
      expect(PhoneNumber.isValid('+12345678901234')).toBe(true);
    });

    it('should return false for phone without country code', () => {
      expect(PhoneNumber.isValid('1234567890')).toBe(false);
    });

    it('should return false for phone starting with 0', () => {
      expect(PhoneNumber.isValid('+01234567890')).toBe(false);
    });

    it('should return false for phone too short', () => {
      expect(PhoneNumber.isValid('+1')).toBe(false);
    });

    it('should return false for phone too long', () => {
      expect(PhoneNumber.isValid('+123456789012345')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(PhoneNumber.isValid('')).toBe(false);
    });

    it('should return false for phone with letters', () => {
      expect(PhoneNumber.isValid('+1-800-FLOWERS')).toBe(false);
    });
  });
});

