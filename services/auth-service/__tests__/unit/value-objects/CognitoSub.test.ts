/**
 * @fileoverview CognitoSub Tests - Unit tests for CognitoSub value object
 * @summary Tests for CognitoSub validation and methods
 * @description Tests the CognitoSub value object including validation, creation, and equality checks.
 */

import { describe, it, expect } from '@jest/globals';
import { CognitoSub } from '../../../src/domain/value-objects/CognitoSub';

describe('CognitoSub', () => {
  describe('constructor', () => {
    it('should create CognitoSub with valid value', () => {
      const value = 'cognito-sub-1234567890';
      const cognitoSub = new CognitoSub(value);

      expect(cognitoSub.getValue()).toBe(value);
    });

    it('should throw error for empty string', () => {
      expect(() => new CognitoSub('')).toThrow();
    });

    it('should throw error for non-string value', () => {
      expect(() => new CognitoSub(null as any)).toThrow();
      expect(() => new CognitoSub(undefined as any)).toThrow();
    });

    it('should throw error for value shorter than 10 characters', () => {
      expect(() => new CognitoSub('short')).toThrow('Invalid Cognito sub');
    });

    it('should throw error for value longer than 255 characters', () => {
      const longValue = 'a'.repeat(256);
      expect(() => new CognitoSub(longValue)).toThrow('Invalid Cognito sub');
    });

    it('should accept value with exactly 10 characters', () => {
      const value = 'a'.repeat(10);
      const cognitoSub = new CognitoSub(value);
      expect(cognitoSub.getValue()).toBe(value);
    });

    it('should accept value with exactly 255 characters', () => {
      const value = 'a'.repeat(255);
      const cognitoSub = new CognitoSub(value);
      expect(cognitoSub.getValue()).toBe(value);
    });
  });

  describe('fromString', () => {
    it('should create CognitoSub from string', () => {
      const value = 'cognito-sub-1234567890';
      const cognitoSub = CognitoSub.fromString(value);

      expect(cognitoSub).toBeInstanceOf(CognitoSub);
      expect(cognitoSub.getValue()).toBe(value);
    });
  });

  describe('equals', () => {
    it('should return true for equal CognitoSubs', () => {
      const value = 'cognito-sub-1234567890';
      const sub1 = new CognitoSub(value);
      const sub2 = new CognitoSub(value);

      expect(sub1.equals(sub2)).toBe(true);
    });

    it('should return false for different CognitoSubs', () => {
      const sub1 = new CognitoSub('cognito-sub-1234567890');
      const sub2 = new CognitoSub('cognito-sub-0987654321');

      expect(sub1.equals(sub2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return string representation', () => {
      const value = 'cognito-sub-1234567890';
      const cognitoSub = new CognitoSub(value);

      expect(cognitoSub.toString()).toBe(value);
    });
  });

  describe('toJSON', () => {
    it('should return JSON representation', () => {
      const value = 'cognito-sub-1234567890';
      const cognitoSub = new CognitoSub(value);

      expect(cognitoSub.toJSON()).toBe(value);
    });
  });
});

