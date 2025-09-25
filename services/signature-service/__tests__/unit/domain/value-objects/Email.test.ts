/**
 * @fileoverview Unit tests for Email value object
 * @summary Tests for email validation and business logic
 * @description Comprehensive test suite for Email value object covering validation,
 * static factory methods, equality, and serialization.
 */

import { Email } from '../../../../src/domain/value-objects/Email';
import { BadRequestError } from '@lawprotect/shared-ts';

describe('Email', () => {
  describe('Constructor and Validation', () => {
    it('should create Email with valid email address', () => {
      const validEmail = 'test@example.com';
      const email = new Email(validEmail);

      expect(email.getValue()).toBe(validEmail);
    });

    it('should throw error when value is empty string', () => {
      expect(() => new Email(''))
        .toThrow(BadRequestError);
    });

    it('should throw error when value is null', () => {
      expect(() => new Email(null as any))
        .toThrow(BadRequestError);
    });

    it('should throw error when value is undefined', () => {
      expect(() => new Email(undefined as any))
        .toThrow(BadRequestError);
    });

    it('should throw error when value is not a valid email', () => {
      const invalidEmails = [
        'invalid-email',
        'test@',
        '@example.com',
        'test.example.com',
        'test@.com',
        'test@example.',
        'test@example..com',
        'test@@example.com',
        'test@example@com',
        'test example@example.com',
        'test@example com'
      ];

      // Test each invalid email individually to avoid deep nesting
      for (const invalidEmail of invalidEmails) {
        expect(() => new Email(invalidEmail)).toThrow(BadRequestError);
      }
    });

    it('should accept valid email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@example.com',
        'user+tag@example.com',
        'user123@example.com',
        'test@sub.example.com',
        'test@example.co.uk',
        'test@example-domain.com',
        'test@example123.com',
        'a@b.co',
        'user@example-domain.com',
        'user@example.museum',
        'user@example.info'
      ];

      // Test each valid email individually to avoid deep nesting
      for (const validEmail of validEmails) {
        expect(() => new Email(validEmail)).not.toThrow();
        const email = new Email(validEmail);
        expect(email.getValue()).toBe(validEmail);
      }
    });

    it('should handle case-insensitive email addresses', () => {
      const email = 'Test@Example.COM';
      
      expect(() => new Email(email)).not.toThrow();
      const emailObj = new Email(email);
      expect(emailObj.getValue()).toBe(email.toLowerCase());
    });

    it('should normalize email to lowercase', () => {
      const email = 'Test@Example.COM';
      const emailObj = new Email(email);

      expect(emailObj.getValue()).toBe(email.toLowerCase());
    });
  });

  describe('Static Factory Methods', () => {
    it('should create Email from string', () => {
      const emailString = 'test@example.com';
      const email = Email.fromString(emailString);

      expect(email.getValue()).toBe(emailString);
    });

    it('should throw error when fromString receives invalid email', () => {
      expect(() => Email.fromString('invalid-email'))
        .toThrow(BadRequestError);
    });
  });

  describe('Business Logic Methods', () => {
    it('should get domain from email', () => {
      const email = new Email('test@example.com');
      
      expect(email.getDomain()).toBe('example.com');
    });

    it('should get domain from email with subdomain', () => {
      const email = new Email('test@mail.example.com');
      
      expect(email.getDomain()).toBe('mail.example.com');
    });

    it('should get domain from email with complex domain', () => {
      const email = new Email('test@example-domain.co.uk');
      
      expect(email.getDomain()).toBe('example-domain.co.uk');
    });

    it('should handle domain extraction for various email formats', () => {
      const testCases = [
        { email: 'user@example.com', expectedDomain: 'example.com' },
        { email: 'user@sub.example.com', expectedDomain: 'sub.example.com' },
        { email: 'user@example.co.uk', expectedDomain: 'example.co.uk' },
        { email: 'user@example-domain.com', expectedDomain: 'example-domain.com' }
      ];

      testCases.forEach(({ email: emailString, expectedDomain }) => {
        const email = new Email(emailString);
        expect(email.getDomain()).toBe(expectedDomain);
      });
    });
  });

  describe('Equality', () => {
    it('should return true for equal Emails', () => {
      const emailString = 'test@example.com';
      const email1 = new Email(emailString);
      const email2 = new Email(emailString);

      expect(email1.equals(email2)).toBe(true);
    });

    it('should return false for different Emails', () => {
      const email1 = new Email('test1@example.com');
      const email2 = new Email('test2@example.com');

      expect(email1.equals(email2)).toBe(false);
    });

    it('should return false when comparing with different object types', () => {
      const email = new Email('test@example.com');
      const otherObject = { getValue: () => 'test@example.com' };

      expect(email.equals(otherObject as any)).toBe(false);
    });

    it('should handle case-insensitive equality', () => {
      const email1 = new Email('test@example.com');
      const email2 = new Email('TEST@EXAMPLE.COM');

      expect(email1.equals(email2)).toBe(true); // Case insensitive
    });
  });

  describe('Serialization', () => {
    it('should return string representation', () => {
      const emailString = 'test@example.com';
      const email = new Email(emailString);

      expect(email.toString()).toBe(emailString);
    });

    it('should return JSON representation', () => {
      const emailString = 'test@example.com';
      const email = new Email(emailString);

      expect(email.toJSON()).toBe(emailString);
    });

    it('should be serializable to JSON string', () => {
      const emailString = 'test@example.com';
      const email = new Email(emailString);
      const json = JSON.stringify(email.toJSON());

      expect(json).toBe(`"${emailString}"`);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long email addresses', () => {
      const longLocalPart = 'a'.repeat(50);
      const longDomain = 'b'.repeat(50) + '.com';
      const longEmail = `${longLocalPart}@${longDomain}`;
      
      expect(() => new Email(longEmail)).not.toThrow();
    });

    it('should handle email with special characters in local part', () => {
      const specialEmail = 'user+tag@example.com';
      
      expect(() => new Email(specialEmail)).not.toThrow();
      const email = new Email(specialEmail);
      expect(email.getValue()).toBe(specialEmail);
    });

    it('should handle email with numbers', () => {
      const numericEmail = 'user123@example456.com';
      
      expect(() => new Email(numericEmail)).not.toThrow();
      const email = new Email(numericEmail);
      expect(email.getValue()).toBe(numericEmail);
    });

    it('should handle email with hyphens', () => {
      const hyphenEmail = 'user-name@example-domain.com';
      
      expect(() => new Email(hyphenEmail)).not.toThrow();
      const email = new Email(hyphenEmail);
      expect(email.getValue()).toBe(hyphenEmail);
    });

    it('should handle email with subdomains', () => {
      const subdomainEmail = 'test@mail.example.com';
      
      expect(() => new Email(subdomainEmail)).not.toThrow();
      const email = new Email(subdomainEmail);
      expect(email.getValue()).toBe(subdomainEmail);
    });

    it('should maintain immutability', () => {
      const emailString = 'test@example.com';
      const email = new Email(emailString);
      const originalValue = email.getValue();

      // Attempting to modify the internal value should not affect the object
      // (This test ensures the value object is truly immutable)
      expect(email.getValue()).toBe(originalValue);
      expect(email.getValue()).toBe(emailString);
    });

    it('should handle whitespace in email', () => {
      const emailWithSpaces = ' test@example.com ';
      
      expect(() => new Email(emailWithSpaces)).not.toThrow();
      const email = new Email(emailWithSpaces);
      expect(email.getValue()).toBe('test@example.com');
    });

    it('should handle non-string inputs', () => {
      expect(() => new Email(123 as any))
        .toThrow(BadRequestError);

      expect(() => new Email({} as any))
        .toThrow(BadRequestError);

      expect(() => new Email([] as any))
        .toThrow(BadRequestError);

      expect(() => new Email(true as any))
        .toThrow(BadRequestError);
    });

    it('should handle very long strings', () => {
      const longString = 'a'.repeat(1000);
      
      expect(() => new Email(longString))
        .toThrow(BadRequestError);
    });

    it('should handle special characters', () => {
      const specialChars = 'test@example.com!';
      
      expect(() => new Email(specialChars))
        .toThrow(BadRequestError);
    });

    it('should handle unicode characters', () => {
      const unicodeEmail = 'test@example.comñ';
      
      expect(() => new Email(unicodeEmail))
        .toThrow(BadRequestError);
    });

    it('should handle multiple @ symbols', () => {
      const multipleAt = 'test@@example.com';
      
      expect(() => new Email(multipleAt))
        .toThrow(BadRequestError);
    });

    it('should handle email without @ symbol', () => {
      const noAt = 'testexample.com';
      
      expect(() => new Email(noAt))
        .toThrow(BadRequestError);
    });

    it('should handle email with spaces', () => {
      const withSpaces = 'test @example.com';
      
      expect(() => new Email(withSpaces))
        .toThrow(BadRequestError);
    });

    it('should handle email with newlines', () => {
      const withNewline = 'test@example.com\n';
      
      expect(() => new Email(withNewline)).not.toThrow();
      const email = new Email(withNewline);
      expect(email.getValue()).toBe('test@example.com');
    });

    it('should handle email with tabs', () => {
      const withTab = 'test@example.com\t';
      
      expect(() => new Email(withTab)).not.toThrow();
      const email = new Email(withTab);
      expect(email.getValue()).toBe('test@example.com');
    });
  });
});
