/**
 * @fileoverview Tests for getElementBounds helper
 * @summary Unit tests for element bounds calculation
 */

import { describe, it, expect } from '@jest/globals';
import { getElementBounds } from '../../../../../src/modules/documents/use-cases/helpers/getElementBounds';
import { PdfElementType } from '../../../../../src/modules/documents/enums';
import type { SignaturePlacement, TextPlacement, DatePlacement } from '../../../../../src/modules/documents/types';

describe('getElementBounds', () => {
  describe('Signature elements', () => {
    it('should calculate bounds for signature with width and height', () => {
      const signature: SignaturePlacement = {
        signatureImage: 'data:image/png;base64,test',
        coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
        width: 200,
        height: 100,
      };

      const result = getElementBounds(signature, PdfElementType.Signature);

      expect(result).toEqual({
        x: 100,
        y: 200,
        width: 200,
        height: 100,
      });
    });

    it('should use default dimensions when width and height are not provided', () => {
      const signature: SignaturePlacement = {
        signatureImage: 'data:image/png;base64,test',
        coordinates: { pageNumber: 1, x: 50, y: 75, pageWidth: 612, pageHeight: 792 },
      };

      const result = getElementBounds(signature, PdfElementType.Signature);

      expect(result.x).toBe(50);
      expect(result.y).toBe(75);
      expect(result.width).toBe(150);
      expect(result.height).toBe(60);
    });
  });

  describe('Text elements', () => {
    it('should calculate bounds for text element', () => {
      const text: TextPlacement = {
        text: 'Hello',
        coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
        fontSize: 12,
      };

      const result = getElementBounds(text, PdfElementType.Text);

      expect(result.x).toBe(100);
      expect(result.y).toBe(200);
      expect(result.width).toBeCloseTo(36, 1);
      expect(result.height).toBe(12);
    });

    it('should use default font size when not provided', () => {
      const text: TextPlacement = {
        text: 'Test',
        coordinates: { pageNumber: 1, x: 50, y: 100, pageWidth: 612, pageHeight: 792 },
      };

      const result = getElementBounds(text, PdfElementType.Text);

      expect(result.height).toBe(12);
      expect(result.width).toBeCloseTo(28.8, 1);
    });

    it('should calculate width based on text length', () => {
      const shortText: TextPlacement = {
        text: 'Hi',
        coordinates: { pageNumber: 1, x: 0, y: 0, pageWidth: 612, pageHeight: 792 },
        fontSize: 12,
      };

      const longText: TextPlacement = {
        text: 'Hello World',
        coordinates: { pageNumber: 1, x: 0, y: 0, pageWidth: 612, pageHeight: 792 },
        fontSize: 12,
      };

      const shortResult = getElementBounds(shortText, PdfElementType.Text);
      const longResult = getElementBounds(longText, PdfElementType.Text);

      expect(longResult.width).toBeGreaterThan(shortResult.width);
    });
  });

  describe('Date elements', () => {
    it('should calculate bounds for date element', () => {
      const date: DatePlacement = {
        date: new Date('2024-01-15'),
        coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
        format: 'MM/DD/YYYY',
        fontSize: 12,
      };

      const result = getElementBounds(date, PdfElementType.Date);

      expect(result.x).toBe(100);
      expect(result.y).toBe(200);
      expect(result.width).toBe(80);
      expect(result.height).toBe(12);
    });

    it('should use default font size when not provided', () => {
      const date: DatePlacement = {
        date: new Date('2024-01-15'),
        coordinates: { pageNumber: 1, x: 50, y: 100, pageWidth: 612, pageHeight: 792 },
        format: 'MM/DD/YYYY',
      };

      const result = getElementBounds(date, PdfElementType.Date);

      expect(result.height).toBe(12);
      expect(result.width).toBe(80);
    });

    it('should use default date width regardless of format', () => {
      const date1: DatePlacement = {
        date: new Date('2024-01-15'),
        coordinates: { pageNumber: 1, x: 0, y: 0, pageWidth: 612, pageHeight: 792 },
        format: 'MM/DD/YYYY',
        fontSize: 12,
      };

      const date2: DatePlacement = {
        date: new Date('2024-01-15'),
        coordinates: { pageNumber: 1, x: 0, y: 0, pageWidth: 612, pageHeight: 792 },
        format: 'YYYY-MM-DD',
        fontSize: 12,
      };

      const result1 = getElementBounds(date1, PdfElementType.Date);
      const result2 = getElementBounds(date2, PdfElementType.Date);

      expect(result1.width).toBe(result2.width);
      expect(result1.width).toBe(80);
    });
  });

  describe('error handling', () => {
    it('should throw error for unsupported element type', () => {
      const signature: SignaturePlacement = {
        signatureImage: 'test',
        coordinates: { pageNumber: 1, x: 0, y: 0, pageWidth: 612, pageHeight: 792 },
      };

      expect(() => {
        getElementBounds(signature, 'invalid' as PdfElementType);
      }).toThrow('Unsupported element type: invalid');
    });
  });
});
