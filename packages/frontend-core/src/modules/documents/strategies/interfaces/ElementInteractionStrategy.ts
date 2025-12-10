/**
 * @fileoverview Element Interaction Strategy Interface - Base interface for element interaction strategies
 * @summary Strategy pattern interface for handling element interactions
 * @description
 * Defines the interface that all element interaction strategies must implement.
 * Each strategy handles interactions for a specific element type (Signature, Text, Date).
 * 
 * This interface is part of the Strategy Pattern implementation, allowing different
 * element types to have their own interaction logic (e.g., drag, resize, delete)
 * while conforming to a common interface.
 */

import type { DisplayPoint } from '../../interfaces';
import type { ElementInteractionContext } from './ElementInteractionContext';
import type { AnyInteractionResult } from './ElementInteractionResult';
import type { PdfElementType } from '../../enums';

/**
 * @description Base interface for element interaction strategies.
 * @description
 * All concrete strategies must implement this interface to handle interactions
 * for their specific element type. The strategy pattern allows for flexible
 * extension and modification of interaction behavior without changing the
 * code that uses these strategies.
 */
export interface ElementInteractionStrategy {
  /**
   * @description Checks if this strategy can handle the given element type.
   * @param elementType Element type to check, can be PdfElementType enum, string literal, or null
   * @returns True if this strategy can handle the element type, false otherwise
   */
  canHandle(elementType: PdfElementType | string | null): boolean;

  /**
   * @description Handles pointer down event for an element.
   * @param context Interaction context containing render metrics, current page, element arrays, and pending state
   * @param displayPoint Display point coordinates where pointer was pressed
   * @param elementHit Element that was hit at the pointer location, or null if no element was hit
   * @param controlHit Control (resize handle or delete button) that was hit, or null if no control was hit
   * @param elementBounds Bounds of the hit element in display space, or null if no element was hit
   * @returns Interaction result indicating what action to take (delete, start resize, start drag), or null if no action needed
   */
  handlePointerDown(
    context: ElementInteractionContext,
    displayPoint: DisplayPoint,
    elementHit: { type: PdfElementType; index: number } | null,
    controlHit: { type: string; handle?: string } | null,
    elementBounds: { x: number; y: number; width: number; height: number } | null
  ): AnyInteractionResult | null;

  /**
   * @description Handles pointer move event for an element during drag or resize operations.
   * @param context Interaction context containing render metrics, current page, and element arrays
   * @param displayPoint Current display point coordinates where pointer is located
   * @param resizeState Current resize state if a resize operation is in progress, null otherwise
   * @param dragState Current drag state if a drag operation is in progress, null otherwise
   * @returns Interaction result indicating dimension, font size, or coordinate updates, or null if no action needed
   */
  handlePointerMove(
    context: ElementInteractionContext,
    displayPoint: DisplayPoint,
    resizeState: {
      type: PdfElementType;
      index: number;
      handle: string;
      startX: number;
      startY: number;
      startWidth: number;
      startHeight: number;
      startFontSize?: number;
    } | null,
    dragState: {
      type: PdfElementType;
      index: number;
      offsetX: number;
      offsetY: number;
    } | null
  ): AnyInteractionResult | null;
}

