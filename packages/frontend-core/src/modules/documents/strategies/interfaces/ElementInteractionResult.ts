/**
 * @fileoverview Strategy Interaction Result - Result types for element interaction strategies
 * @summary Type definitions for strategy interaction results
 * @description
 * Defines the result types returned by element interaction strategies.
 * Strategies return these results to indicate what action should be taken.
 */

import type { PdfElementType, ResizeHandle } from '../../enums';
import type { PDFCoordinates } from '../../types';

/**
 * @description Type of interaction result.
 */
export enum InteractionResultType {
  /** No action needed */
  None = 'none',
  /** Start dragging an element */
  StartDrag = 'startDrag',
  /** Start resizing an element */
  StartResize = 'startResize',
  /** Delete an element */
  Delete = 'delete',
  /** Update element coordinates (during drag) */
  UpdateCoordinates = 'updateCoordinates',
  /** Update element dimensions (during resize) */
  UpdateDimensions = 'updateDimensions',
  /** Update font size (for text/date resize) */
  UpdateFontSize = 'updateFontSize',
}

/**
 * @description Base result from element interaction strategy.
 */
export interface StrategyInteractionResult {
  /** Type of interaction result */
  type: InteractionResultType;
  /** Whether the event should be prevented */
  preventDefault: boolean;
}

/**
 * @description Result for starting a drag operation.
 */
export interface StartDragResult extends StrategyInteractionResult {
  type: InteractionResultType.StartDrag;
  /** Element type being dragged */
  elementType: PdfElementType;
  /** Element index (-1 for pending elements) */
  index: number;
  /** Offset X from pointer to element center */
  offsetX: number;
  /** Offset Y from pointer to element center */
  offsetY: number;
}

/**
 * @description Result for starting a resize operation.
 */
export interface StartResizeResult extends StrategyInteractionResult {
  type: InteractionResultType.StartResize;
  /** Element type being resized */
  elementType: PdfElementType;
  /** Element index (-1 for pending elements) */
  index: number;
  /** Resize handle being used */
  handle: ResizeHandle;
  /** Starting X coordinate of pointer */
  startX: number;
  /** Starting Y coordinate of pointer */
  startY: number;
  /** Starting width in display space */
  startWidth: number;
  /** Starting height in display space */
  startHeight: number;
  /** Starting font size (for text/date) */
  startFontSize?: number;
}

/**
 * @description Result for deleting an element.
 */
export interface DeleteResult extends StrategyInteractionResult {
  type: InteractionResultType.Delete;
  /** Element type being deleted */
  elementType: PdfElementType;
  /** Element index */
  index: number;
}

/**
 * @description Result for updating element coordinates.
 */
export interface UpdateCoordinatesResult extends StrategyInteractionResult {
  type: InteractionResultType.UpdateCoordinates;
  /** Element type */
  elementType: PdfElementType;
  /** Element index */
  index: number;
  /** New coordinates */
  coordinates: PDFCoordinates;
}

/**
 * @description Result for updating element dimensions.
 */
export interface UpdateDimensionsResult extends StrategyInteractionResult {
  type: InteractionResultType.UpdateDimensions;
  /** Element index (-1 for pending) */
  index: number;
  /** New width in PDF space */
  width: number;
  /** New height in PDF space */
  height: number;
  /** New coordinates (if position changed) */
  coordinates?: PDFCoordinates;
}

/**
 * @description Result for updating font size.
 */
export interface UpdateFontSizeResult extends StrategyInteractionResult {
  type: InteractionResultType.UpdateFontSize;
  /** Element type */
  elementType: PdfElementType;
  /** Element index */
  index: number;
  /** New font size */
  fontSize: number;
}

/**
 * @description Union type for all interaction results.
 */
export type AnyInteractionResult =
  | StrategyInteractionResult
  | StartDragResult
  | StartResizeResult
  | DeleteResult
  | UpdateCoordinatesResult
  | UpdateDimensionsResult
  | UpdateFontSizeResult;

