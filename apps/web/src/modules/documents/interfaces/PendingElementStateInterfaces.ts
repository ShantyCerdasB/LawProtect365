/**
 * @fileoverview Pending Element State Interfaces - Types for pending element state hook
 * @summary Type definitions for pending element preview state
 * @description
 * Defines interfaces used by the web-specific pending element state hook that manages
 * preview state of elements before placement. These interfaces are web-specific.
 */

import type { PDFCoordinates } from '@lawprotect/frontend-core';
import { PdfElementType } from '@lawprotect/frontend-core';

/**
 * @description Result of the usePendingElementState hook.
 */
export interface UsePendingElementStateResult {
  /** Pending coordinates, or null */
  pendingCoordinates: PDFCoordinates | null;
  /** Pending signature image data URL, or null */
  pendingSignatureImage: string | null;
  /** Pending signature width */
  pendingSignatureWidth: number;
  /** Pending signature height */
  pendingSignatureHeight: number;
  /** Pending text, or null */
  pendingText: string | null;
  /** Pending text font size */
  pendingTextFontSize: number;
  /** Pending date, or null */
  pendingDate: Date | null;
  /** Pending date format */
  pendingDateFormat: string;
  /** Pending date font size */
  pendingDateFontSize: number;
  /** Sets pending coordinates */
  setPendingCoordinates: (coords: PDFCoordinates | null) => void;
  /** Updates pending signature preview */
  updateSignaturePreview: (signatureImage: string) => void;
  /** Updates pending text preview */
  updateTextPreview: (text: string, fontSize: number) => void;
  /** Updates pending date preview */
  updateDatePreview: (date: Date, format: string, fontSize: number) => void;
  /** Updates pending signature size */
  updateSignatureSize: (width: number, height: number) => void;
  /** Clears all pending state */
  clearPendingState: () => void;
  /** Clears pending state for a specific element type */
  clearPendingElement: (type: PdfElementType) => void;
}

