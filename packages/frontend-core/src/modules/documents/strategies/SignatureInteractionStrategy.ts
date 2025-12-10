/**
 * @fileoverview Signature Interaction Strategy - Strategy for handling signature element interactions
 * @summary Handles drag, resize, and delete interactions for signature elements
 * @description
 * Implements the ElementInteractionStrategy interface for signature elements in PDF documents.
 * This strategy handles all user interactions with signature elements including:
 * - Deleting signatures via delete control
 * - Resizing signatures via resize handles (for both pending and placed signatures)
 * - Dragging signatures to reposition them (for both pending and placed signatures)
 * 
 * The strategy separates concerns by delegating specific interaction types to private methods,
 * keeping the main handlePointerDown method simple and maintainable. This reduces cognitive
 * complexity and improves code readability.
 * 
 * Supports both pending signatures (not yet placed on the PDF) and placed signatures
 * (already added to the document).
 */

import type { ElementInteractionStrategy } from './interfaces';
import type {
  ElementInteractionContext,
  AnyInteractionResult,
  StartDragResult,
  StartResizeResult,
  UpdateDimensionsResult,
  UpdateCoordinatesResult,
} from './interfaces';
import { InteractionResultType } from './interfaces/ElementInteractionResult';
import type { DisplayPoint } from '../interfaces';
import { PdfElementType, ResizeHandle, ControlType } from '../enums';
import { calculatePlacedElementDragOffset, calculatePendingElementDragOffset } from '../use-cases/calculateDragOffset';
import { computeResizedSignatureDimensions } from '../use-cases/computeResizedSignatureDimensions';
import { computeDraggedElementCoordinates } from '../use-cases/computeDraggedElementCoordinates';
import { calculateScaleFactors } from '../use-cases/convertCoordinates';
import { getControlAtDisplayPosition } from '../use-cases/getControlAtDisplayPosition';

/**
 * @description Strategy for handling signature element interactions.
 */
export class SignatureInteractionStrategy implements ElementInteractionStrategy {
  /**
   * @description Checks if this strategy can handle a given element type.
   * @param elementType Element type to check, can be PdfElementType enum, string literal, or null
   * @returns True if element type is Signature (enum or string), false otherwise
   */
  canHandle(elementType: PdfElementType | string | null): boolean {
    return elementType === PdfElementType.Signature || elementType === 'signature';
  }

  /**
   * @description Handles pointer down event for signature elements.
   * @param context Interaction context containing render metrics, current page, element arrays, and pending state
   * @param displayPoint Display point coordinates where pointer was pressed
   * @param elementHit Element that was hit at the pointer location, or null if no element was hit
   * @param controlHit Control (resize handle or delete button) that was hit, or null if no control was hit
   * @param elementBounds Bounds of the hit element in display space, or null if no element was hit
   * @returns Interaction result indicating the action to take (delete, start resize, start drag), or null if no action needed
   * @description
   * Processes pointer down events by delegating to specialized handlers in priority order:
   * 1. Delete control (highest priority)
   * 2. Resize control for placed elements
   * 3. Pending signature interactions (resize or drag)
   * 4. Drag for placed signature elements
   * 
   * Uses early returns to simplify control flow and reduce cognitive complexity.
   */
  handlePointerDown(
    context: ElementInteractionContext,
    displayPoint: DisplayPoint,
    elementHit: { type: PdfElementType; index: number } | null,
    controlHit: { type: string; handle?: string } | null,
    elementBounds: { x: number; y: number; width: number; height: number } | null
  ): AnyInteractionResult | null {
    const deleteResult = this.handleDeleteControl(controlHit, elementHit);
    if (deleteResult) return deleteResult;

    const resizeResult = this.handleResizeControl(controlHit, elementHit, elementBounds, displayPoint);
    if (resizeResult) return resizeResult;

    const pendingResult = this.handlePendingSignatureInteraction(context, displayPoint);
    if (pendingResult) return pendingResult;

    const placedDragResult = this.handlePlacedSignatureDrag(context, displayPoint, elementHit);
    if (placedDragResult) return placedDragResult;

    return null;
  }

