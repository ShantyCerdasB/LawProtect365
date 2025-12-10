/**
 * @fileoverview Convert Coordinates - Coordinate system conversion utilities
 * @summary Provides pure functions for converting between PDF and Display coordinate spaces
 * @description
 * These functions handle coordinate conversions between PDF space (PDF points at scale 1.0)
 * and Display space (viewport pixels). All functions are pure and platform-agnostic.
 */

import type { PdfRenderMetrics, PDFCoordinates } from '../types';
import type {
  DisplayPoint,
  ConvertPDFToDisplayInput,
  ConvertDisplayToPDFInput,
} from '../interfaces';

export type { DisplayPoint };

/**
 * @description Converts PDF coordinates to Display Space coordinates.
 * @param input PDF coordinates and render metrics.
 * @returns Display point coordinates.
 */
export function convertPDFToDisplay(
  input: ConvertPDFToDisplayInput
): DisplayPoint {
  const { coordinates, renderMetrics } = input;
  const { pdfPageWidth, pdfPageHeight, viewportWidth, viewportHeight } = renderMetrics;

  const scaleX = viewportWidth / pdfPageWidth;
  const scaleY = viewportHeight / pdfPageHeight;

  return {
    x: coordinates.x * scaleX,
    y: coordinates.y * scaleY,
  };
}

/**
 * @description Converts Display Space coordinates to PDF coordinates.
 * @param input Display point and render metrics.
 * @returns PDF coordinates.
 */
export function convertDisplayToPDF(
  input: ConvertDisplayToPDFInput
): PDFCoordinates {
  const { displayPoint, renderMetrics, pageNumber } = input;
  const { pdfPageWidth, pdfPageHeight, viewportWidth, viewportHeight } = renderMetrics;

  const scaleX = pdfPageWidth / viewportWidth;
  const scaleY = pdfPageHeight / viewportHeight;

  return {
    x: displayPoint.x * scaleX,
    y: displayPoint.y * scaleY,
    pageNumber,
    pageWidth: pdfPageWidth,
    pageHeight: pdfPageHeight,
  };
}

/**
 * @description Calculates scale factors between PDF and Display spaces.
 * @param renderMetrics Render metrics for the current page.
 * @returns Scale factors for X and Y axes.
 */
export function calculateScaleFactors(renderMetrics: PdfRenderMetrics): {
  scaleX: number;
  scaleY: number;
} {
  const { pdfPageWidth, pdfPageHeight, viewportWidth, viewportHeight } = renderMetrics;
  return {
    scaleX: viewportWidth / pdfPageWidth,
    scaleY: viewportHeight / pdfPageHeight,
  };
}

