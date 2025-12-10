/**
 * @fileoverview PDF Element Overlay Interfaces - Types for web PDF element overlay rendering
 * @summary Type definitions for element overlay rendering on HTML canvas
 * @description
 * Defines interfaces used by the web-specific PDF element overlay hook that draws
 * interactive elements (signatures, texts, dates) on HTML canvas. These interfaces
 * are web-specific and not reusable for mobile.
 */

import type {
  SignaturePlacement,
  TextPlacement,
  DatePlacement,
} from '@lawprotect/frontend-core';
import { PdfElementType } from '@lawprotect/frontend-core';
import type { PdfPageRenderMetrics } from './PdfPageRendererInterfaces';

/**
 * @description Configuration for PDF element overlay.
 */
export interface UsePdfElementOverlayConfig {
  /** Current page canvas (rendered PDF) */
  currentPageCanvas: HTMLCanvasElement | null;
  /** Display canvas (for overlays) */
  displayCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** Render metrics */
  renderMetrics: PdfPageRenderMetrics | null;
  /** Current page number */
  currentPage: number;
  /** Signature placements */
  signatures: SignaturePlacement[];
  /** Text placements */
  texts: TextPlacement[];
  /** Date placements */
  dates: DatePlacement[];
  /** Pending coordinates */
  pendingCoordinates: { x: number; y: number; pageNumber: number } | null;
  /** Pending element type */
  pendingElementType: PdfElementType | null;
  /** Pending signature image */
  pendingSignatureImage: string | null;
  /** Pending signature width */
  pendingSignatureWidth: number;
  /** Pending signature height */
  pendingSignatureHeight: number;
  /** Pending text */
  pendingText: string | null;
  /** Pending text font size */
  pendingTextFontSize: number;
  /** Pending date */
  pendingDate: Date | null;
  /** Pending date format */
  pendingDateFormat: string;
  /** Pending date font size */
  pendingDateFontSize: number;
  /** Currently dragged element */
  draggedElement: { type: PdfElementType; index: number } | null;
  /** Currently resized element */
  resizeHandle: { type: PdfElementType; index: number } | null;
  /** Callback for element delete */
  onElementDelete?: (elementType: PdfElementType, index: number) => void;
  /** Callback for signature resize */
  onSignatureResize?: (index: number, width: number, height: number) => void;
  /** Render key to force redraw */
  renderKey: number;
}