  /**
   * @description Handles delete control interaction for signature elements.
   * @param controlHit Control that was hit at pointer location, or null if no control was hit
   * @param elementHit Element that was hit at pointer location, or null if no element was hit
   * @returns Delete result with element type and index if delete control was hit, null otherwise
   * @description
   * Checks if the hit control is a delete button and if an element was hit.
   * Returns a DeleteResult to trigger element deletion, or null if conditions are not met.
   */
  private handleDeleteControl(
    controlHit: { type: string; handle?: string } | null,
    elementHit: { type: PdfElementType; index: number } | null
  ): AnyInteractionResult | null {
    if (controlHit?.type !== ControlType.Delete || !elementHit) {
      return null;
    }

    return {
      type: InteractionResultType.Delete,
      preventDefault: true,
      elementType: elementHit.type,
      index: elementHit.index,
    } as AnyInteractionResult;
  }

  /**
   * @description Handles resize control interaction for placed signature elements.
   * @param controlHit Control that was hit at pointer location, or null if no control was hit
   * @param elementHit Element that was hit at pointer location, or null if no element was hit
   * @param elementBounds Bounds of the hit element in display space, or null if no element was hit
   * @param displayPoint Display point coordinates where pointer was pressed
   * @returns StartResize result with handle position and initial dimensions if resize control was hit, null otherwise
   * @description
   * Validates that a resize control was hit on a placed signature element with valid bounds.
   * Returns a StartResizeResult to initiate a resize operation, capturing the handle position
   * and initial element dimensions for tracking the resize delta.
   */
  private handleResizeControl(
    controlHit: { type: string; handle?: string } | null,
    elementHit: { type: PdfElementType; index: number } | null,
    elementBounds: { x: number; y: number; width: number; height: number } | null,
    displayPoint: DisplayPoint
  ): AnyInteractionResult | null {
    const isResizeControl = controlHit?.type === ControlType.Resize;
    const hasHandle = !!controlHit?.handle;
    const hasBounds = !!elementBounds;
    const hasElementHit = !!elementHit;

    if (!isResizeControl || !hasHandle || !hasBounds || !hasElementHit) {
      return null;
    }

    return {
      type: InteractionResultType.StartResize,
      preventDefault: true,
      elementType: elementHit.type,
      index: elementHit.index,
      handle: controlHit.handle as ResizeHandle,
      startX: displayPoint.x,
      startY: displayPoint.y,
      startWidth: elementBounds.width,
      startHeight: elementBounds.height,
    } as StartResizeResult;
  }

  /**
   * @description Handles interaction with pending signature element (not yet placed on PDF).
   * @param context Interaction context containing pending signature state and render metrics
   * @param displayPoint Display point coordinates where pointer was pressed
   * @returns Interaction result (resize or drag) if pending signature was interacted with, null otherwise
   * @description
   * Validates that a pending signature exists on the current page, then checks for resize or drag interactions.
   * Converts pending signature coordinates and dimensions from PDF space to display space for hit-testing.
   * Delegates to handlePendingResize or handlePendingDrag based on what was hit.
   */
  private handlePendingSignatureInteraction(
    context: ElementInteractionContext,
    displayPoint: DisplayPoint
  ): AnyInteractionResult | null {
    const { renderMetrics, currentPage, pendingCoordinates, pendingElementType, pendingSignatureWidth, pendingSignatureHeight } = context;

    const isPendingSignature = pendingElementType === PdfElementType.Signature;
    const isOnCurrentPage = pendingCoordinates?.pageNumber === currentPage;
    if (!pendingCoordinates || !isPendingSignature || !isOnCurrentPage) {
      return null;
    }

    const { scaleX, scaleY } = calculateScaleFactors(renderMetrics);
    const px = pendingCoordinates.x * scaleX;
    const py = pendingCoordinates.y * scaleY;
    const w = pendingSignatureWidth * scaleX;
    const h = pendingSignatureHeight * scaleY;
    const bounds = { x: px, y: py, width: w, height: h };

    const pendingControlHit = getControlAtDisplayPosition(
      displayPoint.x,
      displayPoint.y,
      bounds,
      PdfElementType.Signature
    );

    const pendingResizeResult = this.handlePendingResize(pendingControlHit, displayPoint, w, h);
    if (pendingResizeResult) return pendingResizeResult;

    const pendingDragResult = this.handlePendingDrag(displayPoint, bounds, px, py, w, h);
    if (pendingDragResult) return pendingDragResult;

    return null;
  }

