/**
 * @fileoverview Compute Resized Date Font Size - Calculates new font size for resized date elements
 * @summary Provides a shared, platform-agnostic helper to compute new font size for a date element
 * being resized by dragging a resize handle.
 * @description
 * This use case takes the current resize state (start font size, pointer delta) and calculates
 * the new font size in PDF space. For date elements, resizing changes the font size rather than
 * width/height, making the date larger or smaller while maintaining its aspect ratio.
 */

import type { ComputeResizedDateFontSizeInput } from '../types';

/**
 * @description Default font size limits for date elements.
 */
const DEFAULT_MIN_FONT_SIZE = 8;
const DEFAULT_MAX_FONT_SIZE = 72;

/**
 * @description Computes new font size for a date element after resize.
 * @param input Input containing start font size, pointer delta, and metrics
 * @returns New font size in PDF space (clamped to min/max)
 */
export function computeResizedDateFontSize(
  input: ComputeResizedDateFontSizeInput
): number {
  const {
    startFontSizePDF,
    deltaYDisplay,
    renderMetrics,
    minFontSize = DEFAULT_MIN_FONT_SIZE,
    maxFontSize = DEFAULT_MAX_FONT_SIZE,
  } = input;

  const { pdfPageHeight, viewportHeight } = renderMetrics;
  const scaleY = pdfPageHeight / viewportHeight;

  const fontSizeDelta = deltaYDisplay * scaleY;
  const newFontSize = startFontSizePDF + fontSizeDelta;

  return Math.max(minFontSize, Math.min(maxFontSize, newFontSize));
}

