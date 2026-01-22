/**
 * @fileoverview Tests for applyElementsToPdf use case
 * @summary Unit tests for applying elements to PDF documents
 * @description Comprehensive tests for applying signatures, text, and dates to PDFs
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { PDFDocument } from 'pdf-lib';
import { applyElementsToPdf } from '../../../../src/modules/documents/use-cases/applyElementsToPdf';
import type {
  SignaturePlacement,
  TextPlacement,
  DatePlacement,
} from '../../../../src/modules/documents/types';
import {
  createTestPdf,
  createMultiPagePdf,
  createTestSignatureImage,
} from '../helpers/testUtils';

describe('applyElementsToPdf', () => {
  describe('Signatures', () => {
    it('should apply a single signature to a PDF', async () => {
      const pdfBytes = await createTestPdf();
      const signatureImage = createTestSignatureImage();

      const signatures: SignaturePlacement[] = [
        {
          signatureImage,
          coordinates: {
            x: 100,
            y: 200,
            pageNumber: 1,
            pageWidth: 612,
            pageHeight: 792,
          },
        },
      ];

      const result = await applyElementsToPdf(pdfBytes, signatures);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);

      const loadedDoc = await PDFDocument.load(result);
      expect(loadedDoc.getPageCount()).toBe(1);
    });

    it('should apply multiple signatures to a PDF', async () => {
      const pdfBytes = await createTestPdf();
      const signatureImage = createTestSignatureImage();

      const signatures: SignaturePlacement[] = [
        {
          signatureImage,
          coordinates: {
            x: 100,
            y: 200,
            pageNumber: 1,
            pageWidth: 612,
            pageHeight: 792,
          },
        },
        {
          signatureImage,
          coordinates: {
            x: 300,
            y: 400,
            pageNumber: 1,
            pageWidth: 612,
            pageHeight: 792,
          },
        },
      ];

      const result = await applyElementsToPdf(pdfBytes, signatures);

      expect(result).toBeInstanceOf(Uint8Array);
      const loadedDoc = await PDFDocument.load(result);
      expect(loadedDoc.getPageCount()).toBe(1);
    });

    it('should use default width and height when not provided', async () => {
      const pdfBytes = await createTestPdf();
      const signatureImage = createTestSignatureImage();

      const signatures: SignaturePlacement[] = [
        {
          signatureImage,
          coordinates: {
            x: 100,
            y: 200,
            pageNumber: 1,
            pageWidth: 612,
            pageHeight: 792,
          },
        },
      ];

      const result = await applyElementsToPdf(pdfBytes, signatures);

      expect(result).toBeInstanceOf(Uint8Array);
      const loadedDoc = await PDFDocument.load(result);
      expect(loadedDoc.getPageCount()).toBe(1);
    });

    it('should use custom width and height when provided', async () => {
      const pdfBytes = await createTestPdf();
      const signatureImage = createTestSignatureImage();

      const signatures: SignaturePlacement[] = [
        {
          signatureImage,
          coordinates: {
            x: 100,
            y: 200,
            pageNumber: 1,
            pageWidth: 612,
            pageHeight: 792,
          },
          width: 200,
          height: 80,
        },
      ];

      const result = await applyElementsToPdf(pdfBytes, signatures);

      expect(result).toBeInstanceOf(Uint8Array);
      const loadedDoc = await PDFDocument.load(result);
      expect(loadedDoc.getPageCount()).toBe(1);
    });

    it('should handle signature image without data URL prefix', async () => {
      const pdfBytes = await createTestPdf();
      const pngBase64 =
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      const signatures: SignaturePlacement[] = [
        {
          signatureImage: pngBase64,
          coordinates: {
            x: 100,
            y: 200,
            pageNumber: 1,
            pageWidth: 612,
            pageHeight: 792,
          },
        },
      ];

      const result = await applyElementsToPdf(pdfBytes, signatures);

      expect(result).toBeInstanceOf(Uint8Array);
      const loadedDoc = await PDFDocument.load(result);
      expect(loadedDoc.getPageCount()).toBe(1);
    });

    it('should throw error when signature image format is invalid', async () => {
      const pdfBytes = await createTestPdf();
      const invalidImage = 'data:image/png;base64,';

      const signatures: SignaturePlacement[] = [
        {
          signatureImage: invalidImage,
          coordinates: {
            x: 100,
            y: 200,
            pageNumber: 1,
            pageWidth: 612,
            pageHeight: 792,
          },
        },
      ];

      await expect(applyElementsToPdf(pdfBytes, signatures)).rejects.toThrow(
        'Invalid signature image format'
      );
    });

    it('should apply signatures to different pages', async () => {
      const pdfBytes = await createMultiPagePdf();
      const signatureImage = createTestSignatureImage();

      const signatures: SignaturePlacement[] = [
        {
          signatureImage,
          coordinates: {
            x: 100,
            y: 200,
            pageNumber: 1,
            pageWidth: 612,
            pageHeight: 792,
          },
        },
        {
          signatureImage,
          coordinates: {
            x: 200,
            y: 300,
            pageNumber: 2,
            pageWidth: 612,
            pageHeight: 792,
          },
        },
      ];

      const result = await applyElementsToPdf(pdfBytes, signatures);

      expect(result).toBeInstanceOf(Uint8Array);
      const loadedDoc = await PDFDocument.load(result);
      expect(loadedDoc.getPageCount()).toBe(3);
    });

    it('should throw error when signature image cannot be embedded', async () => {
      const pdfBytes = await createTestPdf();
      const invalidImage = 'invalid-base64-data';

      const signatures: SignaturePlacement[] = [
        {
          signatureImage: invalidImage,
          coordinates: {
            x: 100,
            y: 200,
            pageNumber: 1,
            pageWidth: 612,
            pageHeight: 792,
          },
        },
      ];

      await expect(applyElementsToPdf(pdfBytes, signatures)).rejects.toThrow();
    });
  });

  describe('Text elements', () => {
    it('should apply a single text element to a PDF', async () => {
      const pdfBytes = await createTestPdf();

      const texts: TextPlacement[] = [
        {
          text: 'Hello World',
          coordinates: {
            x: 100,
            y: 200,
            pageNumber: 1,
            pageWidth: 612,
            pageHeight: 792,
          },
        },
      ];

      const result = await applyElementsToPdf(pdfBytes, [], texts);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);

      const loadedDoc = await PDFDocument.load(result);
      expect(loadedDoc.getPageCount()).toBe(1);
    });

    it('should apply multiple text elements to a PDF', async () => {
      const pdfBytes = await createTestPdf();

      const texts: TextPlacement[] = [
        {
          text: 'First Text',
          coordinates: {
            x: 100,
            y: 200,
            pageNumber: 1,
            pageWidth: 612,
            pageHeight: 792,
          },
        },
        {
          text: 'Second Text',
          coordinates: {
            x: 100,
            y: 300,
            pageNumber: 1,
            pageWidth: 612,
            pageHeight: 792,
          },
        },
      ];

      const result = await applyElementsToPdf(pdfBytes, [], texts);

      expect(result).toBeInstanceOf(Uint8Array);
      const loadedDoc = await PDFDocument.load(result);
      expect(loadedDoc.getPageCount()).toBe(1);
    });

    it('should use default font size when not provided', async () => {
      const pdfBytes = await createTestPdf();

      const texts: TextPlacement[] = [
        {
          text: 'Test',
          coordinates: {
            x: 100,
            y: 200,
            pageNumber: 1,
            pageWidth: 612,
            pageHeight: 792,
          },
        },
      ];

      const result = await applyElementsToPdf(pdfBytes, [], texts);

      expect(result).toBeInstanceOf(Uint8Array);
      const loadedDoc = await PDFDocument.load(result);
      expect(loadedDoc.getPageCount()).toBe(1);
    });

    it('should use custom font size when provided', async () => {
      const pdfBytes = await createTestPdf();

      const texts: TextPlacement[] = [
        {
          text: 'Large Text',
          coordinates: {
            x: 100,
            y: 200,
            pageNumber: 1,
            pageWidth: 612,
            pageHeight: 792,
          },
          fontSize: 24,
        },
      ];

      const result = await applyElementsToPdf(pdfBytes, [], texts);

      expect(result).toBeInstanceOf(Uint8Array);
      const loadedDoc = await PDFDocument.load(result);
      expect(loadedDoc.getPageCount()).toBe(1);
    });

    it('should use custom color when provided', async () => {
      const pdfBytes = await createTestPdf();

      const texts: TextPlacement[] = [
        {
          text: 'Colored Text',
          coordinates: {
            x: 100,
            y: 200,
            pageNumber: 1,
            pageWidth: 612,
            pageHeight: 792,
          },
          color: { r: 1, g: 0, b: 0 },
        },
      ];

      const result = await applyElementsToPdf(pdfBytes, [], texts);

      expect(result).toBeInstanceOf(Uint8Array);
      const loadedDoc = await PDFDocument.load(result);
      expect(loadedDoc.getPageCount()).toBe(1);
    });

    it('should use default black color when not provided', async () => {
      const pdfBytes = await createTestPdf();

      const texts: TextPlacement[] = [
        {
          text: 'Black Text',
          coordinates: {
            x: 100,
            y: 200,
            pageNumber: 1,
            pageWidth: 612,
            pageHeight: 792,
          },
        },
      ];

      const result = await applyElementsToPdf(pdfBytes, [], texts);

      expect(result).toBeInstanceOf(Uint8Array);
      const loadedDoc = await PDFDocument.load(result);
      expect(loadedDoc.getPageCount()).toBe(1);
    });

    it('should apply text to different pages', async () => {
      const pdfBytes = await createMultiPagePdf();

      const texts: TextPlacement[] = [
        {
          text: 'Page 1',
          coordinates: {
            x: 100,
            y: 200,
            pageNumber: 1,
            pageWidth: 612,
            pageHeight: 792,
          },
        },
        {
          text: 'Page 2',
          coordinates: {
            x: 100,
            y: 200,
            pageNumber: 2,
            pageWidth: 612,
            pageHeight: 792,
          },
        },
      ];

      const result = await applyElementsToPdf(pdfBytes, [], texts);

      expect(result).toBeInstanceOf(Uint8Array);
      const loadedDoc = await PDFDocument.load(result);
      expect(loadedDoc.getPageCount()).toBe(3);
    });

    it('should handle empty text string', async () => {
      const pdfBytes = await createTestPdf();

      const texts: TextPlacement[] = [
        {
          text: '',
          coordinates: {
            x: 100,
            y: 200,
            pageNumber: 1,
            pageWidth: 612,
            pageHeight: 792,
          },
        },
      ];

      const result = await applyElementsToPdf(pdfBytes, [], texts);

      expect(result).toBeInstanceOf(Uint8Array);
      const loadedDoc = await PDFDocument.load(result);
      expect(loadedDoc.getPageCount()).toBe(1);
    });
  });

  describe('Date elements', () => {
    it('should apply a single date element to a PDF', async () => {
      const pdfBytes = await createTestPdf();

      const dates: DatePlacement[] = [
        {
          date: new Date('2024-01-15'),
          coordinates: {
            x: 100,
            y: 200,
            pageNumber: 1,
            pageWidth: 612,
            pageHeight: 792,
          },
        },
      ];

      const result = await applyElementsToPdf(pdfBytes, [], [], dates);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);

      const loadedDoc = await PDFDocument.load(result);
      expect(loadedDoc.getPageCount()).toBe(1);
    });

    it('should apply multiple date elements to a PDF', async () => {
      const pdfBytes = await createTestPdf();

      const dates: DatePlacement[] = [
        {
          date: new Date('2024-01-15'),
          coordinates: {
            x: 100,
            y: 200,
            pageNumber: 1,
            pageWidth: 612,
            pageHeight: 792,
          },
        },
        {
          date: new Date('2024-12-25'),
          coordinates: {
            x: 100,
            y: 300,
            pageNumber: 1,
            pageWidth: 612,
            pageHeight: 792,
          },
        },
      ];

      const result = await applyElementsToPdf(pdfBytes, [], [], dates);

      expect(result).toBeInstanceOf(Uint8Array);
      const loadedDoc = await PDFDocument.load(result);
      expect(loadedDoc.getPageCount()).toBe(1);
    });

    it('should use default date format when not provided', async () => {
      const pdfBytes = await createTestPdf();

      const dates: DatePlacement[] = [
        {
          date: new Date('2024-01-15'),
          coordinates: {
            x: 100,
            y: 200,
            pageNumber: 1,
            pageWidth: 612,
            pageHeight: 792,
          },
        },
      ];

      const result = await applyElementsToPdf(pdfBytes, [], [], dates);

      expect(result).toBeInstanceOf(Uint8Array);
      const loadedDoc = await PDFDocument.load(result);
      expect(loadedDoc.getPageCount()).toBe(1);
    });

    it('should use custom date format when provided', async () => {
      const pdfBytes = await createTestPdf();

      const dates: DatePlacement[] = [
        {
          date: new Date('2024-01-15'),
          coordinates: {
            x: 100,
            y: 200,
            pageNumber: 1,
            pageWidth: 612,
            pageHeight: 792,
          },
          format: 'DD-MM-YYYY',
        },
      ];

      const result = await applyElementsToPdf(pdfBytes, [], [], dates);

      expect(result).toBeInstanceOf(Uint8Array);
      const loadedDoc = await PDFDocument.load(result);
      expect(loadedDoc.getPageCount()).toBe(1);
    });

    it('should use default font size when not provided', async () => {
      const pdfBytes = await createTestPdf();

      const dates: DatePlacement[] = [
        {
          date: new Date('2024-01-15'),
          coordinates: {
            x: 100,
            y: 200,
            pageNumber: 1,
            pageWidth: 612,
            pageHeight: 792,
          },
        },
      ];

      const result = await applyElementsToPdf(pdfBytes, [], [], dates);

      expect(result).toBeInstanceOf(Uint8Array);
      const loadedDoc = await PDFDocument.load(result);
      expect(loadedDoc.getPageCount()).toBe(1);
    });

    it('should use custom font size when provided', async () => {
      const pdfBytes = await createTestPdf();

      const dates: DatePlacement[] = [
        {
          date: new Date('2024-01-15'),
          coordinates: {
            x: 100,
            y: 200,
            pageNumber: 1,
            pageWidth: 612,
            pageHeight: 792,
          },
          fontSize: 18,
        },
      ];

      const result = await applyElementsToPdf(pdfBytes, [], [], dates);

      expect(result).toBeInstanceOf(Uint8Array);
      const loadedDoc = await PDFDocument.load(result);
      expect(loadedDoc.getPageCount()).toBe(1);
    });

    it('should use custom color when provided', async () => {
      const pdfBytes = await createTestPdf();

      const dates: DatePlacement[] = [
        {
          date: new Date('2024-01-15'),
          coordinates: {
            x: 100,
            y: 200,
            pageNumber: 1,
            pageWidth: 612,
            pageHeight: 792,
          },
          color: { r: 0, g: 0, b: 1 },
        },
      ];

      const result = await applyElementsToPdf(pdfBytes, [], [], dates);

      expect(result).toBeInstanceOf(Uint8Array);
      const loadedDoc = await PDFDocument.load(result);
      expect(loadedDoc.getPageCount()).toBe(1);
    });

    it('should apply dates to different pages', async () => {
      const pdfBytes = await createMultiPagePdf();

      const dates: DatePlacement[] = [
        {
          date: new Date('2024-01-15'),
          coordinates: {
            x: 100,
            y: 200,
            pageNumber: 1,
            pageWidth: 612,
            pageHeight: 792,
          },
        },
        {
          date: new Date('2024-12-25'),
          coordinates: {
            x: 100,
            y: 200,
            pageNumber: 2,
            pageWidth: 612,
            pageHeight: 792,
          },
        },
      ];

      const result = await applyElementsToPdf(pdfBytes, [], [], dates);

      expect(result).toBeInstanceOf(Uint8Array);
      const loadedDoc = await PDFDocument.load(result);
      expect(loadedDoc.getPageCount()).toBe(3);
    });
  });

  describe('Combined elements', () => {
    it('should apply signatures, text, and dates together', async () => {
      const pdfBytes = await createTestPdf();
      const signatureImage = createTestSignatureImage();

      const signatures: SignaturePlacement[] = [
        {
          signatureImage,
          coordinates: {
            x: 100,
            y: 200,
            pageNumber: 1,
            pageWidth: 612,
            pageHeight: 792,
          },
        },
      ];

      const texts: TextPlacement[] = [
        {
          text: 'Signed by',
          coordinates: {
            x: 100,
            y: 150,
            pageNumber: 1,
            pageWidth: 612,
            pageHeight: 792,
          },
        },
      ];

      const dates: DatePlacement[] = [
        {
          date: new Date('2024-01-15'),
          coordinates: {
            x: 100,
            y: 100,
            pageNumber: 1,
            pageWidth: 612,
            pageHeight: 792,
          },
        },
      ];

      const result = await applyElementsToPdf(pdfBytes, signatures, texts, dates);

      expect(result).toBeInstanceOf(Uint8Array);
      const loadedDoc = await PDFDocument.load(result);
      expect(loadedDoc.getPageCount()).toBe(1);
    });

    it('should handle empty arrays', async () => {
      const pdfBytes = await createTestPdf();

      const result = await applyElementsToPdf(pdfBytes, [], [], []);

      expect(result).toBeInstanceOf(Uint8Array);
      const loadedDoc = await PDFDocument.load(result);
      expect(loadedDoc.getPageCount()).toBe(1);
    });

    it('should handle undefined arrays (defaults to empty)', async () => {
      const pdfBytes = await createTestPdf();

      const result = await applyElementsToPdf(pdfBytes);

      expect(result).toBeInstanceOf(Uint8Array);
      const loadedDoc = await PDFDocument.load(result);
      expect(loadedDoc.getPageCount()).toBe(1);
    });
  });

  describe('Error handling', () => {
    it('should throw error when PDF cannot be loaded', async () => {
      const invalidPdfBytes = new Uint8Array([1, 2, 3, 4, 5]);

      await expect(applyElementsToPdf(invalidPdfBytes)).rejects.toThrow();
    });

    it('should throw error when page number is out of bounds', async () => {
      const pdfBytes = await createTestPdf();

      const texts: TextPlacement[] = [
        {
          text: 'Test',
          coordinates: {
            x: 100,
            y: 200,
            pageNumber: 999,
            pageWidth: 612,
            pageHeight: 792,
          },
        },
      ];

      await expect(applyElementsToPdf(pdfBytes, [], texts)).rejects.toThrow();
    });

    it('should throw error when signature image format is invalid', async () => {
      const pdfBytes = await createTestPdf();
      const invalidImage = 'data:image/png;base64,';

      const signatures: SignaturePlacement[] = [
        {
          signatureImage: invalidImage,
          coordinates: {
            x: 100,
            y: 200,
            pageNumber: 1,
            pageWidth: 612,
            pageHeight: 792,
          },
        },
      ];

      await expect(applyElementsToPdf(pdfBytes, signatures)).rejects.toThrow(
        'Invalid signature image format'
      );
    });
  });

  describe('Coordinate conversion', () => {
    it('should handle coordinates with different page dimensions', async () => {
      const pdfBytes = await createTestPdf();

      const texts: TextPlacement[] = [
        {
          text: 'Scaled Text',
          coordinates: {
            x: 200,
            y: 400,
            pageNumber: 1,
            pageWidth: 1224,
            pageHeight: 1584,
          },
        },
      ];

      const result = await applyElementsToPdf(pdfBytes, [], texts);

      expect(result).toBeInstanceOf(Uint8Array);
      const loadedDoc = await PDFDocument.load(result);
      expect(loadedDoc.getPageCount()).toBe(1);
    });

    it('should handle elements at bottom of page correctly', async () => {
      const pdfBytes = await createTestPdf();

      const texts: TextPlacement[] = [
        {
          text: 'Bottom Text',
          coordinates: {
            x: 100,
            y: 50,
            pageNumber: 1,
            pageWidth: 612,
            pageHeight: 792,
          },
        },
      ];

      const result = await applyElementsToPdf(pdfBytes, [], texts);

      expect(result).toBeInstanceOf(Uint8Array);
      const loadedDoc = await PDFDocument.load(result);
      expect(loadedDoc.getPageCount()).toBe(1);
    });
  });
});





















