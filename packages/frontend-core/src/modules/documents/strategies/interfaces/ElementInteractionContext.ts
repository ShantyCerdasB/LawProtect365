/**
 * @fileoverview Element Interaction Context - Context for element interaction strategies
 * @summary Type definitions for element interaction context
 * @description
 * Defines the context object passed to element interaction strategies.
 * Contains all necessary data for strategies to make decisions and perform calculations.
 */

import type {
  PdfRenderMetrics,
  SignaturePlacement,
  TextPlacement,
  DatePlacement,
  PdfElementHit,
  PdfControlHit,
  ElementDisplayBounds,
  PDFCoordinates,
} from '../../types';
import type { AllElements } from '../../interfaces';

/**
 * @description Context for element interaction strategies.
 */
export interface ElementInteractionContext {
  /** Current page number (1-based) */
  currentPage: number;
  /** Render metrics for the current page */
  renderMetrics: PdfRenderMetrics;
  /** Signature placements */
  signatures: SignaturePlacement[];
  /** Text placements */
  texts: TextPlacement[];
  /** Date placements */
  dates: DatePlacement[];
  /** All elements grouped */
  elements: AllElements;
  /** Pending coordinates (if placing new element) */
  pendingCoordinates: PDFCoordinates | null;
  /** Pending element type */
  pendingElementType: string | null;
  /** Pending signature width */
  pendingSignatureWidth: number;
  /** Pending signature height */
  pendingSignatureHeight: number;
}

