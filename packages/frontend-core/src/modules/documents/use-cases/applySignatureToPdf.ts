/**
 * @fileoverview Apply Signature to PDF - Use case for embedding signatures in PDFs
 * @summary Pure function to apply signature images to PDF documents
 * @description
 * This use case handles the business logic of applying signature images to PDF documents
 * at specified coordinates. It uses pdf-lib to embed PNG images into PDF pages.
 * This is a pure function with no side effects, making it easily testable and reusable.
 */

import { PDFDocument } from 'pdf-lib';
import type { SignaturePlacement } from '../types';

/**
 * @description Applies signature images to a PDF document at specified coordinates.
 * @param pdfBytes PDF document as Uint8Array
 * @param signatures Array of signature placements with coordinates and images
 * @returns Promise resolving to signed PDF as Uint8Array
 * @throws Error if PDF cannot be loaded or signatures cannot be applied
 *
 * @example
 * ```typescript
 * const pdfBytes = await file.arrayBuffer();
 * const signedPdf = await applySignatureToPdf(
 *   new Uint8Array(pdfBytes),
 *   [
 *     {
 *       signatureImage: 'data:image/png;base64,...',
 *       coordinates: { x: 100, y: 200, pageNumber: 1, pageWidth: 612, pageHeight: 792 }
 *     }
 *   ]
 * );
 * ```
 */
export async function applySignatureToPdf(
  pdfBytes: Uint8Array,
  signatures: SignaturePlacement[]
): Promise<Uint8Array> {
  if (signatures.length === 0) {
    throw new Error('At least one signature is required');
  }

  // Load PDF document
  const pdfDoc = await PDFDocument.load(pdfBytes);

  // Process each signature
  for (const { signatureImage, coordinates, width = 150, height = 60 } of signatures) {
    const page = pdfDoc.getPage(coordinates.pageNumber - 1); // pdf-lib uses 0-indexed pages

    // Extract base64 image data
    const base64Data = signatureImage.includes(',') ? signatureImage.split(',')[1] : signatureImage;
    if (!base64Data) {
      throw new Error(`Invalid signature image format for signature on page ${coordinates.pageNumber}`);
    }

    // Convert base64 to Uint8Array
    const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    // Embed PNG image
    let signatureImageObj;
    try {
      signatureImageObj = await pdfDoc.embedPng(imageBytes);
    } catch (error) {
      throw new Error(`Failed to embed signature image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Calculate signature dimensions (maintain aspect ratio)
    const imageDims = signatureImageObj.scale(width / signatureImageObj.width);
    const finalWidth = Math.min(imageDims.width, width);
    const finalHeight = Math.min(imageDims.height, height);

    // Get page dimensions
    const { width: pageWidth, height: pageHeight } = page.getSize();

    // Convert coordinates from canvas scale to PDF points
    // If coordinates are from a scaled canvas (e.g., pdfjs-dist at 1.5x), adjust accordingly
    // For now, assume coordinates are already in PDF points or need simple scaling
    const scaleX = pageWidth / coordinates.pageWidth;
    const scaleY = pageHeight / coordinates.pageHeight;

    const pdfX = coordinates.x * scaleX;
    // PDF coordinate system has origin at bottom-left, so invert Y
    const pdfY = pageHeight - (coordinates.y * scaleY) - finalHeight;

    // Embed signature image
    page.drawImage(signatureImageObj, {
      x: pdfX,
      y: pdfY,
      width: finalWidth,
      height: finalHeight,
    });
  }

  // Save PDF and return as Uint8Array
  return await pdfDoc.save();
}

