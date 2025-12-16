/**
 * @fileoverview Tests for getElementBounds helper
 * @summary Unit tests for element bounding box calculations
 * @description Comprehensive tests for calculating bounding boxes for different element types
 */

import { describe, it, expect } from '@jest/globals';
import { getElementBounds } from '../../../../../src/modules/documents/use-cases/helpers/getElementBounds';
import { PdfElementType } from '../../../../../src/modules/documents/enums';
import type { SignaturePlacement, TextPlacement, DatePlacement } from '../../../../../src/modules/documents/types';

describe('getElementBounds', () => {
  describe('Signature bounds', () => {
    it('should calculate bounds for signature with default width and height', () => {
      const signature: SignaturePlacement = {
        signatureImage: 'data:image/png;base64,test',
        coordinates: {
          x: 100,
          y: 200,
          pageNumber: 1,
          pageWidth: 612,
          pageHeight: 792,
        },
      };

      const bounds = getElementBounds(signature, PdfElementType.Signature);

      expect(bounds.x).toBe(100);
      expect(bounds.y).toBe(200);
      expect(bounds.width).toBe(150);
      expect(bounds.height).toBe(60);
    });

    it('should calculate bounds for signature with custom width and height', () => {
      const signature: SignaturePlacement = {
        signatureImage: 'data:image/png;base64,test',
        coordinates: {
          x: 50,
          y: 100,
          pageNumber: 1,
          pageWidth: 612,
          pageHeight: 792,
        },
        width: 200,
        height: 80,
      };

      const bounds = getElementBounds(signature, PdfElementType.Signature);

      expect(bounds.x).toBe(50);
      expect(bounds.y).toBe(100);
      expect(bounds.width).toBe(200);
      expect(bounds.height).toBe(80);
    });

    it('should handle signature with only width specified', () => {
      const signature: SignaturePlacement = {
        signatureImage: 'data:image/png;base64,test',
        coordinates: {
          x: 0,
          y: 0,
          pageNumber: 1,
          pageWidth: 612,
          pageHeight: 792,
        },
        width: 300,
      };

      const bounds = getElementBounds(signature, PdfElementType.Signature);

      expect(bounds.width).toBe(300);
      expect(bounds.height).toBe(60);
    });

    it('should handle signature with only height specified', () => {
      const signature: SignaturePlacement = {
        signatureImage: 'data:image/png;base64,test',
        coordinates: {
          x: 0,
          y: 0,
          pageNumber: 1,
          pageWidth: 612,
          pageHeight: 792,
        },
        height: 100,
      };

      const bounds = getElementBounds(signature, PdfElementType.Signature);

      expect(bounds.width).toBe(150);
      expect(bounds.height).toBe(100);
    });
  });

  describe('Text bounds', () => {
    it('should calculate bounds for text with default font size', () => {
      const text: TextPlacement = {
        text: 'Hello',
        coordinates: {
          x: 100,
          y: 200,
          pageNumber: 1,
          pageWidth: 612,
          pageHeight: 792,
        },
      };

      const bounds = getElementBounds(text, PdfElementType.Text);

      expect(bounds.x).toBe(100);
      expect(bounds.y).toBe(200);
      expect(bounds.width).toBe(5 * 12 * 0.6);
      expect(bounds.height).toBe(12);
    });

    it('should calculate bounds for text with custom font size', () => {
      const text: TextPlacement = {
        text: 'Test',
        coordinates: {
          x: 50,
          y: 150,
          pageNumber: 1,
          pageWidth: 612,
          pageHeight: 792,
        },
        fontSize: 18,
      };

      const bounds = getElementBounds(text, PdfElementType.Text);

      expect(bounds.width).toBe(4 * 18 * 0.6);
      expect(bounds.height).toBe(18);
    });

    it('should handle empty text string', () => {
      const text: TextPlacement = {
        text: '',
        coordinates: {
          x: 100,
          y: 200,
          pageNumber: 1,
          pageWidth: 612,
          pageHeight: 792,
        },
      };

      const bounds = getElementBounds(text, PdfElementType.Text);

      expect(bounds.width).toBe(0);
      expect(bounds.height).toBe(12);
    });

    it('should handle long text strings', () => {
      const longText = 'A'.repeat(20);
      const text: TextPlacement = {
        text: longText,
        coordinates: {
          x: 100,
          y: 200,
          pageNumber: 1,
          pageWidth: 612,
          pageHeight: 792,
        },
      };

      const bounds = getElementBounds(text, PdfElementType.Text);

      expect(bounds.width).toBe(20 * 12 * 0.6);
    });
  });

  describe('Date bounds', () => {
    it('should calculate bounds for date with default font size', () => {
      const date: DatePlacement = {
        date: new Date(2024, 0, 15),
        coordinates: {
          x: 100,
          y: 200,
          pageNumber: 1,
          pageWidth: 612,
          pageHeight: 792,
        },
      };

      const bounds = getElementBounds(date, PdfElementType.Date);

      expect(bounds.x).toBe(100);
      expect(bounds.y).toBe(200);
      expect(bounds.width).toBe(80);
      expect(bounds.height).toBe(12);
    });

    it('should calculate bounds for date with custom font size', () => {
      const date: DatePlacement = {
        date: new Date(2024, 0, 15),
        coordinates: {
          x: 50,
          y: 150,
          pageNumber: 1,
          pageWidth: 612,
          pageHeight: 792,
        },
        fontSize: 16,
      };

      const bounds = getElementBounds(date, PdfElementType.Date);

      expect(bounds.width).toBe(80);
      expect(bounds.height).toBe(16);
    });

    it('should handle date with custom format', () => {
      const date: DatePlacement = {
        date: new Date(2024, 0, 15),
        format: 'DD-MM-YYYY',
        coordinates: {
          x: 100,
          y: 200,
          pageNumber: 1,
          pageWidth: 612,
          pageHeight: 792,
        },
      };

      const bounds = getElementBounds(date, PdfElementType.Date);

      expect(bounds.width).toBe(80);
      expect(bounds.height).toBe(12);
    });
  });

  describe('Error handling', () => {
    it('should throw error for unsupported element type', () => {
      const signature: SignaturePlacement = {
        signatureImage: 'data:image/png;base64,test',
        coordinates: {
          x: 100,
          y: 200,
          pageNumber: 1,
          pageWidth: 612,
          pageHeight: 792,
        },
      };

      expect(() => {
        getElementBounds(signature, 'UNKNOWN' as PdfElementType);
      }).toThrow('Unsupported element type: UNKNOWN');
    });

    it('should handle signature with zero coordinates', () => {
      const signature: SignaturePlacement = {
        signatureImage: 'data:image/png;base64,test',
        coordinates: {
          x: 0,
          y: 0,
          pageNumber: 1,
          pageWidth: 612,
          pageHeight: 792,
        },
        width: 100,
        height: 50,
      };

      const bounds = getElementBounds(signature, PdfElementType.Signature);

      expect(bounds.x).toBe(0);
      expect(bounds.y).toBe(0);
      expect(bounds.width).toBe(100);
      expect(bounds.height).toBe(50);
    });

    it('should handle text with zero coordinates', () => {
      const text: TextPlacement = {
        text: 'Test',
        coordinates: {
          x: 0,
          y: 0,
          pageNumber: 1,
          pageWidth: 612,
          pageHeight: 792,
        },
        fontSize: 12,
      };

      const bounds = getElementBounds(text, PdfElementType.Text);

      expect(bounds.x).toBe(0);
      expect(bounds.y).toBe(0);
    });

    it('should handle date with zero coordinates', () => {
      const date: DatePlacement = {
        date: new Date(2024, 0, 15),
        coordinates: {
          x: 0,
          y: 0,
          pageNumber: 1,
          pageWidth: 612,
          pageHeight: 792,
        },
        fontSize: 12,
      };

      const bounds = getElementBounds(date, PdfElementType.Date);

      expect(bounds.x).toBe(0);
      expect(bounds.y).toBe(0);
    });

    it('should handle text with very large font size', () => {
      const text: TextPlacement = {
        text: 'Large',
        coordinates: {
          x: 100,
          y: 200,
          pageNumber: 1,
          pageWidth: 612,
          pageHeight: 792,
        },
        fontSize: 48,
      };

      const bounds = getElementBounds(text, PdfElementType.Text);

      expect(bounds.width).toBe(5 * 48 * 0.6);
      expect(bounds.height).toBe(48);
    });

    it('should handle date with very large font size', () => {
      const date: DatePlacement = {
        date: new Date(2024, 0, 15),
        coordinates: {
          x: 100,
          y: 200,
          pageNumber: 1,
          pageWidth: 612,
          pageHeight: 792,
        },
        fontSize: 36,
      };

      const bounds = getElementBounds(date, PdfElementType.Date);

      expect(bounds.width).toBe(80);
      expect(bounds.height).toBe(36);
    });

    it('should handle signature with very large dimensions', () => {
      const signature: SignaturePlacement = {
        signatureImage: 'data:image/png;base64,test',
        coordinates: {
          x: 100,
          y: 200,
          pageNumber: 1,
          pageWidth: 612,
          pageHeight: 792,
        },
        width: 500,
        height: 300,
      };

      const bounds = getElementBounds(signature, PdfElementType.Signature);

      expect(bounds.width).toBe(500);
      expect(bounds.height).toBe(300);
    });

    it('should handle text with single character', () => {
      const text: TextPlacement = {
        text: 'A',
        coordinates: {
          x: 100,
          y: 200,
          pageNumber: 1,
          pageWidth: 612,
          pageHeight: 792,
        },
        fontSize: 12,
      };

      const bounds = getElementBounds(text, PdfElementType.Text);

      expect(bounds.width).toBe(1 * 12 * 0.6);
      expect(bounds.height).toBe(12);
    });

    it('should handle text with special characters', () => {
      const text: TextPlacement = {
        text: 'Hello!@#',
        coordinates: {
          x: 100,
          y: 200,
          pageNumber: 1,
          pageWidth: 612,
          pageHeight: 792,
        },
        fontSize: 12,
      };

      const bounds = getElementBounds(text, PdfElementType.Text);

      expect(bounds.width).toBe(8 * 12 * 0.6);
      expect(bounds.height).toBe(12);
    });

    it('should handle date with different font sizes', () => {
      const date1: DatePlacement = {
        date: new Date(2024, 0, 15),
        coordinates: {
          x: 100,
          y: 200,
          pageNumber: 1,
          pageWidth: 612,
          pageHeight: 792,
        },
        fontSize: 10,
      };
      const date2: DatePlacement = {
        date: new Date(2024, 0, 15),
        coordinates: {
          x: 100,
          y: 200,
          pageNumber: 1,
          pageWidth: 612,
          pageHeight: 792,
        },
        fontSize: 20,
      };

      const bounds1 = getElementBounds(date1, PdfElementType.Date);
      const bounds2 = getElementBounds(date2, PdfElementType.Date);

      expect(bounds1.height).toBe(10);
      expect(bounds2.height).toBe(20);
      expect(bounds1.width).toBe(80);
      expect(bounds2.width).toBe(80);
    });
  });
});
