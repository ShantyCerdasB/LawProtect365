/**
 * @fileoverview Hit Test Element - Helper for testing if a point hits an element
 * @summary Determines if a point in PDF space intersects with an element's bounding box
 * @description
 * Provides hit-testing logic for different element types. Handles the coordinate
 * system differences between signatures (normal bounds) and text/date elements
 * (baseline-based bounds where Y represents the top of the text).
 */

import type { SignaturePlacement, TextPlacement, DatePlacement } from '../../types';
import { PdfElementType } from '../../enums';
import type { ElementBounds } from '../../interfaces';
import { getElementBounds } from './getElementBounds';

/**
 * @description Tests if a point in PDF space hits a signature element.
 * @param bounds Bounding box of the signature
 * @param pdfX X coordinate in PDF space
 * @param pdfY Y coordinate in PDF space
 * @returns True if the point is within the signature bounds
 */
function hitTestSignature(bounds: ElementBounds, pdfX: number, pdfY: number): boolean {
  const { x, y, width, height } = bounds;
  return pdfX >= x && pdfX <= x + width && pdfY >= y && pdfY <= y + height;
}

/**
 * @description Tests if a point in PDF space hits a text or date element.
 * @param bounds Bounding box of the text/date element
 * @param pdfX X coordinate in PDF space
 * @param pdfY Y coordinate in PDF space
 * @returns True if the point is within the element bounds
 * @description
 * Text and date elements use baseline-based coordinates where Y represents
 * the baseline (bottom of the text). The bounding box extends from
 * (x, y - height) to (x + width, y).
 */
function hitTestTextLike(bounds: ElementBounds, pdfX: number, pdfY: number): boolean {
  const { x, y, width, height } = bounds;
  return pdfX >= x && pdfX <= x + width && pdfY >= y - height && pdfY <= y;
}

/**
 * @description Tests if a point in PDF space hits an element.
 * @param element Element placement data (signature, text, or date)
 * @param elementType Type of element
 * @param pdfX X coordinate in PDF space
 * @param pdfY Y coordinate in PDF space
 * @returns True if the point is within the element bounds
 */
export function hitTestElement(
  element: SignaturePlacement | TextPlacement | DatePlacement,
  elementType: PdfElementType,
  pdfX: number,
  pdfY: number
): boolean {
  const bounds = getElementBounds(element, elementType);

  switch (elementType) {
    case PdfElementType.Signature:
      return hitTestSignature(bounds, pdfX, pdfY);
    case PdfElementType.Text:
    case PdfElementType.Date:
      return hitTestTextLike(bounds, pdfX, pdfY);
    default:
      return false;
  }
}

