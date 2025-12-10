/**
 * @fileoverview Signature Placement - Types for signature positioning
 * @summary Type definitions for signature placement data
 * @description Defines types for representing signature images and their placement
 * coordinates within PDF documents.
 */

import type { PDFCoordinates } from './PDFCoordinates';

/**
 * @description Complete signature placement data including image and coordinates.
 */
export interface SignaturePlacement {
  /** Signature image as base64 data URL (PNG format) */
  signatureImage: string;
  /** Coordinates where signature should be placed */
  coordinates: PDFCoordinates;
  /** Optional width for the signature (defaults to 150) */
  width?: number;
  /** Optional height for the signature (defaults to 60) */
  height?: number;
}

