/**
 * @fileoverview Get Element Display Bounds - Calculates element bounds in display space
 * @summary Provides a shared, platform-agnostic helper to calculate element bounds
 * @description
 * Calculates the display-space bounds (x, y, width, height) for a given PDF element
 * (signature, text, or date) based on its PDF coordinates and the current render metrics.
 * This logic is used by both web and mobile viewers to determine element positions
 * for hit-testing, rendering, and interaction.
 */

import type {
  ElementDisplayBounds,
} from '../types';
import { PdfElementType } from '../enums';
import type { GetElementDisplayBoundsInput } from '../interfaces';

export type { GetElementDisplayBoundsInput };

/**
 * @description Calculates element bounds in display space.
 * @param input Input containing element type, index, page number, metrics, and element arrays
 * @returns Element bounds in display space, or null if element not found or not on current page
 */
export function getElementDisplayBounds(
  input: GetElementDisplayBoundsInput
): ElementDisplayBounds | null {
  const {
    elementType,
    index,
    pageNumber,
    renderMetrics,
    signatures,
    texts,
    dates,
  } = input;

  const { pdfPageWidth, pdfPageHeight, viewportWidth, viewportHeight } = renderMetrics;
  const scaleX = viewportWidth / pdfPageWidth;
  const scaleY = viewportHeight / pdfPageHeight;

  if (elementType === PdfElementType.Signature) {
    const sig = signatures[index];
    if (!sig || sig.coordinates.pageNumber !== pageNumber) {
      return null;
    }
    return {
      x: sig.coordinates.x * scaleX,
      y: sig.coordinates.y * scaleY,
      width: (sig.width ?? 150) * scaleX,
      height: (sig.height ?? 60) * scaleY,
    };
  }

  if (elementType === PdfElementType.Text) {
    const text = texts[index];
    if (!text || text.coordinates.pageNumber !== pageNumber) {
      return null;
    }
    const fontSize = (text.fontSize ?? 12) * scaleY;
    return {
      x: text.coordinates.x * scaleX,
      y: text.coordinates.y * scaleY,
      width: text.text.length * fontSize * 0.6,
      height: fontSize,
    };
  }

  const date = dates[index];
  if (!date || date.coordinates.pageNumber !== pageNumber) {
    return null;
  }
  const fontSize = (date.fontSize ?? 12) * scaleY;
  return {
    x: date.coordinates.x * scaleX,
    y: date.coordinates.y * scaleY,
    width: 80 * scaleX,
    height: fontSize,
  };
}

