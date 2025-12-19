/**
 * @fileoverview UserProfileRules Tests - Unit tests for UserProfileRules
 * @summary Tests for user profile validation rules
 * @description Tests all methods in UserProfileRules class.
 */

import { describe, it, expect } from '@jest/globals';
import { UserProfileRules } from '../../../src/domain/rules/UserProfileRules';
import { PatchMeRequest } from '../../../src/domain/schemas/PatchMeSchema';

describe('UserProfileRules', () => {
  describe('validateProfileUpdate', () => {
    it('should not throw for valid request with name', () => {
      const request: PatchMeRequest = { name: 'John Doe' };
      expect(() => UserProfileRules.validateProfileUpdate(request)).not.toThrow();
    });

    it('should not throw for valid request with givenName', () => {
      const request: PatchMeRequest = { givenName: 'John' };
      expect(() => UserProfileRules.validateProfileUpdate(request)).not.toThrow();
    });

    it('should not throw for valid request with lastName', () => {
      const request: PatchMeRequest = { lastName: 'Doe' };
      expect(() => UserProfileRules.validateProfileUpdate(request)).not.toThrow();
    });

    it('should not throw for valid request with personalInfo', () => {
      const request: PatchMeRequest = {
        name: 'John Doe',
        personalInfo: {
          phone: '+1234567890',
          locale: 'en-US',
          timeZone: 'America/New_York'
        }
      };
      expect(() => UserProfileRules.validateProfileUpdate(request)).not.toThrow();
    });

    it('should validate all name fields', () => {
      const request: PatchMeRequest = {
        name: 'John Doe',
        givenName: 'John',
        lastName: 'Doe'
      };
      expect(() => UserProfileRules.validateProfileUpdate(request)).not.toThrow();
    });
  });

  describe('validateName', () => {
    it('should throw error for names with control characters', () => {
      const request: PatchMeRequest = { name: 'John\x00Doe' };
      try {
        UserProfileRules.validateProfileUpdate(request);
        fail('Expected error');
      } catch (error: any) {
        expect(error.details?.message).toBe('Name cannot contain control characters');
      }
    });

    it('should throw error for names with leading/trailing whitespace', () => {
      const request: PatchMeRequest = { name: ' John Doe ' };
      try {
        UserProfileRules.validateProfileUpdate(request);
        fail('Expected error');
      } catch (error: any) {
        expect(error.details?.message).toBe('Name cannot have leading or trailing whitespace');
      }
    });

    it('should throw error for name exceeding 120 characters', () => {
      const longName = 'a'.repeat(121);
      const request: PatchMeRequest = { name: longName };
      try {
        UserProfileRules.validateProfileUpdate(request);
        fail('Expected error');
      } catch (error: any) {
        expect(error.details?.message).toBe('name cannot exceed 120 characters');
      }
    });

    it('should throw error for givenName exceeding 60 characters', () => {
      const longName = 'a'.repeat(61);
      const request: PatchMeRequest = { givenName: longName };
      try {
        UserProfileRules.validateProfileUpdate(request);
        fail('Expected error');
      } catch (error: any) {
        expect(error.details?.message).toBe('givenName cannot exceed 60 characters');
      }
    });

    it('should throw error for lastName exceeding 60 characters', () => {
      const longName = 'a'.repeat(61);
      const request: PatchMeRequest = { lastName: longName };
      try {
        UserProfileRules.validateProfileUpdate(request);
        fail('Expected error');
      } catch (error: any) {
        expect(error.details?.message).toBe('lastName cannot exceed 60 characters');
      }
    });
  });

  describe('validatePhone', () => {
    it('should throw error for invalid phone format', () => {
      const request: PatchMeRequest = {
        personalInfo: { phone: 'invalid' }
      };
      try {
        UserProfileRules.validateProfileUpdate(request);
        fail('Expected error');
      } catch (error: any) {
        expect(error.details?.message).toBe('Phone must be in E.164 format (e.g., +1234567890)');
      }
    });

    it('should not throw for valid E.164 phone format', () => {
      const request: PatchMeRequest = {
        personalInfo: { phone: '+1234567890' }
      };
      expect(() => UserProfileRules.validateProfileUpdate(request)).not.toThrow();
    });

    it('should not throw when phone is undefined', () => {
      const request: PatchMeRequest = {
        personalInfo: {}
      };
      expect(() => UserProfileRules.validateProfileUpdate(request)).not.toThrow();
    });
  });

  describe('validateLocale', () => {
    it('should throw error for invalid locale format', () => {
      const request: PatchMeRequest = {
        personalInfo: { locale: 'invalid' }
      };
      try {
        UserProfileRules.validateProfileUpdate(request);
        fail('Expected error');
      } catch (error: any) {
        expect(error.details?.message).toBe('Locale must be in BCP47 format (e.g., es-CR, en-US)');
      }
    });

    it('should not throw for valid BCP47 locale format', () => {
      const request: PatchMeRequest = {
        personalInfo: { locale: 'en-US' }
      };
      expect(() => UserProfileRules.validateProfileUpdate(request)).not.toThrow();
    });

    it('should not throw for es-CR locale', () => {
      const request: PatchMeRequest = {
        personalInfo: { locale: 'es-CR' }
      };
      expect(() => UserProfileRules.validateProfileUpdate(request)).not.toThrow();
    });
  });

  describe('validateTimeZone', () => {
    it('should throw error for invalid timezone format', () => {
      const request: PatchMeRequest = {
        personalInfo: { timeZone: 'invalid' }
      };
      try {
        UserProfileRules.validateProfileUpdate(request);
        fail('Expected error');
      } catch (error: any) {
        expect(error.details?.message).toBe('TimeZone must be in IANA format (e.g., America/Costa_Rica)');
      }
    });

    it('should not throw for valid IANA timezone format', () => {
      const request: PatchMeRequest = {
        personalInfo: { timeZone: 'America/New_York' }
      };
      expect(() => UserProfileRules.validateProfileUpdate(request)).not.toThrow();
    });

    it('should not throw for America/Costa_Rica timezone', () => {
      const request: PatchMeRequest = {
        personalInfo: { timeZone: 'America/Costa_Rica' }
      };
      expect(() => UserProfileRules.validateProfileUpdate(request)).not.toThrow();
    });
  });

  describe('sanitizeString', () => {
    it('should remove control characters', () => {
      const input = 'John\x00Doe\x01Test';
      const result = UserProfileRules.sanitizeString(input);
      expect(result).toBe('JohnDoeTest');
    });

    it('should remove zero-width space', () => {
      const input = 'John\u200BDoe';
      const result = UserProfileRules.sanitizeString(input);
      expect(result).toBe('JohnDoe');
    });

    it('should normalize whitespace', () => {
      const input = 'John    Doe\n\tTest';
      const result = UserProfileRules.sanitizeString(input);
      expect(result).toBe('John Doe Test');
    });

    it('should handle all sanitization together', () => {
      const input = 'John\x00    Doe\u200B\nTest';
      const result = UserProfileRules.sanitizeString(input);
      expect(result).toBe('John Doe Test');
    });
  });
});

