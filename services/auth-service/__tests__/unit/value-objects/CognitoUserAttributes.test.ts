/**
 * @fileoverview CognitoUserAttributes Tests - Unit tests for CognitoUserAttributes value object
 * @summary Tests for CognitoUserAttributes getters and methods
 * @description Tests the CognitoUserAttributes value object including all getter methods and custom attribute access.
 */

import { describe, it, expect } from '@jest/globals';
import { CognitoUserAttributes } from '../../../src/domain/value-objects/CognitoUserAttributes';

describe('CognitoUserAttributes', () => {
  describe('constructor', () => {
    it('should create CognitoUserAttributes with raw attributes', () => {
      const raw = { email: 'test@example.com' };
      const attrs = new CognitoUserAttributes(raw);

      expect(attrs.raw).toBe(raw);
    });
  });

  describe('getters', () => {
    it('should get email from attributes', () => {
      const attrs = new CognitoUserAttributes({ email: 'test@example.com' });

      expect(attrs.email).toBe('test@example.com');
    });

    it('should return undefined for missing email', () => {
      const attrs = new CognitoUserAttributes({});

      expect(attrs.email).toBeUndefined();
    });

    it('should get emailVerified as boolean', () => {
      const attrsTrue = new CognitoUserAttributes({ email_verified: 'true' });
      const attrsFalse = new CognitoUserAttributes({ email_verified: 'false' });
      const attrsMissing = new CognitoUserAttributes({});

      expect(attrsTrue.emailVerified).toBe(true);
      expect(attrsFalse.emailVerified).toBe(false);
      expect(attrsMissing.emailVerified).toBe(false);
    });

    it('should get phoneNumber from attributes', () => {
      const attrs = new CognitoUserAttributes({ phone_number: '+1234567890' });

      expect(attrs.phoneNumber).toBe('+1234567890');
    });

    it('should get phoneNumberVerified as boolean', () => {
      const attrsTrue = new CognitoUserAttributes({ phone_number_verified: 'true' });
      const attrsFalse = new CognitoUserAttributes({ phone_number_verified: 'false' });

      expect(attrsTrue.phoneNumberVerified).toBe(true);
      expect(attrsFalse.phoneNumberVerified).toBe(false);
    });

    it('should get givenName from attributes', () => {
      const attrs = new CognitoUserAttributes({ given_name: 'John' });

      expect(attrs.givenName).toBe('John');
    });

    it('should get familyName from attributes', () => {
      const attrs = new CognitoUserAttributes({ family_name: 'Doe' });

      expect(attrs.familyName).toBe('Doe');
    });

    it('should get name from attributes', () => {
      const attrs = new CognitoUserAttributes({ name: 'John Doe' });

      expect(attrs.name).toBe('John Doe');
    });

    it('should get locale from attributes', () => {
      const attrs = new CognitoUserAttributes({ locale: 'en-US' });

      expect(attrs.locale).toBe('en-US');
    });

    it('should get role from custom attributes', () => {
      const attrs = new CognitoUserAttributes({ 'custom:role': 'CUSTOMER' });

      expect(attrs.role).toBe('CUSTOMER');
    });

    it('should get isMfaRequired from custom attributes', () => {
      const attrsTrue = new CognitoUserAttributes({ 'custom:is_mfa_required': 'true' });
      const attrsFalse = new CognitoUserAttributes({ 'custom:is_mfa_required': 'false' });
      const attrsMissing = new CognitoUserAttributes({});

      expect(attrsTrue.isMfaRequired).toBe(true);
      expect(attrsFalse.isMfaRequired).toBe(false);
      expect(attrsMissing.isMfaRequired).toBe(false);
    });
  });

  describe('getCustomAttribute', () => {
    it('should get custom attribute value', () => {
      const attrs = new CognitoUserAttributes({ 'custom:department': 'Engineering' });

      expect(attrs.getCustomAttribute('department')).toBe('Engineering');
    });

    it('should return undefined for missing custom attribute', () => {
      const attrs = new CognitoUserAttributes({});

      expect(attrs.getCustomAttribute('department')).toBeUndefined();
    });

    it('should handle custom attributes with underscores', () => {
      const attrs = new CognitoUserAttributes({ 'custom:user_type': 'premium' });

      expect(attrs.getCustomAttribute('user_type')).toBe('premium');
    });
  });

  describe('complete example', () => {
    it('should handle all attributes together', () => {
      const raw = {
        email: 'test@example.com',
        email_verified: 'true',
        phone_number: '+1234567890',
        phone_number_verified: 'true',
        given_name: 'John',
        family_name: 'Doe',
        name: 'John Doe',
        locale: 'en-US',
        'custom:role': 'CUSTOMER',
        'custom:is_mfa_required': 'true',
        'custom:department': 'Engineering'
      };

      const attrs = new CognitoUserAttributes(raw);

      expect(attrs.email).toBe('test@example.com');
      expect(attrs.emailVerified).toBe(true);
      expect(attrs.phoneNumber).toBe('+1234567890');
      expect(attrs.phoneNumberVerified).toBe(true);
      expect(attrs.givenName).toBe('John');
      expect(attrs.familyName).toBe('Doe');
      expect(attrs.name).toBe('John Doe');
      expect(attrs.locale).toBe('en-US');
      expect(attrs.role).toBe('CUSTOMER');
      expect(attrs.isMfaRequired).toBe(true);
      expect(attrs.getCustomAttribute('department')).toBe('Engineering');
    });
  });
});

