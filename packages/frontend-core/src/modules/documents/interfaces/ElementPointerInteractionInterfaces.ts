/**
 * @fileoverview Element Pointer Interaction Interfaces - Input/output types for pointer interaction handlers
 * @summary Type definitions for pointer down and move event handling
 * @description Defines interfaces used by pointer interaction use cases.
 */

import type {
  ElementInteractionContext,
  AnyInteractionResult,
} from '../strategies/interfaces';
import type { DisplayPoint } from './CoordinateConversionInterfaces';
import type { PdfElementType } from '../enums';

/**
 * @description Input for handling pointer down events.
 */
export interface HandleElementPointerDownInput {
  /** Interaction context */
  context: ElementInteractionContext;
  /** Display point where pointer was pressed */
  displayPoint: DisplayPoint;
}

/**
 * @description Result of handling pointer down event.
 */
export interface HandleElementPointerDownResult {
  /** Interaction result indicating what action to take */
  result: AnyInteractionResult | null;
  /** Element that was hit (if any) */
  elementHit: { type: PdfElementType; index: number } | null;
  /** Control that was hit (if any) */
  controlHit: { type: string; handle?: string } | null;
  /** Element bounds in display space (if any) */
  elementBounds: { x: number; y: number; width: number; height: number } | null;
}

/**
 * @description Input for handling pointer move events.
 */
export interface HandleElementPointerMoveInput {
  /** Interaction context */
  context: ElementInteractionContext;
  /** Current display point */
  displayPoint: DisplayPoint;
  /** Current resize state (if resizing) */
  resizeState: {
    type: PdfElementType;
    index: number;
    handle: string;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    startFontSize?: number;
  } | null;
  /** Current drag state (if dragging) */
  dragState: {
    type: PdfElementType;
    index: number;
    offsetX: number;
    offsetY: number;
  } | null;
}