  /**
   * @description Handles resize interaction for pending signature element.
   * @param pendingControlHit Control hit result from hit-testing the pending signature bounds
   * @param displayPoint Display point coordinates where pointer was pressed
   * @param width Width of pending signature in display space (scaled from PDF space)
   * @param height Height of pending signature in display space (scaled from PDF space)
   * @returns StartResize result with handle position and initial dimensions if resize control was hit, null otherwise
   * @description
   * Validates that a resize handle was hit on the pending signature.
   * Returns a StartResizeResult with index -1 to indicate this is a pending element resize operation.
   */
  private handlePendingResize(
    pendingControlHit: { type: string; handle?: string } | null,
    displayPoint: DisplayPoint,
    width: number,
    height: number
  ): AnyInteractionResult | null {
    const isResizeControl = pendingControlHit?.type === ControlType.Resize;
    const hasHandle = !!pendingControlHit?.handle;

    if (!isResizeControl || !hasHandle) {
      return null;
    }

    return {
      type: InteractionResultType.StartResize,
      preventDefault: true,
      elementType: PdfElementType.Signature,
      index: -1,
      handle: pendingControlHit.handle as ResizeHandle,
      startX: displayPoint.x,
      startY: displayPoint.y,
      startWidth: width,
      startHeight: height,
    } as StartResizeResult;
  }

  /**
   * @description Handles drag interaction for pending signature element.
   * @param displayPoint Display point coordinates where pointer was pressed
   * @param bounds Bounds of pending signature in display space (x, y, width, height)
   * @param px X coordinate of pending signature top-left corner in display space
   * @param py Y coordinate of pending signature top-left corner in display space
   * @param width Width of pending signature in display space
   * @param height Height of pending signature in display space
   * @returns StartDrag result with drag offset if pointer is within signature bounds, null otherwise
   * @description
   * Checks if the pointer is within the pending signature bounds.
   * If so, calculates the drag offset from the element center and returns a StartDragResult
   * with index -1 to indicate this is a pending element drag operation.
   */
  private handlePendingDrag(
    displayPoint: DisplayPoint,
    bounds: { x: number; y: number; width: number; height: number },
    px: number,
    py: number,
    width: number,
    height: number
  ): AnyInteractionResult | null {
    const isWithinBounds =
      displayPoint.x >= px &&
      displayPoint.x <= px + width &&
      displayPoint.y >= py &&
      displayPoint.y <= py + height;

    if (!isWithinBounds) {
      return null;
    }

    const offset = calculatePendingElementDragOffset({
      displayPoint,
      elementBounds: bounds,
      elementType: PdfElementType.Signature,
    });

    return {
      type: InteractionResultType.StartDrag,
      preventDefault: true,
      elementType: PdfElementType.Signature,
      index: -1,
      offsetX: offset.offsetX,
      offsetY: offset.offsetY,
    } as StartDragResult;
  }

  /**
   * @description Handles drag interaction for placed signature element (already added to PDF).
   * @param context Interaction context containing render metrics, current page, and element arrays
   * @param displayPoint Display point coordinates where pointer was pressed
   * @param elementHit Element that was hit at pointer location, or null if no element was hit
   * @returns StartDrag result with drag offset if a placed signature was hit, null otherwise
   * @description
   * Validates that a placed signature element was hit.
   * Calculates the drag offset from the element center using the element's actual dimensions
   * and coordinates from the signatures array. Returns a StartDragResult to initiate drag operation.
   */
  private handlePlacedSignatureDrag(
    context: ElementInteractionContext,
    displayPoint: DisplayPoint,
    elementHit: { type: PdfElementType; index: number } | null
  ): AnyInteractionResult | null {
    const { renderMetrics, currentPage } = context;

    if (!elementHit || elementHit.type !== PdfElementType.Signature) {
      return null;
    }

    const offset = calculatePlacedElementDragOffset({
      displayPoint,
      elementType: elementHit.type,
      elementIndex: elementHit.index,
      pageNumber: currentPage,
      renderMetrics,
      signatures: context.signatures,
      texts: context.texts,
      dates: context.dates,
    });

    return {
      type: InteractionResultType.StartDrag,
      preventDefault: true,
      elementType: elementHit.type,
      index: elementHit.index,
      offsetX: offset.offsetX,
      offsetY: offset.offsetY,
    } as StartDragResult;
  }

