/**
 * @fileoverview Compute Resized Signature Dimensions - Calculates new dimensions for resized signatures
 * @summary Provides a shared, platform-agnostic helper to compute new width, height, and coordinates
 * for a signature being resized by dragging a resize handle.
 * @description
 * This use case takes the current resize state (handle position, start dimensions, pointer delta)
 * and calculates the new signature dimensions in PDF space. It handles all four resize handles
 * (southeast, southwest, northeast, northwest) and adjusts the element's position when necessary
 * to maintain the correct anchor point.
 */

import type {
  ComputeResizedSignatureDimensionsInput,
  ResizedSignatureDimensions,
} from '../types';
import { ResizeHandle } from '../enums';

/**
 * @description Default minimum dimensions for signatures in PDF space.
 */
const DEFAULT_MIN_WIDTH_PDF = 50;
const DEFAULT_MIN_HEIGHT_PDF = 20;

/**
 * @description Computes new signature dimensions and position after resize.
 * @param input Input containing resize handle, start dimensions, deltas, and metrics
 * @returns New dimensions and coordinates in PDF space
 */
export function computeResizedSignatureDimensions(
  input: ComputeResizedSignatureDimensionsInput
): ResizedSignatureDimensions {
  const {
    handle,
    startWidthDisplay,
    startHeightDisplay,
    startXPDF,
    startYPDF,
    deltaXDisplay,
    deltaYDisplay,
    renderMetrics,
    minWidthPDF = DEFAULT_MIN_WIDTH_PDF,
    minHeightPDF = DEFAULT_MIN_HEIGHT_PDF,
  } = input;

  const { pdfPageWidth, pdfPageHeight, viewportWidth, viewportHeight } = renderMetrics;

  const scaleX = pdfPageWidth / viewportWidth;
  const scaleY = pdfPageHeight / viewportHeight;

  const startWidthPDF = startWidthDisplay * scaleX;
  const startHeightPDF = startHeightDisplay * scaleY;
  const deltaXPDF = deltaXDisplay * scaleX;
  const deltaYPDF = deltaYDisplay * scaleY;

  let newWidthPDF = startWidthPDF;
  let newHeightPDF = startHeightPDF;
  let newXPDF = startXPDF;
  let newYPDF = startYPDF;

  if (handle === ResizeHandle.Southeast) {
    newWidthPDF = Math.max(minWidthPDF, startWidthPDF + deltaXPDF);
    newHeightPDF = Math.max(minHeightPDF, startHeightPDF + deltaYPDF);
  } else if (handle === ResizeHandle.Southwest) {
    newWidthPDF = Math.max(minWidthPDF, startWidthPDF - deltaXPDF);
    newHeightPDF = Math.max(minHeightPDF, startHeightPDF + deltaYPDF);
    const widthDelta = startWidthPDF - newWidthPDF;
    newXPDF = startXPDF + widthDelta;
  } else if (handle === ResizeHandle.Northeast) {
    newWidthPDF = Math.max(minWidthPDF, startWidthPDF + deltaXPDF);
    newHeightPDF = Math.max(minHeightPDF, startHeightPDF - deltaYPDF);
    const heightDelta = startHeightPDF - newHeightPDF;
    newYPDF = startYPDF + heightDelta;
  } else if (handle === ResizeHandle.Northwest) {
    newWidthPDF = Math.max(minWidthPDF, startWidthPDF - deltaXPDF);
    newHeightPDF = Math.max(minHeightPDF, startHeightPDF - deltaYPDF);
    const widthDelta = startWidthPDF - newWidthPDF;
    const heightDelta = startHeightPDF - newHeightPDF;
    newXPDF = startXPDF + widthDelta;
    newYPDF = startYPDF + heightDelta;
  }

  return {
    widthPDF: newWidthPDF,
    heightPDF: newHeightPDF,
    xPDF: newXPDF,
    yPDF: newYPDF,
  };
}

