/**
 * @fileoverview Text Placement - Types for text positioning in PDFs
 * @summary Type definitions for text placement data
 * @description Defines types for representing text content and its placement
 * coordinates within PDF documents.
 */

import type { PDFCoordinates } from './PDFCoordinates';

/**
 * @description Complete text placement data including content and coordinates.
 */
export interface TextPlacement {
  /** Text content to be placed */
  text: string;
  /** Coordinates where text should be placed */
  coordinates: PDFCoordinates;
  /** Optional font size (defaults to 12) */
  fontSize?: number;
  /** Optional font color (defaults to black) */
  color?: { r: number; g: number; b: number };
}

