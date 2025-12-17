/**
 * @fileoverview PayloadExtractor Tests - Unit tests for PayloadExtractor
 * @summary Tests for payload extraction utilities
 * @description Comprehensive test suite for PayloadExtractor covering
 * extraction of strings, numbers, booleans, and metadata from payloads.
 */

import { describe, it, expect } from '@jest/globals';
import { PayloadExtractor } from '../../../../src/domain/utils/PayloadExtractor';

describe('PayloadExtractor', () => {
  describe('extractString', () => {
    it('extracts string value', () => {
      const obj = { key: 'value' };
      expect(PayloadExtractor.extractString(obj, 'key')).toBe('value');
    });

    it('returns undefined for missing key', () => {
      const obj = {};
      expect(PayloadExtractor.extractString(obj, 'key')).toBeUndefined();
    });

    it('returns undefined for non-string value', () => {
      const obj = { key: 123 };
      expect(PayloadExtractor.extractString(obj, 'key')).toBeUndefined();
    });
  });

  describe('extractNumber', () => {
    it('extracts number value', () => {
      const obj = { key: 123 };
      expect(PayloadExtractor.extractNumber(obj, 'key')).toBe(123);
    });

    it('returns undefined for missing key', () => {
      const obj = {};
      expect(PayloadExtractor.extractNumber(obj, 'key')).toBeUndefined();
    });

    it('returns undefined for non-number value', () => {
      const obj = { key: '123' };
      expect(PayloadExtractor.extractNumber(obj, 'key')).toBeUndefined();
    });
  });

  describe('extractBoolean', () => {
    it('extracts boolean true value', () => {
      const obj = { key: true };
      expect(PayloadExtractor.extractBoolean(obj, 'key')).toBe(true);
    });

    it('extracts boolean false value', () => {
      const obj = { key: false };
      expect(PayloadExtractor.extractBoolean(obj, 'key')).toBe(false);
    });

    it('returns undefined for missing key', () => {
      const obj = {};
      expect(PayloadExtractor.extractBoolean(obj, 'key')).toBeUndefined();
    });

    it('returns undefined for non-boolean value', () => {
      const obj = { key: 'true' };
      expect(PayloadExtractor.extractBoolean(obj, 'key')).toBeUndefined();
    });
  });

  describe('extractPayloadMetadata', () => {
    it('extracts metadata object', () => {
      const payload = {
        metadata: {
          key: 'value',
          nested: { data: 123 },
        },
      };
      const result = PayloadExtractor.extractPayloadMetadata(payload);
      expect(result).toEqual(payload.metadata);
    });

    it('returns empty object when metadata is missing', () => {
      const payload = {};
      const result = PayloadExtractor.extractPayloadMetadata(payload);
      expect(result).toEqual({});
    });

    it('returns empty object when metadata is undefined', () => {
      const payload = { metadata: undefined };
      const result = PayloadExtractor.extractPayloadMetadata(payload);
      expect(result).toEqual({});
    });
  });
});

