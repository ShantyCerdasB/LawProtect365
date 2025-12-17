/**
 * @fileoverview PlatformDetectionRule Tests - Unit tests for PlatformDetectionRule
 * @summary Tests for platform detection from device tokens
 * @description Comprehensive test suite for PlatformDetectionRule covering
 * iOS and Android token detection, edge cases, and error handling.
 */

import { describe, it, expect } from '@jest/globals';
import { PlatformDetectionRule } from '../../../../src/domain/rules/PlatformDetectionRule';
import { Platform } from '../../../../src/domain/enums';
import { BadRequestError } from '@lawprotect/shared-ts';

describe('PlatformDetectionRule', () => {
  describe('detectPlatform', () => {
    it('throws error when device token is empty', () => {
      expect(() => PlatformDetectionRule.detectPlatform('')).toThrow(BadRequestError);
    });

    it('throws error when device token is whitespace only', () => {
      expect(() => PlatformDetectionRule.detectPlatform('   ')).toThrow(BadRequestError);
    });

    it('detects iOS platform for 64-character hexadecimal token', () => {
      const iosToken = 'a'.repeat(64);
      expect(PlatformDetectionRule.detectPlatform(iosToken)).toBe(Platform.IOS);
    });

    it('detects iOS platform for 32-character hexadecimal token', () => {
      const iosToken = 'a'.repeat(32);
      expect(PlatformDetectionRule.detectPlatform(iosToken)).toBe(Platform.IOS);
    });

    it('detects Android platform for 152+ character token', () => {
      const androidToken = 'a'.repeat(152);
      expect(PlatformDetectionRule.detectPlatform(androidToken)).toBe(Platform.ANDROID);
    });

    it('detects Android platform for base64-like token over 100 characters', () => {
      const androidToken = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'.repeat(2);
      expect(PlatformDetectionRule.detectPlatform(androidToken)).toBe(Platform.ANDROID);
    });

    it('returns Android as default for unrecognized token format', () => {
      const unknownToken = 'short-token';
      expect(PlatformDetectionRule.detectPlatform(unknownToken)).toBe(Platform.ANDROID);
    });

    it('handles token with whitespace by trimming', () => {
      const iosToken = '  ' + 'a'.repeat(64) + '  ';
      expect(PlatformDetectionRule.detectPlatform(iosToken)).toBe(Platform.IOS);
    });
  });
});

