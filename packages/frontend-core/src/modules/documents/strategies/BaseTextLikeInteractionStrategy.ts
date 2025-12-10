/**
 * @fileoverview Base Text-Like Interaction Strategy - Abstract base class for text and date element interactions
 * @summary Provides shared implementation for text and date element interaction strategies
 * @description
 * Abstract base class that implements common interaction logic for text-like elements
 * (text and date) that share similar behavior:
 * - Resize operations change font size (not dimensions)
 * - Drag operations reposition elements
 * - Delete operations remove elements
 * 
 * Subclasses must provide:
 * - Element type (Text or Date)
 * - Default dimensions for pending elements
 * - Font size computation function
 * 
 * This abstraction eliminates code duplication between TextInteractionStrategy and
 * DateInteractionStrategy while maintaining flexibility for element-specific behavior.
 */

import type { ElementInteractionStrategy } from './interfaces';
import type {
  ElementInteractionContext,
  AnyInteractionResult,
  StartDragResult,
  StartResizeResult,
  UpdateFontSizeResult,
  UpdateCoordinatesResult,
} from './interfaces';
import { InteractionResultType } from './interfaces/ElementInteractionResult';
import type { DisplayPoint } from '../interfaces';
import { PdfElementType, ResizeHandle, ControlType } from '../enums';
import { calculatePlacedElementDragOffset, calculatePendingElementDragOffset } from '../use-cases/calculateDragOffset';
import { computeDraggedElementCoordinates } from '../use-cases/computeDraggedElementCoordinates';
import { calculateScaleFactors } from '../use-cases/convertCoordinates';

/**
 * @description Default font size for text and date elements.
 */
const DEFAULT_FONT_SIZE = 12;

/**
 * @description Configuration for text-like element dimensions.
 */
export interface TextLikeElementDimensions {
  /** Default width in PDF space for pending elements */
  defaultWidthPDF: number;
  /** Default height in PDF space for pending elements */
  defaultHeightPDF: number;
}

/**
 * @description Abstract base class for text-like element interaction strategies.
 */
export abstract class BaseTextLikeInteractionStrategy implements ElementInteractionStrategy {
  /**
   * @description Gets the element type this strategy handles.
   * @returns The PdfElementType enum value
   */
  protected abstract getElementType(): PdfElementType;

  /**
   * @description Gets the default dimensions for pending elements.
   * @returns Default width and height in PDF space
   */
  protected abstract getDefaultDimensions(): TextLikeElementDimensions;

  /**
   * @description Computes new font size for a resized element.
   * @param startFontSizePDF Starting font size in PDF space
   * @param deltaYDisplay Vertical delta in display space
   * @param renderMetrics Render metrics for coordinate conversion
   * @returns New font size in PDF space
   */
  protected abstract computeResizedFontSize(
    startFontSizePDF: number,
    deltaYDisplay: number,
    renderMetrics: { pdfPageWidth: number; pdfPageHeight: number; viewportWidth: number; viewportHeight: number }
  ): number;

  /**
   * @description Gets the element array from context based on element type.
   * @param context Interaction context
   * @returns Array of text or date placements
   */
  protected abstract getElementArray(context: ElementInteractionContext): Array<{ fontSize?: number; coordinates: { pageNumber: number } }>;

  /**
   * @description Checks if this strategy can handle a given element type.
   * @param elementType Element type to check, can be PdfElementType enum, string literal, or null
   * @returns True if element type matches this strategy's type, false otherwise
   * @description
   * Compares the provided element type with this strategy's element type.
   * Supports both enum comparison and string literal comparison for backward compatibility.
   */
  canHandle(elementType: PdfElementType | string | null): boolean {
    const expectedType = this.getElementType();
    const expectedTypeString = expectedType.toLowerCase();
    return elementType === expectedType || elementType === expectedTypeString;
  }

