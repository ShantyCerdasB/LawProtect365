/**
 * @fileoverview PDF Viewer Types - Types for web PDF viewer component
 * @summary Type definitions for PDF viewer component props
 * @description Defines interfaces for the web-specific PDF viewer component
 * used for rendering PDF documents in the browser.
 */

import type {
  PDFCoordinates,
  PDFSource,
  SignaturePlacement,
  TextPlacement,
  DatePlacement,
} from '@lawprotect/frontend-core';
import { PdfElementType } from '@lawprotect/frontend-core';

/**
 * @description Props for the PDFViewer component.
 */
export interface PDFViewerProps {
  /** PDF file as ArrayBuffer, Uint8Array, or base64 string */
  pdfSource: PDFSource;
  /** Callback when user clicks on a page (coordinates and click event) */
  onPageClick?: (coordinates: PDFCoordinates, clickEvent: { clientX: number; clientY: number }) => void;
  /** Optional class name for styling */
  className?: string;
  /** Signatures to display as preview */
  signatures?: SignaturePlacement[];
  /** Text elements to display as preview */
  texts?: TextPlacement[];
  /** Date elements to display as preview */
  dates?: DatePlacement[];
  /** Pending element coordinates (shown as preview before confirmation) */
  pendingCoordinates?: PDFCoordinates | null;
  /** Type of pending element */
  pendingElementType?: PdfElementType | null;
  /** Pending signature image (for preview) */
  pendingSignatureImage?: string | null;
  /** Pending signature width (for preview) */
  pendingSignatureWidth?: number;
  /** Pending signature height (for preview) */
  pendingSignatureHeight?: number;
  /** Callback when signature size is changed (for resize) */
  onSignatureResize?: (index: number, width: number, height: number) => void;
  /** Callback when text size is changed (for resize) */
  onTextResize?: (index: number, fontSize: number) => void;
  /** Callback when date size is changed (for resize) */
  onDateResize?: (index: number, fontSize: number) => void;
  /** Pending text (for preview) */
  pendingText?: string | null;
  /** Pending text font size */
  pendingTextFontSize?: number;
  /** Pending date (for preview) */
  pendingDate?: Date | null;
  /** Pending date format */
  pendingDateFormat?: string;
  /** Pending date font size */
  pendingDateFontSize?: number;
  /** Callback when element is moved (elementType, index, newCoordinates) */
  onElementMove?: (
    elementType: PdfElementType,
    index: number,
    coordinates: PDFCoordinates
  ) => void;
  /** Callback when an element is deleted via the close button */
  onElementDelete?: (
    elementType: PdfElementType,
    index: number
  ) => void;
}

