/**
 * @fileoverview Calculate Drag Offset - Drag interaction calculation utilities
 * @summary Provides pure functions for calculating drag offsets and element centers
 * @description
 * These functions calculate offsets for drag operations, ensuring the pointer stays
 * visually centered on the element during drag. All functions are pure and platform-agnostic.
 */

import type {
  ElementDisplayBounds,
} from '../types';
import { PdfElementType } from '../enums';
import { getElementDisplayBounds } from './getElementDisplayBounds';
import type {
  DisplayPoint,
  DragOffset,
  CalculatePlacedElementDragOffsetInput,
  CalculatePendingElementDragOffsetInput,
} from '../interfaces';

export type {
  DragOffset,
  CalculatePlacedElementDragOffsetInput,
  CalculatePendingElementDragOffsetInput,
};

/**
 * @description Calculates the center point of an element in display space.
 * @param elementBounds Element bounds in display space.
 * @param elementType Type of element (affects center calculation for text/date).
 * @returns Center point coordinates.
 */
export function calculateElementCenter(
  elementBounds: ElementDisplayBounds,
  elementType: PdfElementType
): DisplayPoint {
  const { x, y, width, height } = elementBounds;

  const centerX = x + width / 2;
  let centerY: number;

  if (elementType === PdfElementType.Signature) {
    centerY = y + height / 2;
  } else {
    centerY = y + height / 2;
  }

  return { x: centerX, y: centerY };
}

/**
 * @description Calculates drag offset for a placed element.
 * @param input Display point, element info, and render metrics.
 * @returns Drag offset from pointer to element center.
 */
export function calculatePlacedElementDragOffset(
  input: CalculatePlacedElementDragOffsetInput
): DragOffset {
  const {
    displayPoint,
    elementType,
    elementIndex,
    pageNumber,
    renderMetrics,
    signatures,
    texts,
    dates,
  } = input;

  const bounds = getElementDisplayBounds({
    elementType,
    index: elementIndex,
    pageNumber,
    renderMetrics,
    signatures,
    texts,
    dates,
  });

  if (!bounds) {
    return { offsetX: 0, offsetY: 0 };
  }

  const center = calculateElementCenter(bounds, elementType);

  return {
    offsetX: displayPoint.x - center.x,
    offsetY: displayPoint.y - center.y,
  };
}

/**
 * @description Calculates drag offset for a pending element.
 * @param input Display point and element bounds.
 * @returns Drag offset from pointer to element center.
 */
export function calculatePendingElementDragOffset(
  input: CalculatePendingElementDragOffsetInput
): DragOffset {
  const { displayPoint, elementBounds, elementType } = input;

  const center = calculateElementCenter(elementBounds, elementType);

  return {
    offsetX: displayPoint.x - center.x,
    offsetY: displayPoint.y - center.y,
  };
}