  /**
   * @description Handles pointer move event for signature elements during drag or resize operations.
   * @param context Interaction context containing render metrics, current page, and element arrays
   * @param displayPoint Current display point coordinates where pointer is located
   * @param resizeState Current resize state if a resize operation is in progress, null otherwise
   * @param dragState Current drag state if a drag operation is in progress, null otherwise
   * @returns Interaction result indicating dimension or coordinate updates, or null if no action needed
   * @description
   * Processes pointer move events to update signature dimensions during resize operations
   * or update signature coordinates during drag operations. Handles both pending signatures
   * (index === -1) and placed signatures (index >= 0).
   * 
   * For resize operations:
   * - Calculates new dimensions based on handle position and pointer delta
   * - Updates coordinates if the resize handle requires position adjustment (e.g., northwest handle)
   * - Returns UpdateDimensionsResult with new width, height, and optional coordinates
   * 
   * For drag operations:
   * - Calculates new PDF coordinates based on display point and drag offset
   * - Returns UpdateCoordinatesResult with updated PDF coordinates
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
  ): AnyInteractionResult | null {
    const { renderMetrics, currentPage, pendingCoordinates, signatures } = context;

    if (resizeState && resizeState.type === PdfElementType.Signature) {
      const deltaXDisplay = displayPoint.x - resizeState.startX;
      const deltaYDisplay = displayPoint.y - resizeState.startY;

      if (resizeState.index === -1 && pendingCoordinates) {
        const result = computeResizedSignatureDimensions({
          handle: resizeState.handle as ResizeHandle,
          startWidthDisplay: resizeState.startWidth,
          startHeightDisplay: resizeState.startHeight,
          startXPDF: pendingCoordinates.x,
          startYPDF: pendingCoordinates.y,
          deltaXDisplay,
          deltaYDisplay,
          renderMetrics,
        });

        const coordinatesChanged = result.xPDF !== pendingCoordinates.x || result.yPDF !== pendingCoordinates.y;

        return {
          type: InteractionResultType.UpdateDimensions,
          preventDefault: false,
          index: -1,
          width: result.widthPDF,
          height: result.heightPDF,
          coordinates: coordinatesChanged
            ? {
                x: result.xPDF,
                y: result.yPDF,
                pageNumber: currentPage,
                pageWidth: renderMetrics.pdfPageWidth,
                pageHeight: renderMetrics.pdfPageHeight,
              }
            : undefined,
        } as UpdateDimensionsResult;
      }

      if (resizeState.index >= 0) {
        const sig = signatures[resizeState.index];
        const result = computeResizedSignatureDimensions({
          handle: resizeState.handle as ResizeHandle,
          startWidthDisplay: resizeState.startWidth,
          startHeightDisplay: resizeState.startHeight,
          startXPDF: sig.coordinates.x,
          startYPDF: sig.coordinates.y,
          deltaXDisplay,
          deltaYDisplay,
          renderMetrics,
        });

        const coordinatesChanged = result.xPDF !== sig.coordinates.x || result.yPDF !== sig.coordinates.y;

        return {
          type: InteractionResultType.UpdateDimensions,
          preventDefault: false,
          index: resizeState.index,
          width: result.widthPDF,
          height: result.heightPDF,
          coordinates: coordinatesChanged
            ? {
                ...sig.coordinates,
                x: result.xPDF,
                y: result.yPDF,
              }
            : undefined,
        } as UpdateDimensionsResult;
      }
    }

    if (dragState && dragState.type === PdfElementType.Signature && dragState.index >= 0) {
      const nextX = displayPoint.x - dragState.offsetX;
      const nextY = displayPoint.y - dragState.offsetY;

      const coords = computeDraggedElementCoordinates({
        draggedElement: {
          type: dragState.type,
          index: dragState.index,
        },
        nextDisplayX: nextX,
        nextDisplayY: nextY,
        currentPage,
        renderMetrics,
        signatures: context.signatures,
        texts: context.texts,
        dates: context.dates,
      });

      return {
        type: InteractionResultType.UpdateCoordinates,
        preventDefault: false,
        elementType: dragState.type,
        index: dragState.index,
        coordinates: {
          ...coords,
          pageWidth: renderMetrics.pdfPageWidth,
          pageHeight: renderMetrics.pdfPageHeight,
        },
      } as UpdateCoordinatesResult;
    }

    return null;
  }
}

