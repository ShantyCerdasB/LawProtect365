/**
 * @fileoverview Element Handlers Interfaces - Types for element handlers hook
 * @summary Type definitions for element operation handlers
 * @description
 * Defines interfaces used by the reusable element handlers hook that centralizes
 * handlers for element operations (move, delete, resize). These interfaces are
 * platform-agnostic and reusable in both web and mobile.
 */

import { PdfElementType } from '../enums';
import type { PDFCoordinates } from '../types';

/**
 * @description Configuration for the useElementHandlers hook.
 */
export interface UseElementHandlersConfig {
  /** Callback to update signature coordinates */
  updateSignatureCoordinates: (index: number, coordinates: PDFCoordinates) => void;
  /** Callback to update text coordinates */
  updateTextCoordinates: (index: number, coordinates: PDFCoordinates) => void;
  /** Callback to update date coordinates */
  updateDateCoordinates: (index: number, coordinates: PDFCoordinates) => void;
  /** Callback to update text font size */
  updateTextFontSize: (index: number, fontSize: number) => void;
  /** Callback to update date font size */
  updateDateFontSize: (index: number, fontSize: number) => void;
  /** Callback to update signature size */
  updateSignatureSize: (index: number, width: number, height: number) => void;
  /** Callback to remove signature */
  removeSignature: (index: number) => void;
  /** Callback to remove text */
  removeText: (index: number) => void;
  /** Callback to remove date */
  removeDate: (index: number) => void;
}

/**
 * @description Result of the useElementHandlers hook.
 */
export interface UseElementHandlersResult {
  /** Handler for element move operation */
  handleElementMove: (elementType: PdfElementType, index: number, coordinates: PDFCoordinates) => void;
  /** Handler for element delete operation */
  handleElementDelete: (elementType: PdfElementType, index: number) => void;
  /** Handler for text resize operation */
  handleTextResize: (index: number, fontSize: number) => void;
  /** Handler for date resize operation */
  handleDateResize: (index: number, fontSize: number) => void;
  /** Handler for signature resize operation */
  handleSignatureResize: (index: number, width: number, height: number) => void;
}

