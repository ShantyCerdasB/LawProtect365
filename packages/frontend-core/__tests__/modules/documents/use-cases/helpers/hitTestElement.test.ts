/**
 * @fileoverview Tests for hitTestElement helper
 * @summary Unit tests for element hit testing
 */

import { describe, it, expect } from '@jest/globals';
import { hitTestElement } from '../../../../../src/modules/documents/use-cases/helpers/hitTestElement';
import { PdfElementType } from '../../../../../src/modules/documents/enums';
import type { SignaturePlacement, TextPlacement, DatePlacement } from '../../../../../src/modules/documents/types';

describe('hitTestElement', () => {
  describe('Signature elements', () => {
    it('should return true when point is inside signature bounds', () => {
      const signature: SignaturePlacement = {
        signatureImage: 'data:image/png;base64,test',
        coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
        width: 150,
        height: 60,
      };

      expect(hitTestElement(signature, PdfElementType.Signature, 150, 220)).toBe(true);
      expect(hitTestElement(signature, PdfElementType.Signature, 100, 200)).toBe(true);
      expect(hitTestElement(signature, PdfElementType.Signature, 250, 260)).toBe(true);
    });

    it('should return false when point is outside signature bounds', () => {
      const signature: SignaturePlacement = {
        signatureImage: 'data:image/png;base64,test',
        coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
        width: 150,
        height: 60,
      };

      expect(hitTestElement(signature, PdfElementType.Signature, 50, 200)).toBe(false);
      expect(hitTestElement(signature, PdfElementType.Signature, 300, 200)).toBe(false);
      expect(hitTestElement(signature, PdfElementType.Signature, 150, 100)).toBe(false);
      expect(hitTestElement(signature, PdfElementType.Signature, 150, 300)).toBe(false);
    });

    it('should return true for points on signature boundaries', () => {
      const signature: SignaturePlacement = {
        signatureImage: 'data:image/png;base64,test',
        coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
        width: 150,
        height: 60,
      };

      expect(hitTestElement(signature, PdfElementType.Signature, 100, 200)).toBe(true);
      expect(hitTestElement(signature, PdfElementType.Signature, 250, 260)).toBe(true);
    });

    it('should use default dimensions when width and height are not provided', () => {
      const signature: SignaturePlacement = {
        signatureImage: 'data:image/png;base64,test',
        coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
      };

      expect(hitTestElement(signature, PdfElementType.Signature, 175, 230)).toBe(true);
      expect(hitTestElement(signature, PdfElementType.Signature, 300, 200)).toBe(false);
    });
  });

  describe('Text elements', () => {
    it('should return true when point is inside text bounds', () => {
      const text: TextPlacement = {
        text: 'Hello',
        coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
        fontSize: 12,
      };

      const bounds = { x: 100, y: 200, width: 36, height: 12 };

      expect(hitTestElement(text, PdfElementType.Text, 118, 194)).toBe(true);
      expect(hitTestElement(text, PdfElementType.Text, 100, 200)).toBe(true);
      expect(hitTestElement(text, PdfElementType.Text, 136, 188)).toBe(true);
    });

    it('should return false when point is outside text bounds', () => {
      const text: TextPlacement = {
        text: 'Hello',
        coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
        fontSize: 12,
      };

      expect(hitTestElement(text, PdfElementType.Text, 50, 200)).toBe(false);
      expect(hitTestElement(text, PdfElementType.Text, 200, 200)).toBe(false);
      expect(hitTestElement(text, PdfElementType.Text, 118, 150)).toBe(false);
      expect(hitTestElement(text, PdfElementType.Text, 118, 250)).toBe(false);
    });

    it('should handle baseline-based coordinates correctly', () => {
      const text: TextPlacement = {
        text: 'Test',
        coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
        fontSize: 12,
      };

      expect(hitTestElement(text, PdfElementType.Text, 100, 200)).toBe(true);
      expect(hitTestElement(text, PdfElementType.Text, 100, 188)).toBe(true);
      expect(hitTestElement(text, PdfElementType.Text, 100, 187)).toBe(false);
    });
  });

  describe('Date elements', () => {
    it('should return true when point is inside date bounds', () => {
      const date: DatePlacement = {
        date: new Date('2024-01-15'),
        coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
        format: 'MM/DD/YYYY',
        fontSize: 12,
      };

      expect(hitTestElement(date, PdfElementType.Date, 140, 194)).toBe(true);
      expect(hitTestElement(date, PdfElementType.Date, 100, 200)).toBe(true);
      expect(hitTestElement(date, PdfElementType.Date, 180, 188)).toBe(true);
    });

    it('should return false when point is outside date bounds', () => {
      const date: DatePlacement = {
        date: new Date('2024-01-15'),
        coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
        format: 'MM/DD/YYYY',
        fontSize: 12,
      };

      expect(hitTestElement(date, PdfElementType.Date, 50, 200)).toBe(false);
      expect(hitTestElement(date, PdfElementType.Date, 200, 200)).toBe(false);
      expect(hitTestElement(date, PdfElementType.Date, 140, 150)).toBe(false);
      expect(hitTestElement(date, PdfElementType.Date, 140, 250)).toBe(false);
    });

    it('should handle baseline-based coordinates correctly', () => {
      const date: DatePlacement = {
        date: new Date('2024-01-15'),
        coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
        format: 'MM/DD/YYYY',
        fontSize: 12,
      };

      expect(hitTestElement(date, PdfElementType.Date, 100, 200)).toBe(true);
      expect(hitTestElement(date, PdfElementType.Date, 100, 188)).toBe(true);
      expect(hitTestElement(date, PdfElementType.Date, 100, 187)).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should throw error for unsupported element type', () => {
      const signature: SignaturePlacement = {
        signatureImage: 'test',
        coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
      };

      expect(() => {
        hitTestElement(signature, 'invalid' as PdfElementType, 100, 200);
      }).toThrow('Unsupported element type: invalid');
    });

    it('should handle zero-sized elements', () => {
      const signature: SignaturePlacement = {
        signatureImage: 'test',
        coordinates: { pageNumber: 1, x: 100, y: 200, pageWidth: 612, pageHeight: 792 },
        width: 0,
        height: 0,
      };

      expect(hitTestElement(signature, PdfElementType.Signature, 100, 200)).toBe(true);
      expect(hitTestElement(signature, PdfElementType.Signature, 101, 201)).toBe(false);
    });
  });
});
