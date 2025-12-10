/**
 * @fileoverview Element Bounds Interfaces - Input types for element bounds calculations
 * @summary Type definitions for element display bounds calculations
 * @description Defines interfaces used by element bounds calculation use cases.
 */

import type {
  PdfRenderMetrics,
  SignaturePlacement,
  TextPlacement,
  DatePlacement,
} from '../types';

/**
 * @description Input for calculating element display bounds.
 */
export interface GetElementDisplayBoundsInput {
  /** Type of element */
  elementType: 'signature' | 'text' | 'date';
  /** Index of the element within its corresponding array */
  index: number;
  /** Current page number (1-based) */
  pageNumber: number;
  /** Render metrics for coordinate conversion */
  renderMetrics: PdfRenderMetrics;
  /** Signature placements for the current document */
  signatures: SignaturePlacement[];
  /** Text placements for the current document */
  texts: TextPlacement[];
  /** Date placements for the current document */
  dates: DatePlacement[];
}

