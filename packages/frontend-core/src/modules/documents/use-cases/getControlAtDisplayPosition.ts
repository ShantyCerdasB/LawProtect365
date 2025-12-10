/**
 * @fileoverview Get Control At Display Position - Hit-testing for interactive PDF element controls
 * @summary Determines if a display-space point is over a resize handle or delete button
 * @description
 * Provides a shared, platform-agnostic helper to detect if a pointer position is over
 * an interactive control (resize handle or delete button) on a PDF element. This logic
 * is used by both web and mobile viewers to support resize and delete interactions.
 */

import type {
  PdfControlHit,
  ElementDisplayBounds,
} from '../types';
import { ResizeHandle, PdfElementType, ControlType } from '../enums';
import type { ControlHitTestConfig } from '../interfaces';
import { DEFAULT_CONTROL_HIT_TEST_CONFIG } from '../interfaces';

/**
 * @description Checks if a point is within a rectangular area.
 * @param x Point X coordinate
 * @param y Point Y coordinate
 * @param rectX Rectangle X coordinate
 * @param rectY Rectangle Y coordinate
 * @param rectWidth Rectangle width
 * @param rectHeight Rectangle height
 * @returns True if point is within rectangle
 */
function isPointInRect(
  x: number,
  y: number,
  rectX: number,
  rectY: number,
  rectWidth: number,
  rectHeight: number
): boolean {
  return x >= rectX && x <= rectX + rectWidth && y >= rectY && y <= rectY + rectHeight;
}

/**
 * @description Calculates which control (if any) is under the given display-space point.
 * @param displayX X coordinate in display space
 * @param displayY Y coordinate in display space
 * @param bounds Element bounds in display space
 * @param elementType Type of element (PdfElementType enum)
 * @param config Optional configuration for handle and delete button sizes
 * @returns Control hit information when a control is found, or null when nothing is hit
 */
export function getControlAtDisplayPosition(
  displayX: number,
  displayY: number,
  bounds: ElementDisplayBounds,
  elementType: PdfElementType,
  config: Partial<ControlHitTestConfig> = {}
): PdfControlHit | null {
  const { handleSize, deleteSize } = { ...DEFAULT_CONTROL_HIT_TEST_CONFIG, ...config };
  const { x, y, width, height } = bounds;

  let deleteX = 0;
  let deleteY = 0;

  if (elementType === PdfElementType.Signature) {
    deleteX = x + width - deleteSize;
    deleteY = y;
  } else {
    deleteX = x + width - deleteSize;
    deleteY = y - height;
  }

  if (isPointInRect(displayX, displayY, deleteX, deleteY, deleteSize, deleteSize)) {
    return { type: ControlType.Delete };
  }

  let handleBounds: Array<{ handle: ResizeHandle; x: number; y: number }> = [];

  if (elementType === PdfElementType.Signature) {
    handleBounds = [
      { handle: ResizeHandle.Southeast, x: x + width - handleSize, y: y + height - handleSize },
      { handle: ResizeHandle.Southwest, x: x, y: y + height - handleSize },
      { handle: ResizeHandle.Northeast, x: x + width - handleSize, y: y },
      { handle: ResizeHandle.Northwest, x: x, y: y },
    ];
  } else {
    const topY = y - height;
    handleBounds = [
      { handle: ResizeHandle.Southeast, x: x + width - handleSize, y: y - handleSize },
      { handle: ResizeHandle.Southwest, x: x, y: y - handleSize },
      { handle: ResizeHandle.Northeast, x: x + width - handleSize, y: topY },
      { handle: ResizeHandle.Northwest, x: x, y: topY },
    ];
  }

  for (const { handle, x: handleX, y: handleY } of handleBounds) {
    if (isPointInRect(displayX, displayY, handleX, handleY, handleSize, handleSize)) {
      return { type: ControlType.Resize, handle };
    }
  }

  return null;
}

