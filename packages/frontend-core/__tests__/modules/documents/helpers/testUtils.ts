/**
 * @file Test Utilities for documents module
 * @summary Shared helpers used across document tests
 */

import { PDFDocument, rgb } from 'pdf-lib';

/**
 * Creates a simple one-page PDF (US Letter size) with a title.
 */
export async function createTestPdf(): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]);
  page.drawText('Test Document', {
    x: 50,
    y: 750,
    size: 12,
    color: rgb(0, 0, 0),
  });
  return pdfDoc.save();
}

/**
 * Creates a multi-page PDF (3 pages).
 */
export async function createMultiPagePdf(): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  for (let i = 0; i < 3; i++) {
    const page = pdfDoc.addPage([612, 792]);
    page.drawText(`Page ${i + 1}`, {
      x: 50,
      y: 750,
      size: 12,
      color: rgb(0, 0, 0),
    });
  }
  return pdfDoc.save();
}

/**
 * Creates a minimal valid PNG (1x1) as base64 data URL.
 */
export function createTestSignatureImage(): string {
  const pngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  return `data:image/png;base64,${pngBase64}`;
}

/**
 * Converts bytes to base64 string.
 */
export function createBase64FromBytes(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}


