/**
 * @fileoverview Apply Elements to PDF - Use case for embedding signatures, text, and dates in PDFs
 * @summary Pure function to apply various elements to PDF documents
 * @description
 * This use case handles the business logic of applying signature images, text, and dates
 * to PDF documents at specified coordinates. It uses pdf-lib to embed these elements into PDF pages.
 * This is a pure function with no side effects, making it easily testable and reusable.
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { SignaturePlacement } from '../types/SignaturePlacement';
import type { TextPlacement } from '../types/TextPlacement';
import type { DatePlacement } from '../types/DatePlacement';

/**
 * @description Applies signatures, text, and dates to a PDF document at specified coordinates.
 * @param pdfBytes PDF document as Uint8Array
 * @param signatures Array of signature placements (optional)
 * @param texts Array of text placements (optional)
 * @param dates Array of date placements (optional)
 * @returns Promise resolving to modified PDF as Uint8Array
 * @throws Error if PDF cannot be loaded or elements cannot be applied
 *
 * @example
 * ```typescript
 * const pdfBytes = await file.arrayBuffer();
 * const modifiedPdf = await applyElementsToPdf(
 *   new Uint8Array(pdfBytes),
 *   [{ signatureImage: 'data:image/png;base64,...', coordinates: {...} }],
 *   [{ text: 'John Doe', coordinates: {...} }],
 *   [{ date: new Date(), coordinates: {...} }]
 * );
 * ```
 */
export async function applyElementsToPdf(
  pdfBytes: Uint8Array,
  signatures: SignaturePlacement[] = [],
  texts: TextPlacement[] = [],
  dates: DatePlacement[] = []
): Promise<Uint8Array> {
  // Load PDF document
  const pdfDoc = await PDFDocument.load(pdfBytes);

  // Load standard font for text and dates
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Process signatures
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

  // Process text elements
  for (const { text, coordinates, fontSize = 12, color } of texts) {
    const page = pdfDoc.getPage(coordinates.pageNumber - 1);

    // Get page dimensions
    const { width: pageWidth, height: pageHeight } = page.getSize();

    // Convert coordinates from canvas scale to PDF points
    const scaleX = pageWidth / coordinates.pageWidth;
    const scaleY = pageHeight / coordinates.pageHeight;

    const pdfX = coordinates.x * scaleX;
    // PDF coordinate system has origin at bottom-left, so invert Y
    const pdfY = pageHeight - (coordinates.y * scaleY);

    // Draw text
    const textColor = color ? rgb(color.r, color.g, color.b) : rgb(0, 0, 0);
    page.drawText(text, {
      x: pdfX,
      y: pdfY,
      size: fontSize,
      font: helveticaFont,
      color: textColor,
    });
  }

  // Process date elements
  for (const { date, format = 'MM/DD/YYYY', coordinates, fontSize = 12, color } of dates) {
    const page = pdfDoc.getPage(coordinates.pageNumber - 1);

    // Format date
    const formattedDate = formatDate(date, format);

    // Get page dimensions
    const { width: pageWidth, height: pageHeight } = page.getSize();

    // Convert coordinates from canvas scale to PDF points
    const scaleX = pageWidth / coordinates.pageWidth;
    const scaleY = pageHeight / coordinates.pageHeight;

    const pdfX = coordinates.x * scaleX;
    // PDF coordinate system has origin at bottom-left, so invert Y
    const pdfY = pageHeight - (coordinates.y * scaleY);

    // Draw date text
    const dateColor = color ? rgb(color.r, color.g, color.b) : rgb(0, 0, 0);
    page.drawText(formattedDate, {
      x: pdfX,
      y: pdfY,
      size: fontSize,
      font: helveticaFont,
      color: dateColor,
    });
  }

  // Save PDF and return as Uint8Array
  return await pdfDoc.save();
}

/**
 * @description Formats a date according to the specified format string.
 * @param date Date to format
 * @param format Format string (MM/DD/YYYY, DD/MM/YYYY, etc.)
 * @returns Formatted date string
 */
function formatDate(date: Date, format: string): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();

  return format
    .replace('MM', month)
    .replace('DD', day)
    .replace('YYYY', year.toString())
    .replace('YY', year.toString().slice(-2));
}

