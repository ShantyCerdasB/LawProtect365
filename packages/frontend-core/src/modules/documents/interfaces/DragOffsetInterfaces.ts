/**
 * @fileoverview Drag Offset Interfaces - Input/output types for drag offset calculations
 * @summary Type definitions for drag interaction calculations
 * @description Defines interfaces used by drag offset calculation use cases.
 */

import type {
  PdfRenderMetrics,
  SignaturePlacement,
  TextPlacement,
  DatePlacement,
  ElementDisplayBounds,
} from '../types';
import { PdfElementType } from '../enums';
import type { DisplayPoint } from './CoordinateConversionInterfaces';

export type { DisplayPoint };
export { PdfElementType };

/**
 * @description Offset from pointer to element center.
 */
export interface DragOffset {
  /** X offset from pointer to element center. */
  offsetX: number;
  /** Y offset from pointer to element center. */
  offsetY: number;
}

/**
 * @description Input for calculating drag offset for a placed element.
 */
export interface CalculatePlacedElementDragOffsetInput {
  /** Display point where pointer is. */
  displayPoint: DisplayPoint;
  /** Type of element being dragged. */
  elementType: PdfElementType;
  /** Index of element in its array. */
  elementIndex: number;
  /** Current page number (1-based). */
  pageNumber: number;
  /** Render metrics for the current page. */
  renderMetrics: PdfRenderMetrics;
  /** Signature placements. */
  signatures: SignaturePlacement[];
  /** Text placements. */
  texts: TextPlacement[];
  /** Date placements. */
  dates: DatePlacement[];
}

/**
 * @description Input for calculating drag offset for a pending element.
 */
export interface CalculatePendingElementDragOffsetInput {
  /** Display point where pointer is. */
  displayPoint: DisplayPoint;
  /** Element bounds in display space. */
  elementBounds: ElementDisplayBounds;
  /** Type of element. */
  elementType: PdfElementType;
}

