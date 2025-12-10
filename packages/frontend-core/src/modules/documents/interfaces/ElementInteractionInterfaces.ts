/**
 * @fileoverview Element Interaction Interfaces - Input/output types for element interaction detection
 * @summary Type definitions for element hit-testing and interaction detection
 * @description Defines interfaces used by element interaction detection use cases.
 */

import type {
  PdfRenderMetrics,
  SignaturePlacement,
  TextPlacement,
  DatePlacement,
  PdfElementHit,
  PdfControlHit,
  ElementDisplayBounds,
} from '../types';
import { PdfElementType } from '../enums';
import type { DisplayPoint } from './CoordinateConversionInterfaces';

export { PdfElementType };

/**
 * @description All elements grouped by type.
 */
export interface AllElements {
  /** Signature placements. */
  signatures: SignaturePlacement[];
  /** Text placements. */
  texts: TextPlacement[];
  /** Date placements. */
  dates: DatePlacement[];
}

/**
 * @description Input for detecting an element at a display point.
 */
export interface DetectElementAtPointInput {
  /** Display point to test. */
  displayPoint: DisplayPoint;
  /** Current page number (1-based). */
  pageNumber: number;
  /** Render metrics for the current page. */
  renderMetrics: PdfRenderMetrics;
  /** All elements to search. */
  elements: AllElements;
}

/**
 * @description Input for detecting a control (resize handle or delete button) at a display point.
 */
export interface DetectControlAtPointInput {
  /** Display point to test. */
  displayPoint: DisplayPoint;
  /** Current page number (1-based). */
  pageNumber: number;
  /** Render metrics for the current page. */
  renderMetrics: PdfRenderMetrics;
  /** All elements to search. */
  elements: AllElements;
}

/**
 * @description Result of detecting an element interaction.
 */
export interface ElementInteractionResult {
  /** The element that was hit, or null. */
  elementHit: PdfElementHit | null;
  /** The control that was hit (resize handle or delete button), or null. */
  controlHit: PdfControlHit | null;
  /** The element's display bounds, if found. */
  elementBounds: ElementDisplayBounds | null;
}

