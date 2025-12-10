/**
 * @fileoverview Coordinate Conversion Interfaces - Input/output types for coordinate conversions
 * @summary Type definitions for PDF and Display coordinate system conversions
 * @description Defines interfaces used by coordinate conversion use cases.
 */

import type { PdfRenderMetrics, PDFCoordinates } from '../types';

/**
 * @description A point in Display Space (viewport coordinates).
 */
export interface DisplayPoint {
  /** X coordinate in display space. */
  x: number;
  /** Y coordinate in display space. */
  y: number;
}

/**
 * @description Input for converting PDF coordinates to Display coordinates.
 */
export interface ConvertPDFToDisplayInput {
  /** PDF coordinates to convert. */
  coordinates: PDFCoordinates;
  /** Render metrics for the current page. */
  renderMetrics: PdfRenderMetrics;
}

/**
 * @description Input for converting Display coordinates to PDF coordinates.
 */
export interface ConvertDisplayToPDFInput {
  /** Display point to convert. */
  displayPoint: DisplayPoint;
  /** Render metrics for the current page. */
  renderMetrics: PdfRenderMetrics;
  /** Current page number (1-based). */
  pageNumber: number;
}

