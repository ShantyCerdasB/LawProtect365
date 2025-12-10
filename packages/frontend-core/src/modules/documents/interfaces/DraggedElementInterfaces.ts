/**
 * @fileoverview Dragged Element Interfaces - Input types for dragged element coordinate calculations
 * @summary Type definitions for dragged element coordinate computations
 * @description Defines interfaces used by dragged element coordinate calculation use cases.
 */

import type {
  PdfRenderMetrics,
  SignaturePlacement,
  TextPlacement,
  DatePlacement,
} from '../types';
import { PdfElementType } from '../enums';

export { PdfElementType };

/**
 * @description Describes an element being dragged.
 */
export interface DraggedElementDescriptor {
  /** Type of the element being dragged */
  type: PdfElementType;
  /** Index of the element within its corresponding array */
  index: number;
}

/**
 * @description Input for computing new coordinates of a dragged element.
 */
export interface ComputeDraggedElementCoordinatesInput {
  /** Descriptor of the element being dragged */
  draggedElement: DraggedElementDescriptor;
  /** New X coordinate of the pointer in display space */
  nextDisplayX: number;
  /** New Y coordinate of the pointer in display space */
  nextDisplayY: number;
  /** Current page number (1-based) */
  currentPage: number;
  /** Render metrics for the current page */
  renderMetrics: PdfRenderMetrics;
  /** Signature placements for the current document */
  signatures: SignaturePlacement[];
  /** Text placements for the current document */
  texts: TextPlacement[];
  /** Date placements for the current document */
  dates: DatePlacement[];
}

