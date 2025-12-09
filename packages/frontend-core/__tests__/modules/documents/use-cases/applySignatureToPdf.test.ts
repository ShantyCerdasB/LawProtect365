/**
 * @fileoverview Apply Signature to PDF Tests - Ensures applySignatureToPdf works correctly
 * @summary Tests for modules/documents/use-cases/applySignatureToPdf.ts
 */

import { PDFDocument } from 'pdf-lib';
import { applySignatureToPdf } from '../../../../src/modules/documents/use-cases/applySignatureToPdf';
import type { SignaturePlacement } from '../../../../src/modules/documents/types';
import {
  createTestPdf,
  createMultiPagePdf,
  createTestSignatureImage,
} from '../helpers/testUtils';

describe('applySignatureToPdf', () => {
  it('applies a single signature to a PDF', async () => {
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

    const signedPdf = await applySignatureToPdf(pdfBytes, signatures);

    expect(signedPdf).toBeInstanceOf(Uint8Array);
    expect(signedPdf.length).toBeGreaterThan(0);

    // Verify the PDF is still valid by loading it
    const loadedDoc = await PDFDocument.load(signedPdf);
    expect(loadedDoc.getPageCount()).toBe(1);
  });

  it('applies multiple signatures to a PDF', async () => {
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

    const signedPdf = await applySignatureToPdf(pdfBytes, signatures);

    expect(signedPdf).toBeInstanceOf(Uint8Array);
    expect(signedPdf.length).toBeGreaterThan(0);

    const loadedDoc = await PDFDocument.load(signedPdf);
    expect(loadedDoc.getPageCount()).toBe(1);
  });

  it('applies signatures to different pages', async () => {
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
      {
        signatureImage,
        coordinates: {
          x: 300,
          y: 400,
          pageNumber: 3,
          pageWidth: 612,
          pageHeight: 792,
        },
      },
    ];

    const signedPdf = await applySignatureToPdf(pdfBytes, signatures);

    expect(signedPdf).toBeInstanceOf(Uint8Array);
    const loadedDoc = await PDFDocument.load(signedPdf);
    expect(loadedDoc.getPageCount()).toBe(3);
  });

  it('uses default width and height when not provided', async () => {
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
        // width and height not provided, should use defaults
      },
    ];

    const signedPdf = await applySignatureToPdf(pdfBytes, signatures);

    expect(signedPdf).toBeInstanceOf(Uint8Array);
    const loadedDoc = await PDFDocument.load(signedPdf);
    expect(loadedDoc.getPageCount()).toBe(1);
  });

  it('uses custom width and height when provided', async () => {
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

    const signedPdf = await applySignatureToPdf(pdfBytes, signatures);

    expect(signedPdf).toBeInstanceOf(Uint8Array);
    const loadedDoc = await PDFDocument.load(signedPdf);
    expect(loadedDoc.getPageCount()).toBe(1);
  });

  it('handles signature image without data URL prefix', async () => {
    const pdfBytes = await createTestPdf();
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const signatureImage = pngBase64; // No data:image/png;base64, prefix

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

    const signedPdf = await applySignatureToPdf(pdfBytes, signatures);

    expect(signedPdf).toBeInstanceOf(Uint8Array);
    const loadedDoc = await PDFDocument.load(signedPdf);
    expect(loadedDoc.getPageCount()).toBe(1);
  });

  it('throws error when signatures array is empty', async () => {
    const pdfBytes = await createTestPdf();

    await expect(applySignatureToPdf(pdfBytes, [])).rejects.toThrow(
      'At least one signature is required'
    );
  });

  it('throws error when signature image is invalid', async () => {
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

    await expect(applySignatureToPdf(pdfBytes, signatures)).rejects.toThrow();
  });

  it('throws error when signature image format is invalid', async () => {
    const pdfBytes = await createTestPdf();
    const invalidImage = 'data:image/png;base64,'; // Empty base64

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

    await expect(applySignatureToPdf(pdfBytes, signatures)).rejects.toThrow(
      'Invalid signature image format'
    );
  });

  it('handles coordinates with different page dimensions', async () => {
    const pdfBytes = await createTestPdf();
    const signatureImage = createTestSignatureImage();

    // Coordinates from a scaled canvas (e.g., 2x scale)
    const signatures: SignaturePlacement[] = [
      {
        signatureImage,
        coordinates: {
          x: 200, // Scaled coordinate
          y: 400, // Scaled coordinate
          pageNumber: 1,
          pageWidth: 1224, // 2x scale
          pageHeight: 1584, // 2x scale
        },
      },
    ];

    const signedPdf = await applySignatureToPdf(pdfBytes, signatures);

    expect(signedPdf).toBeInstanceOf(Uint8Array);
    const loadedDoc = await PDFDocument.load(signedPdf);
    expect(loadedDoc.getPageCount()).toBe(1);
  });

  it('handles signature at bottom of page correctly', async () => {
    const pdfBytes = await createTestPdf();
    const signatureImage = createTestSignatureImage();

    // Place signature near bottom (Y coordinate near pageHeight)
    const signatures: SignaturePlacement[] = [
      {
        signatureImage,
        coordinates: {
          x: 100,
          y: 50, // Near bottom
          pageNumber: 1,
          pageWidth: 612,
          pageHeight: 792,
        },
      },
    ];

    const signedPdf = await applySignatureToPdf(pdfBytes, signatures);

    expect(signedPdf).toBeInstanceOf(Uint8Array);
    const loadedDoc = await PDFDocument.load(signedPdf);
    expect(loadedDoc.getPageCount()).toBe(1);
  });

  it('throws error when page number is out of bounds (too high)', async () => {
    const pdfBytes = await createTestPdf();
    const signatureImage = createTestSignatureImage();

    const signatures: SignaturePlacement[] = [
      {
        signatureImage,
        coordinates: {
          x: 100,
          y: 200,
          pageNumber: 999, // Page doesn't exist
          pageWidth: 612,
          pageHeight: 792,
        },
      },
    ];

    await expect(applySignatureToPdf(pdfBytes, signatures)).rejects.toThrow();
  });

  it('throws error when page number is out of bounds (zero)', async () => {
    const pdfBytes = await createTestPdf();
    const signatureImage = createTestSignatureImage();

    const signatures: SignaturePlacement[] = [
      {
        signatureImage,
        coordinates: {
          x: 100,
          y: 200,
          pageNumber: 0, // Invalid page number
          pageWidth: 612,
          pageHeight: 792,
        },
      },
    ];

    await expect(applySignatureToPdf(pdfBytes, signatures)).rejects.toThrow();
  });

  it('throws error when PDF cannot be loaded', async () => {
    const invalidPdfBytes = new Uint8Array([1, 2, 3, 4, 5]); // Invalid PDF data
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

    await expect(applySignatureToPdf(invalidPdfBytes, signatures)).rejects.toThrow();
  });

  it('handles signature image with empty base64 after comma', async () => {
    const pdfBytes = await createTestPdf();
    const invalidImage = 'data:image/png;base64,'; // Empty after comma

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

    await expect(applySignatureToPdf(pdfBytes, signatures)).rejects.toThrow(
      'Invalid signature image format'
    );
  });

  it('propagates embed errors with message', async () => {
    const pdfBytes = await createTestPdf();
    const signatureImage = createTestSignatureImage();

    // Mock PDFDocument.load to throw inside embedPng
    const embedError = new Error('embed failed');
    const loadSpy = jest.spyOn(PDFDocument, 'load');
    loadSpy.mockResolvedValueOnce({
      getPage: () => ({
        getSize: () => ({ width: 612, height: 792 }),
        drawImage: jest.fn(),
      }),
      embedPng: jest.fn(async () => {
        throw embedError;
      }),
      save: jest.fn(),
    } as unknown as PDFDocument);

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

    await expect(applySignatureToPdf(pdfBytes, signatures)).rejects.toThrow(
      'Failed to embed signature image: embed failed'
    );

    loadSpy.mockRestore();
  });

  it('propagates embed errors with unknown type', async () => {
    const pdfBytes = await createTestPdf();
    const signatureImage = createTestSignatureImage();

    const loadSpy = jest.spyOn(PDFDocument, 'load');
    loadSpy.mockResolvedValueOnce({
      getPage: () => ({
        getSize: () => ({ width: 612, height: 792 }),
        drawImage: jest.fn(),
      }),
      embedPng: jest.fn(async () => {
        throw 'boom';
      }),
      save: jest.fn(),
    } as unknown as PDFDocument);

    const signatures: SignaturePlacement[] = [
      {
        signatureImage,
        coordinates: {
          x: 50,
          y: 50,
          pageNumber: 1,
          pageWidth: 612,
          pageHeight: 792,
        },
      },
    ];

    await expect(applySignatureToPdf(pdfBytes, signatures)).rejects.toThrow(
      'Failed to embed signature image: Unknown error'
    );

    loadSpy.mockRestore();
  });
});

