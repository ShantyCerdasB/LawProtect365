/**
 * @fileoverview Document Editing Interfaces - Types for document editing hook
 * @summary Type definitions for document editing hook configuration and results
 * @description
 * Defines interfaces used by the `useDocumentEditing` hook, which manages
 * the state and operations for editing PDF documents with signatures, text, and dates.
 * These interfaces are platform-agnostic and reusable across web and mobile.
 */

import type {
  PDFCoordinates,
  SignaturePlacement,
  TextPlacement,
  DatePlacement,
  PDFSource,
} from '../types';

/**
 * @description Configuration for the useDocumentEditing hook.
 */
export interface UseDocumentEditingConfig {
  /** PDF document as ArrayBuffer, Uint8Array, or base64 string */
  pdfSource: PDFSource;
}

/**
 * @description Result shape returned by the useDocumentEditing hook.
 */
export interface UseDocumentEditingResult {
  /** Array of signature placements */
  signatures: SignaturePlacement[];
  /** Array of text placements */
  texts: TextPlacement[];
  /** Array of date placements */
  dates: DatePlacement[];
  /** Add a new signature placement */
  addSignature: (signatureImage: string, coordinates: PDFCoordinates, width?: number, height?: number) => void;
  /** Add a new text placement */
  addText: (text: string, coordinates: PDFCoordinates, fontSize?: number) => void;
  /** Add a new date placement */
  addDate: (date: Date, coordinates: PDFCoordinates, format?: string, fontSize?: number) => void;
  /** Remove a signature by index */
  removeSignature: (index: number) => void;
  /** Remove a text by index */
  removeText: (index: number) => void;
  /** Remove a date by index */
  removeDate: (index: number) => void;
  /** Update signature coordinates by index */
  updateSignatureCoordinates: (index: number, coordinates: PDFCoordinates) => void;
  /** Update text coordinates by index */
  updateTextCoordinates: (index: number, coordinates: PDFCoordinates) => void;
  /** Update date coordinates by index */
  updateDateCoordinates: (index: number, coordinates: PDFCoordinates) => void;
  /** Update text font size by index */
  updateTextFontSize: (index: number, fontSize: number) => void;
  /** Update date font size by index */
  updateDateFontSize: (index: number, fontSize: number) => void;
  /** Update signature size by index */
  updateSignatureSize: (index: number, width: number, height: number) => void;
  /** Clear all elements */
  clearAll: () => void;
  /** Apply all elements to PDF and return as base64 */
  applyElements: () => Promise<string>;
  /** Apply all elements to PDF and return as Uint8Array */
  applyElementsAsBytes: () => Promise<Uint8Array>;
  /** Whether elements are being applied */
  isApplying: boolean;
  /** Error message if applying elements failed */
  error: string | null;
}

