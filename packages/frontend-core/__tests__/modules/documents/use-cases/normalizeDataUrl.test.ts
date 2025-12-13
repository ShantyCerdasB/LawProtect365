/**
 * @fileoverview Tests for normalizeDataUrl use case
 * @summary Unit tests for data URL normalization function
 */

import { describe, it, expect } from '@jest/globals';
import { normalizeDataUrl } from '../../../../src/modules/documents/use-cases/normalizeDataUrl';

describe('normalizeDataUrl', () => {
  describe('when input already has data URL prefix', () => {
    it('should return data URL as-is when it starts with data:', () => {
      const input = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const result = normalizeDataUrl(input);
      expect(result).toBe(input);
    });

    it('should return data URL with different image type', () => {
      const input = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
      const result = normalizeDataUrl(input);
      expect(result).toBe(input);
    });

    it('should return data URL with different encoding', () => {
      const input = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const result = normalizeDataUrl(input);
      expect(result).toBe(input);
    });
  });

  describe('when input is base64 string without prefix', () => {
    it('should add data:image/png;base64, prefix to base64 string', () => {
      const input = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const result = normalizeDataUrl(input);
      expect(result).toBe(`data:image/png;base64,${input}`);
    });

    it('should handle empty base64 string', () => {
      const input = '';
      const result = normalizeDataUrl(input);
      expect(result).toBe('data:image/png;base64,');
    });

    it('should handle short base64 string', () => {
      const input = 'ABC';
      const result = normalizeDataUrl(input);
      expect(result).toBe('data:image/png;base64,ABC');
    });
  });

  describe('edge cases', () => {
    it('should handle string that starts with data but is not valid data URL', () => {
      const input = 'data:invalid';
      const result = normalizeDataUrl(input);
      expect(result).toBe(input);
    });

    it('should handle string with data: in middle', () => {
      const input = 'prefixdata:image/png;base64,ABC';
      const result = normalizeDataUrl(input);
      expect(result).toBe('data:image/png;base64,prefixdata:image/png;base64,ABC');
    });
  });
});
