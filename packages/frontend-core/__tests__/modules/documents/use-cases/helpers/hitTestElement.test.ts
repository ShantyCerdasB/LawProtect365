/**
 * @fileoverview Tests for hitTestElement helper
 * @summary Unit tests for element hit-testing
 * @description Comprehensive tests for testing if a point hits an element's bounding box
 */

import { describe, it, expect } from '@jest/globals';
import { hitTestElement } from '../../../../../src/modules/documents/use-cases/helpers/hitTestElement';
import { PdfElementType } from '../../../../../src/modules/documents/enums';
import type { SignaturePlacement, TextPlacement, DatePlacement } from '../../../../../src/modules/documents/types';

describe('hitTestElement', () => {
  describe('Signature hit-testing', () => {
    it('should return true when point is inside signature bounds', () => {
      const signature: SignaturePlacement = {
        signatureImage: 'data:image/png;base64,test',
        coordinates: {
          x: 100,
          y: 200,
          pageNumber: 1,
          pageWidth: 612,
          pageHeight: 792,
        },
        width: 150,
        height: 60,
      };

      const result = hitTestElement(signature, PdfElementType.Signature, 150, 220);

      expect(result).toBe(true);
    });

    it('should return true when point is at top-left corner', () => {
      const signature: SignaturePlacement = {
        signatureImage: 'data:image/png;base64,test',
        coordinates: {
          x: 100,
          y: 200,
          pageNumber: 1,
          pageWidth: 612,
          pageHeight: 792,
        },
        width: 150,
        height: 60,
      };

      const result = hitTestElement(signature, PdfElementType.Signature, 100, 200);

      expect(result).toBe(true);
    });

    it('should return true when point is at bottom-right corner', () => {
      const signature: SignaturePlacement = {
        signatureImage: 'data:image/png;base64,test',
        coordinates: {
          x: 100,
          y: 200,
          pageNumber: 1,
          pageWidth: 612,
          pageHeight: 792,
        },
        width: 150,
        height: 60,
      };

      const result = hitTestElement(signature, PdfElementType.Signature, 250, 260);

      expect(result).toBe(true);
    });

    it('should return false when point is outside signature bounds', () => {
      const signature: SignaturePlacement = {
        signatureImage: 'data:image/png;base64,test',
        coordinates: {
          x: 100,
          y: 200,
          pageNumber: 1,
          pageWidth: 612,
          pageHeight: 792,
        },
        width: 150,
        height: 60,
      };

      const result = hitTestElement(signature, PdfElementType.Signature, 50, 150);

      expect(result).toBe(false);
    });

    it('should return false when point is to the left of signature', () => {
      const signature: SignaturePlacement = {
        signatureImage: 'data:image/png;base64,test',
        coordinates: {
          x: 100,
          y: 200,
          pageNumber: 1,
          pageWidth: 612,
          pageHeight: 792,
        },
        width: 150,
        height: 60,
      };

      const result = hitTestElement(signature, PdfElementType.Signature, 99, 220);

      expect(result).toBe(false);
    });

    it('should return false when point is to the right of signature', () => {
      const signature: SignaturePlacement = {
        signatureImage: 'data:image/png;base64,test',
        coordinates: {
          x: 100,
          y: 200,
          pageNumber: 1,
          pageWidth: 612,
          pageHeight: 792,
        },
        width: 150,
        height: 60,
      };

      const result = hitTestElement(signature, PdfElementType.Signature, 251, 220);

      expect(result).toBe(false);
    });
  });

  describe('Text hit-testing', () => {
    it('should return true when point is inside text bounds (baseline-based)', () => {
      const text: TextPlacement = {
        text: 'Hello',
        coordinates: {
          x: 100,
          y: 200,
          pageNumber: 1,
          pageWidth: 612,
          pageHeight: 792,
        },
        fontSize: 12,
      };

      const result = hitTestElement(text, PdfElementType.Text, 120, 195);

      expect(result).toBe(true);
    });

    it('should return true when point is at baseline', () => {
      const text: TextPlacement = {
        text: 'Test',
        coordinates: {
          x: 100,
          y: 200,
          pageNumber: 1,
          pageWidth: 612,
          pageHeight: 792,
        },
        fontSize: 12,
      };

      const result = hitTestElement(text, PdfElementType.Text, 120, 200);

      expect(result).toBe(true);
    });

    it('should return true when point is at top of text', () => {
      const text: TextPlacement = {
        text: 'Test',
        coordinates: {
          x: 100,
          y: 200,
          pageNumber: 1,
          pageWidth: 612,
          pageHeight: 792,
        },
        fontSize: 12,
      };

      const result = hitTestElement(text, PdfElementType.Text, 120, 188);

      expect(result).toBe(true);
    });

    it('should return false when point is above text', () => {
      const text: TextPlacement = {
        text: 'Test',
        coordinates: {
          x: 100,
          y: 200,
          pageNumber: 1,
          pageWidth: 612,
          pageHeight: 792,
        },
        fontSize: 12,
      };

      const result = hitTestElement(text, PdfElementType.Text, 120, 187);

      expect(result).toBe(false);
    });

    it('should return false when point is below baseline', () => {
      const text: TextPlacement = {
        text: 'Test',
        coordinates: {
          x: 100,
          y: 200,
          pageNumber: 1,
          pageWidth: 612,
          pageHeight: 792,
        },
        fontSize: 12,
      };

      const result = hitTestElement(text, PdfElementType.Text, 120, 201);

      expect(result).toBe(false);
    });
  });

  describe('Date hit-testing', () => {
    it('should return true when point is inside date bounds (baseline-based)', () => {
      const date: DatePlacement = {
        date: new Date(2024, 0, 15),
        coordinates: {
          x: 100,
          y: 200,
          pageNumber: 1,
          pageWidth: 612,
          pageHeight: 792,
        },
        fontSize: 12,
      };

      const result = hitTestElement(date, PdfElementType.Date, 120, 195);

      expect(result).toBe(true);
    });

    it('should return true when point is at baseline', () => {
      const date: DatePlacement = {
        date: new Date(2024, 0, 15),
        coordinates: {
          x: 100,
          y: 200,
          pageNumber: 1,
          pageWidth: 612,
          pageHeight: 792,
        },
        fontSize: 12,
      };

      const result = hitTestElement(date, PdfElementType.Date, 120, 200);

      expect(result).toBe(true);
    });

    it('should return false when point is above date', () => {
      const date: DatePlacement = {
        date: new Date(2024, 0, 15),
        coordinates: {
          x: 100,
          y: 200,
          pageNumber: 1,
          pageWidth: 612,
          pageHeight: 792,
        },
        fontSize: 12,
      };

      const result = hitTestElement(date, PdfElementType.Date, 120, 187);

      expect(result).toBe(false);
    });

    it('should return false when point is below baseline', () => {
      const date: DatePlacement = {
        date: new Date(2024, 0, 15),
        coordinates: {
          x: 100,
          y: 200,
          pageNumber: 1,
          pageWidth: 612,
          pageHeight: 792,
        },
        fontSize: 12,
      };

      const result = hitTestElement(date, PdfElementType.Date, 120, 201);

      expect(result).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should throw error for unsupported element type when calling getElementBounds', () => {
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
        hitTestElement(signature, 'UNKNOWN' as PdfElementType, 150, 220);
      }).toThrow('Unsupported element type: UNKNOWN');
    });

    it('should handle hitTestSignature with point at exact boundaries', () => {
      const signature: SignaturePlacement = {
        signatureImage: 'data:image/png;base64,test',
        coordinates: {
          x: 100,
          y: 200,
          pageNumber: 1,
          pageWidth: 612,
          pageHeight: 792,
        },
        width: 150,
        height: 60,
      };

      expect(hitTestElement(signature, PdfElementType.Signature, 100, 200)).toBe(true);
      expect(hitTestElement(signature, PdfElementType.Signature, 250, 260)).toBe(true);
      expect(hitTestElement(signature, PdfElementType.Signature, 99, 220)).toBe(false);
      expect(hitTestElement(signature, PdfElementType.Signature, 251, 220)).toBe(false);
    });

    it('should handle hitTestTextLike with point at exact boundaries', () => {
      const text: TextPlacement = {
        text: 'Test',
        coordinates: {
          x: 100,
          y: 200,
          pageNumber: 1,
          pageWidth: 612,
          pageHeight: 792,
        },
        fontSize: 12,
      };

      expect(hitTestElement(text, PdfElementType.Text, 100, 200)).toBe(true);
      expect(hitTestElement(text, PdfElementType.Text, 100, 188)).toBe(true);
      expect(hitTestElement(text, PdfElementType.Text, 99, 195)).toBe(false);
      const textWidth = 4 * 12 * 0.6;
      expect(hitTestElement(text, PdfElementType.Text, 100 + textWidth + 1, 195)).toBe(false);
    });

    it('should return true when point is at left boundary of signature', () => {
      const signature: SignaturePlacement = {
        signatureImage: 'data:image/png;base64,test',
        coordinates: {
          x: 100,
          y: 200,
          pageNumber: 1,
          pageWidth: 612,
          pageHeight: 792,
        },
        width: 150,
        height: 60,
      };

      const result = hitTestElement(signature, PdfElementType.Signature, 100, 220);

      expect(result).toBe(true);
    });

    it('should return true when point is at right boundary of signature', () => {
      const signature: SignaturePlacement = {
        signatureImage: 'data:image/png;base64,test',
        coordinates: {
          x: 100,
          y: 200,
          pageNumber: 1,
          pageWidth: 612,
          pageHeight: 792,
        },
        width: 150,
        height: 60,
      };

      const result = hitTestElement(signature, PdfElementType.Signature, 250, 220);

      expect(result).toBe(true);
    });

    it('should return true when point is at top boundary of signature', () => {
      const signature: SignaturePlacement = {
        signatureImage: 'data:image/png;base64,test',
        coordinates: {
          x: 100,
          y: 200,
          pageNumber: 1,
          pageWidth: 612,
          pageHeight: 792,
        },
        width: 150,
        height: 60,
      };

      const result = hitTestElement(signature, PdfElementType.Signature, 150, 200);

      expect(result).toBe(true);
    });

    it('should return true when point is at bottom boundary of signature', () => {
      const signature: SignaturePlacement = {
        signatureImage: 'data:image/png;base64,test',
        coordinates: {
          x: 100,
          y: 200,
          pageNumber: 1,
          pageWidth: 612,
          pageHeight: 792,
        },
        width: 150,
        height: 60,
      };

      const result = hitTestElement(signature, PdfElementType.Signature, 150, 260);

      expect(result).toBe(true);
    });

    it('should return false when point is above signature', () => {
      const signature: SignaturePlacement = {
        signatureImage: 'data:image/png;base64,test',
        coordinates: {
          x: 100,
          y: 200,
          pageNumber: 1,
          pageWidth: 612,
          pageHeight: 792,
        },
        width: 150,
        height: 60,
      };

      const result = hitTestElement(signature, PdfElementType.Signature, 150, 199);

      expect(result).toBe(false);
    });

    it('should return false when point is below signature', () => {
      const signature: SignaturePlacement = {
        signatureImage: 'data:image/png;base64,test',
        coordinates: {
          x: 100,
          y: 200,
          pageNumber: 1,
          pageWidth: 612,
          pageHeight: 792,
        },
        width: 150,
        height: 60,
      };

      const result = hitTestElement(signature, PdfElementType.Signature, 150, 261);

      expect(result).toBe(false);
    });

    it('should return true when point is at left boundary of text', () => {
      const text: TextPlacement = {
        text: 'Test',
        coordinates: {
          x: 100,
          y: 200,
          pageNumber: 1,
          pageWidth: 612,
          pageHeight: 792,
        },
        fontSize: 12,
      };

      const result = hitTestElement(text, PdfElementType.Text, 100, 195);

      expect(result).toBe(true);
    });

    it('should return true when point is at right boundary of text', () => {
      const text: TextPlacement = {
        text: 'Test',
        coordinates: {
          x: 100,
          y: 200,
          pageNumber: 1,
          pageWidth: 612,
          pageHeight: 792,
        },
        fontSize: 12,
      };

      const textWidth = 4 * 12 * 0.6;
      const result = hitTestElement(text, PdfElementType.Text, 100 + textWidth, 195);

      expect(result).toBe(true);
    });

    it('should return true when point is at left boundary of date', () => {
      const date: DatePlacement = {
        date: new Date(2024, 0, 15),
        coordinates: {
          x: 100,
          y: 200,
          pageNumber: 1,
          pageWidth: 612,
          pageHeight: 792,
        },
        fontSize: 12,
      };

      const result = hitTestElement(date, PdfElementType.Date, 100, 195);

      expect(result).toBe(true);
    });

    it('should return true when point is at right boundary of date', () => {
      const date: DatePlacement = {
        date: new Date(2024, 0, 15),
        coordinates: {
          x: 100,
          y: 200,
          pageNumber: 1,
          pageWidth: 612,
          pageHeight: 792,
        },
        fontSize: 12,
      };

      const result = hitTestElement(date, PdfElementType.Date, 100 + 80, 195);

      expect(result).toBe(true);
    });

    it('should return false when point is exactly at left boundary minus one for text', () => {
      const text: TextPlacement = {
        text: 'Test',
        coordinates: {
          x: 100,
          y: 200,
          pageNumber: 1,
          pageWidth: 612,
          pageHeight: 792,
        },
        fontSize: 12,
      };

      const result = hitTestElement(text, PdfElementType.Text, 99, 195);

      expect(result).toBe(false);
    });

    it('should return false when point is exactly at right boundary plus one for text', () => {
      const text: TextPlacement = {
        text: 'Test',
        coordinates: {
          x: 100,
          y: 200,
          pageNumber: 1,
          pageWidth: 612,
          pageHeight: 792,
        },
        fontSize: 12,
      };

      const textWidth = 4 * 12 * 0.6;
      const result = hitTestElement(text, PdfElementType.Text, 100 + textWidth + 1, 195);

      expect(result).toBe(false);
    });

    it('should return false when point is exactly at left boundary minus one for date', () => {
      const date: DatePlacement = {
        date: new Date(2024, 0, 15),
        coordinates: {
          x: 100,
          y: 200,
          pageNumber: 1,
          pageWidth: 612,
          pageHeight: 792,
        },
        fontSize: 12,
      };

      const result = hitTestElement(date, PdfElementType.Date, 99, 195);

      expect(result).toBe(false);
    });

    it('should return false when point is exactly at right boundary plus one for date', () => {
      const date: DatePlacement = {
        date: new Date(2024, 0, 15),
        coordinates: {
          x: 100,
          y: 200,
          pageNumber: 1,
          pageWidth: 612,
          pageHeight: 792,
        },
        fontSize: 12,
      };

      const result = hitTestElement(date, PdfElementType.Date, 100 + 80 + 1, 195);

      expect(result).toBe(false);
    });
  });
});