  /**
   * @description Handles pointer down event for text-like elements.
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
   * 3. Pending element interactions (drag)
   * 4. Drag for placed elements
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

    const resizeResult = this.handleResizeControl(controlHit, elementHit, elementBounds, displayPoint, context);
    if (resizeResult) return resizeResult;

    const pendingResult = this.handlePendingElementInteraction(context, displayPoint);
    if (pendingResult) return pendingResult;

    const placedDragResult = this.handlePlacedElementDrag(context, displayPoint, elementHit);
    if (placedDragResult) return placedDragResult;

    return null;
  }

  /**
   * @description Handles delete control interaction for text-like elements.
   * @param controlHit Control that was hit at pointer location, or null if no control was hit
   * @param elementHit Element that was hit at pointer location, or null if no element was hit
   * @returns Delete result with element type and index if delete control was hit, null otherwise
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
   * @description Handles resize control interaction for placed text-like elements.
   * @param controlHit Control that was hit at pointer location, or null if no control was hit
   * @param elementHit Element that was hit at pointer location, or null if no element was hit
   * @param elementBounds Bounds of the hit element in display space, or null if no element was hit
   * @param displayPoint Display point coordinates where pointer was pressed
   * @param context Interaction context containing element arrays
   * @returns StartResize result with handle position, initial dimensions, and font size if resize control was hit, null otherwise
   */
  private handleResizeControl(
    controlHit: { type: string; handle?: string } | null,
    elementHit: { type: PdfElementType; index: number } | null,
    elementBounds: { x: number; y: number; width: number; height: number } | null,
    displayPoint: DisplayPoint,
    context: ElementInteractionContext
  ): AnyInteractionResult | null {
    const isResizeControl = controlHit?.type === ControlType.Resize;
    const hasHandle = !!controlHit?.handle;
    const hasBounds = !!elementBounds;
    const hasElementHit = !!elementHit;

    if (!isResizeControl || !hasHandle || !hasBounds || !hasElementHit) {
      return null;
    }

    const elementArray = this.getElementArray(context);
    const element = elementArray[elementHit.index];

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
      startFontSize: element.fontSize || DEFAULT_FONT_SIZE,
    } as StartResizeResult;
  }

  /**
   * @description Handles interaction with pending text-like element (not yet placed on PDF).
   * @param context Interaction context containing pending element state and render metrics
   * @param displayPoint Display point coordinates where pointer was pressed
   * @returns Interaction result (drag) if pending element was interacted with, null otherwise
   */
  private handlePendingElementInteraction(
    context: ElementInteractionContext,
    displayPoint: DisplayPoint
  ): AnyInteractionResult | null {
    const { renderMetrics, currentPage, pendingCoordinates, pendingElementType } = context;
    const elementType = this.getElementType();

    const isPendingElement = pendingElementType === elementType;
    const isOnCurrentPage = pendingCoordinates?.pageNumber === currentPage;
    if (!pendingCoordinates || !isPendingElement || !isOnCurrentPage) {
      return null;
    }

    const { scaleX, scaleY } = calculateScaleFactors(renderMetrics);
    const { defaultWidthPDF, defaultHeightPDF } = this.getDefaultDimensions();
    const px = pendingCoordinates.x * scaleX;
    const py = pendingCoordinates.y * scaleY;
    const w = defaultWidthPDF * scaleX;
    const h = defaultHeightPDF * scaleY;
    const bounds = { x: px, y: py, width: w, height: h };

    return this.handlePendingDrag(displayPoint, bounds, px, py, w, h, elementType);
  }

  /**
   * @description Handles drag interaction for pending text-like element.
   * @param displayPoint Display point coordinates where pointer was pressed
   * @param bounds Bounds of pending element in display space (x, y, width, height)
   * @param px X coordinate of pending element top-left corner in display space
   * @param py Y coordinate of pending element top-left corner in display space
   * @param width Width of pending element in display space
   * @param height Height of pending element in display space
   * @param elementType Element type (Text or Date)
   * @returns StartDrag result with drag offset if pointer is within element bounds, null otherwise
   */
  private handlePendingDrag(
    displayPoint: DisplayPoint,
    bounds: { x: number; y: number; width: number; height: number },
    px: number,
    py: number,
    width: number,
    height: number,
    elementType: PdfElementType
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
      elementType,
    });

    return {
      type: InteractionResultType.StartDrag,
      preventDefault: true,
      elementType,
      index: -1,
      offsetX: offset.offsetX,
      offsetY: offset.offsetY,
    } as StartDragResult;
  }

  /**
   * @description Handles drag interaction for placed text-like element (already added to PDF).
   * @param context Interaction context containing render metrics, current page, and element arrays
   * @param displayPoint Display point coordinates where pointer was pressed
   * @param elementHit Element that was hit at pointer location, or null if no element was hit
   * @returns StartDrag result with drag offset if a placed element was hit, null otherwise
   */
  private handlePlacedElementDrag(
    context: ElementInteractionContext,
    displayPoint: DisplayPoint,
    elementHit: { type: PdfElementType; index: number } | null
  ): AnyInteractionResult | null {
    const { renderMetrics, currentPage } = context;
    const elementType = this.getElementType();

    if (!elementHit || elementHit.type !== elementType) {
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
   * @description Handles pointer move event for text-like elements during drag or resize operations.
   * @param context Interaction context containing render metrics, current page, and element arrays
   * @param displayPoint Current display point coordinates where pointer is located
   * @param resizeState Current resize state if a resize operation is in progress, null otherwise
   * @param dragState Current drag state if a drag operation is in progress, null otherwise
   * @returns Interaction result indicating font size or coordinate updates, or null if no action needed
   * @description
   * Processes pointer move events to update element font size during resize operations
   * or update element coordinates during drag operations. Handles both pending elements
   * (index === -1) and placed elements (index >= 0).
   * 
   * For resize operations:
   * - Calculates new font size based on vertical pointer delta (Y-axis movement)
   * - Returns UpdateFontSizeResult with new font size
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
    const { renderMetrics, currentPage } = context;
    const elementType = this.getElementType();

    if (resizeState && resizeState.type === elementType && resizeState.startFontSize !== undefined) {
      const deltaYDisplay = displayPoint.y - resizeState.startY;
      const newFontSize = this.computeResizedFontSize(
        resizeState.startFontSize,
        deltaYDisplay,
        renderMetrics
      );

      return {
        type: InteractionResultType.UpdateFontSize,
        preventDefault: false,
        elementType,
        index: resizeState.index,
        fontSize: newFontSize,
      } as UpdateFontSizeResult;
    }

    if (dragState && dragState.type === elementType && dragState.index >= 0) {
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

