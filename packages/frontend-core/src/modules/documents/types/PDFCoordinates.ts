/**
 * @fileoverview PDF Coordinates - Types for PDF coordinate system
 * @summary Type definitions for PDF page coordinates and dimensions
 * @description Defines types for representing coordinates and dimensions within PDF pages,
 * used for signature placement and other annotations.
 */

/**
 * @description Coordinates of a point on a PDF page.
 */
export interface PDFCoordinates {
  /** X coordinate relative to the page (in PDF points) */
  x: number;
  /** Y coordinate relative to the page (in PDF points) */
  y: number;
  /** Page number (1-indexed) */
  pageNumber: number;
  /** Width of the rendered page (in pixels or points) */
  pageWidth: number;
  /** Height of the rendered page (in pixels or points) */
  pageHeight: number;
}

