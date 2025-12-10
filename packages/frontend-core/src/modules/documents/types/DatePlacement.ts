/**
 * @fileoverview Date Placement - Types for date positioning in PDFs
 * @summary Type definitions for date placement data
 * @description Defines types for representing date content and its placement
 * coordinates within PDF documents.
 */

import type { PDFCoordinates } from './PDFCoordinates';

/**
 * @description Complete date placement data including format and coordinates.
 */
export interface DatePlacement {
  /** Date value to be placed */
  date: Date;
  /** Date format string (defaults to 'MM/DD/YYYY') */
  format?: string;
  /** Coordinates where date should be placed */
  coordinates: PDFCoordinates;
  /** Optional font size (defaults to 12) */
  fontSize?: number;
  /** Optional font color (defaults to black) */
  color?: { r: number; g: number; b: number };
}


