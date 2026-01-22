/**
 * @fileoverview Tests for normalizeDataUrl use case
 * @summary Unit tests for data URL normalization utility
 * @description Comprehensive tests for normalizing data URLs
 */

import { describe, it, expect } from '@jest/globals';
import { normalizeDataUrl } from '../../../../src/modules/documents/use-cases/normalizeDataUrl';

describe('normalizeDataUrl', () => {
  it('should return data URL as-is when it already starts with data:', () => {
    const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const result = normalizeDataUrl(dataUrl);

    expect(result).toBe(dataUrl);
  });

  it('should add data URL prefix when input is only base64 string', () => {
    const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const result = normalizeDataUrl(base64);

    expect(result).toBe(`data:image/png;base64,${base64}`);
  });

  it('should handle empty base64 string', () => {
    const result = normalizeDataUrl('');

    expect(result).toBe('data:image/png;base64,');
  });

  it('should handle data URL with different image types', () => {
    const jpegUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
    const result = normalizeDataUrl(jpegUrl);

    expect(result).toBe(jpegUrl);
  });

  it('should handle data URL with different encodings', () => {
    const url = 'data:image/png;base64,test';
    const result = normalizeDataUrl(url);

    expect(result).toBe(url);
  });

  it('should normalize base64 string without prefix', () => {
    const base64 = 'dGVzdA==';
    const result = normalizeDataUrl(base64);

    expect(result).toBe('data:image/png;base64,dGVzdA==');
  });

  it('should handle data URL that starts with data: but has different format', () => {
    const dataUrl = 'data:text/plain;base64,SGVsbG8gV29ybGQ=';
    const result = normalizeDataUrl(dataUrl);

    expect(result).toBe(dataUrl);
  });

  it('should handle very long base64 string', () => {
    const longBase64 = 'A'.repeat(1000);
    const result = normalizeDataUrl(longBase64);

    expect(result).toBe(`data:image/png;base64,${longBase64}`);
  });
});

















