/**
 * @fileoverview CognitoEventData Tests - Unit tests for CognitoEventData value object
 * @summary Tests for CognitoEventData creation and with method
 * @description Tests the CognitoEventData value object including creation, validation, and immutable updates.
 */

import { describe, it, expect } from '@jest/globals';
import { CognitoEventData } from '../../../src/domain/value-objects/CognitoEventData';

describe('CognitoEventData', () => {
  const baseData = {
    cognitoSub: 'cognito-sub-1234567890',
    userAttributes: {
      email: 'test@example.com',
      email_verified: 'true'
    }
  };

  describe('constructor', () => {
    it('should create CognitoEventData with required fields', () => {
      const data = new CognitoEventData(baseData.cognitoSub, baseData.userAttributes);

      expect(data.cognitoSub).toBe(baseData.cognitoSub);
      expect(data.userAttributes).toEqual(baseData.userAttributes);
    });

    it('should create CognitoEventData with all optional fields', () => {
      const data = new CognitoEventData(
        baseData.cognitoSub,
        baseData.userAttributes,
        'test@example.com',
        'John',
        'Doe',
        '+1234567890',
        'en-US',
        { clientId: '123' },
        'request-123'
      );

      expect(data.email).toBe('test@example.com');
      expect(data.givenName).toBe('John');
      expect(data.familyName).toBe('Doe');
      expect(data.phoneNumber).toBe('+1234567890');
      expect(data.locale).toBe('en-US');
      expect(data.clientMetadata).toEqual({ clientId: '123' });
      expect(data.requestId).toBe('request-123');
    });

    it('should throw error for empty cognitoSub', () => {
      expect(() => new CognitoEventData('', baseData.userAttributes)).toThrow('Cognito sub is required');
    });

    it('should throw error for whitespace-only cognitoSub', () => {
      expect(() => new CognitoEventData('   ', baseData.userAttributes)).toThrow('Cognito sub is required');
    });
  });

  describe('with', () => {
    it('should create new instance with updated fields', () => {
      const original = new CognitoEventData(baseData.cognitoSub, baseData.userAttributes);
      const updated = original.with({ email: 'new@example.com' });

      expect(updated).not.toBe(original);
      expect(updated.email).toBe('new@example.com');
      expect(updated.cognitoSub).toBe(baseData.cognitoSub);
    });

    it('should preserve original fields when updating', () => {
      const original = new CognitoEventData(
        baseData.cognitoSub,
        baseData.userAttributes,
        'test@example.com',
        'John',
        'Doe'
      );
      const updated = original.with({ email: 'new@example.com' });

      expect(updated.givenName).toBe('John');
      expect(updated.familyName).toBe('Doe');
      expect(updated.email).toBe('new@example.com');
    });

    it('should update multiple fields', () => {
      const original = new CognitoEventData(baseData.cognitoSub, baseData.userAttributes);
      const updated = original.with({
        email: 'new@example.com',
        givenName: 'Jane',
        familyName: 'Smith'
      });

      expect(updated.email).toBe('new@example.com');
      expect(updated.givenName).toBe('Jane');
      expect(updated.familyName).toBe('Smith');
    });

    it('should update cognitoSub', () => {
      const original = new CognitoEventData(baseData.cognitoSub, baseData.userAttributes);
      const newSub = 'new-cognito-sub-123';
      const updated = original.with({ cognitoSub: newSub });

      expect(updated.cognitoSub).toBe(newSub);
    });

    it('should update userAttributes', () => {
      const original = new CognitoEventData(baseData.cognitoSub, baseData.userAttributes);
      const newAttributes = { email: 'new@example.com', name: 'John Doe' };
      const updated = original.with({ userAttributes: newAttributes });

      expect(updated.userAttributes).toEqual(newAttributes);
    });
  });
});

