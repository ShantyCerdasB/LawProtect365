/**
 * @fileoverview Use Document Signing Types - Types for useDocumentSigning hook
 * @summary Type definitions for document signing hook configuration and results
 * @description Defines interfaces for the useDocumentSigning hook configuration
 * and return type to ensure type safety and clear contracts.
 */

import type { SignaturePlacement } from './SignaturePlacement';
import type { PDFCoordinates } from './PDFCoordinates';
import type { PDFSource } from './PDFSource';

/**
 * @description Configuration for the useDocumentSigning hook.
 */
export interface UseDocumentSigningConfig {
  /** PDF document as ArrayBuffer, Uint8Array, or base64 string */
  pdfSource: PDFSource;
}

/**
 * @description Result shape returned by the useDocumentSigning hook.
 */
export interface UseDocumentSigningResult {
  /** Array of signature placements */
  signatures: SignaturePlacement[];
  /** Add a new signature placement */
  addSignature: (signatureImage: string, coordinates: PDFCoordinates) => void;
  /** Remove a signature by index */
  removeSignature: (index: number) => void;
  /** Clear all signatures */
  clearSignatures: () => void;
  /** Apply all signatures to PDF and return as base64 */
  applySignatures: () => Promise<string>;
  /** Whether signatures are being applied */
  isApplying: boolean;
  /** Error message if applying signatures failed */
  error: string | null;
}

