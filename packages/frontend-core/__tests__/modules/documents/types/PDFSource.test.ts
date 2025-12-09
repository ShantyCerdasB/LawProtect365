/**
 * @fileoverview PDF Source Tests - Ensures PDFSource type guard works correctly
 * @summary Tests for modules/documents/types/PDFSource.ts
 */

import { isPDFSource } from '../../../../src/modules/documents/types/PDFSource';

describe('isPDFSource', () => {
  it('returns true for ArrayBuffer', () => {
    const buffer = new ArrayBuffer(10);
    expect(isPDFSource(buffer)).toBe(true);
  });

  it('returns true for Uint8Array', () => {
    const array = new Uint8Array([1, 2, 3]);
    expect(isPDFSource(array)).toBe(true);
  });

  it('returns true for non-empty string', () => {
    expect(isPDFSource('base64string')).toBe(true);
    expect(isPDFSource('data:application/pdf;base64,abc123')).toBe(true);
  });

  it('returns false for empty string', () => {
    expect(isPDFSource('')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isPDFSource(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isPDFSource(undefined)).toBe(false);
  });

  it('returns false for number', () => {
    expect(isPDFSource(123)).toBe(false);
  });

  it('returns false for object', () => {
    expect(isPDFSource({})).toBe(false);
    expect(isPDFSource({ data: 'test' })).toBe(false);
  });

  it('returns false for array', () => {
    expect(isPDFSource([1, 2, 3])).toBe(false);
  });
});


