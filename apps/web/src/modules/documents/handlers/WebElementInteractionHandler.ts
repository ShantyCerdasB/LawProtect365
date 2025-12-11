/**
 * @fileoverview Web Element Interaction Handler - Handler for web-specific element interactions
 * @summary Converts React events to display points and delegates to frontend-core strategies
 * @description
 * Handles web-specific concerns like converting React Pointer Events to display points,
 * managing pointer capture, and updating React state based on strategy results.
 * This is a web-specific handler that bridges React events and frontend-core strategies.
 */

import type {
  ElementInteractionContext,
  AnyInteractionResult,
  PDFCoordinates,
} from '@lawprotect/frontend-core';
import {
  InteractionResultType,
  PdfElementType,
  convertDisplayToPDF,
} from '@lawprotect/frontend-core';
import {
  handleElementPointerDown,
  handleElementPointerMove,
  type DisplayPoint,
  type PdfRenderMetrics,
} from '@lawprotect/frontend-core';
import type {
  DraggedElementState,
  ResizeHandleState,
  WebElementInteractionHandlerConfig,
} from '../interfaces';
import {
  PENDING_ELEMENT_INDEX,
  DEFAULT_COORDINATES,
  DEFAULT_EVENT_COORDINATES,
} from './constants/HandlerConstants';

/**
 * @description Converts a web pointer/mouse event to a display point.
 * @param event Event with clientX/clientY coordinates
 * @param rect Canvas bounding rectangle
 * @param renderMetrics Render metrics for scale calculation
 * @returns Display point coordinates in display space
 */
function convertWebEventToDisplayPoint(
  event: { clientX: number; clientY: number },
  rect: DOMRect,
  renderMetrics: PdfRenderMetrics | null
): DisplayPoint {
  if (!renderMetrics) {
    return { ...DEFAULT_COORDINATES };
  }

  const cssX = event.clientX - rect.left;
  const cssY = event.clientY - rect.top;

  const displayWidth = renderMetrics.viewportWidth;
  const displayHeight = renderMetrics.viewportHeight;

  const scaleXFromRect = displayWidth / (rect.width || displayWidth);
  const scaleYFromRect = displayHeight / (rect.height || displayHeight);

  return {
    x: cssX * scaleXFromRect,
    y: cssY * scaleYFromRect,
  };
}

/**
 * @description Handles StartDrag interaction result.
 * @param result StartDrag result
 * @param setDraggedElement Callback to set dragged element state
 */
function handleStartDrag(
  result: AnyInteractionResult,
  setDraggedElement: (state: DraggedElementState | null) => void
): void {
  if (result.type === InteractionResultType.StartDrag && 'offsetX' in result && 'offsetY' in result) {
    setDraggedElement({
      type: result.elementType,
      index: result.index,
      offsetX: result.offsetX,
      offsetY: result.offsetY,
    });
  }
}

/**
 * @description Handles StartResize interaction result.
 * @param result StartResize result
 * @param setResizeHandle Callback to set resize handle state
 */
function handleStartResize(
  result: AnyInteractionResult,
  setResizeHandle: (state: ResizeHandleState | null) => void
): void {
  if (result.type === InteractionResultType.StartResize && 'handle' in result && 'startX' in result) {
    setResizeHandle({
      type: result.elementType,
      index: result.index,
      handle: result.handle,
      startX: result.startX,
      startY: result.startY,
      startWidth: result.startWidth,
      startHeight: result.startHeight,
      startFontSize: result.startFontSize,
    });
  }
}

/**
 * @description Handles Delete interaction result.
 * @param result Delete result
 * @param onElementDelete Callback to delete element
 */
function handleDelete(
  result: AnyInteractionResult,
  onElementDelete?: (type: PdfElementType, index: number) => void
): void {
  if (result.type === InteractionResultType.Delete && onElementDelete && 'elementType' in result && 'index' in result) {
    onElementDelete(result.elementType, result.index);
  }
}

/**
 * @description Handles UpdateCoordinates interaction result.
 * @param result UpdateCoordinates result
 * @param onElementMove Callback to move element
 */
function handleUpdateCoordinates(
  result: AnyInteractionResult,
  onElementMove?: (type: PdfElementType, index: number, coords: PDFCoordinates) => void
): void {
  if (result.type === InteractionResultType.UpdateCoordinates && onElementMove && 'elementType' in result && 'index' in result && 'coordinates' in result) {
    onElementMove(result.elementType, result.index, result.coordinates);
  }
}

/**
 * @description Handles UpdateDimensions interaction result for signatures.
 * @param result UpdateDimensions result
 * @param config Handler configuration
 */
function handleUpdateDimensions(
  result: AnyInteractionResult,
  config: WebElementInteractionHandlerConfig
): void {
  if (result.type !== InteractionResultType.UpdateDimensions || !('index' in result && 'width' in result && 'height' in result)) {
    return;
  }

  const { onSignatureResize, onElementMove, onPageClick } = config;
  const isPending = result.index === PENDING_ELEMENT_INDEX;

  if (isPending && onSignatureResize) {
    onSignatureResize(PENDING_ELEMENT_INDEX, result.width, result.height);
    if (result.coordinates && onPageClick) {
      onPageClick(result.coordinates, { ...DEFAULT_EVENT_COORDINATES });
    }
  } else if (result.index >= 0 && onSignatureResize) {
    onSignatureResize(result.index, result.width, result.height);
    if (result.coordinates && onElementMove) {
      onElementMove(PdfElementType.Signature, result.index, result.coordinates);
    }
  }
}

/**
 * @description Handles UpdateFontSize interaction result for text and date elements.
 * @param result UpdateFontSize result
 * @param config Handler configuration
 */
function handleUpdateFontSize(
  result: AnyInteractionResult,
  config: WebElementInteractionHandlerConfig
): void {
  if (result.type !== InteractionResultType.UpdateFontSize || !('elementType' in result && 'index' in result && 'fontSize' in result)) {
    return;
  }

  const { onTextResize, onDateResize } = config;

  if (result.elementType === PdfElementType.Text && onTextResize) {
    onTextResize(result.index, result.fontSize);
  } else if (result.elementType === PdfElementType.Date && onDateResize) {
    onDateResize(result.index, result.fontSize);
  }
}

/**
 * @description Handles interaction result from strategies and updates React state or invokes callbacks.
 * @param result Interaction result from strategy indicating what action to take
 * @param config Handler configuration containing state setters and callbacks
 */
function handleInteractionResult(
  result: AnyInteractionResult | null,
  config: WebElementInteractionHandlerConfig
): void {
  if (!result) return;

  const { setDraggedElement, setResizeHandle } = config;

  switch (result.type) {
    case InteractionResultType.StartDrag:
      handleStartDrag(result, setDraggedElement);
      break;

    case InteractionResultType.StartResize:
      handleStartResize(result, setResizeHandle);
      break;

    case InteractionResultType.Delete:
      handleDelete(result, config.onElementDelete);
      break;

    case InteractionResultType.UpdateCoordinates:
      handleUpdateCoordinates(result, config.onElementMove);
      break;

    case InteractionResultType.UpdateDimensions:
      handleUpdateDimensions(result, config);
      break;

    case InteractionResultType.UpdateFontSize:
      handleUpdateFontSize(result, config);
      break;
  }
}

/**
 * @description Handler for web element interactions.
 */
export class WebElementInteractionHandler {
  private config: WebElementInteractionHandlerConfig;

  constructor(config: WebElementInteractionHandlerConfig) {
    this.config = config;
  }

  /**
   * @description Updates the handler configuration with new values.
   * @param config Partial configuration object with properties to update
   */
  updateConfig(config: Partial<WebElementInteractionHandlerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * @description Handles pointer down event on the PDF canvas.
   * @param event React pointer event from the canvas
   * @param canvas HTML canvas element that received the event
   * @returns True if the event was handled and should be prevented, false otherwise
   */
  handlePointerDown(
    event: React.PointerEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement
  ): boolean {
    const { renderMetrics, context } = this.config;

    if (!renderMetrics) return false;

    canvas.setPointerCapture(event.pointerId);

    const rect = canvas.getBoundingClientRect();
    const displayPoint = convertWebEventToDisplayPoint(event, rect, renderMetrics);

    const result = handleElementPointerDown({
      context,
      displayPoint,
    });

    if (result.result) {
      handleInteractionResult(result.result, this.config);
      if (result.result.preventDefault) {
        event.preventDefault();
        return true;
      }
    }

    return false;
  }

  /**
   * @description Handles pointer move event during drag or resize operations.
   * @param event React pointer event from the canvas
   * @param canvas HTML canvas element that received the event
   * @param draggedElement Current dragged element state, or null if not dragging
   * @param resizeHandle Current resize handle state, or null if not resizing
   */
  handlePointerMove(
    event: React.PointerEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement,
    draggedElement: DraggedElementState | null,
    resizeHandle: ResizeHandleState | null
  ): void {
    const { renderMetrics, context } = this.config;

    if (!renderMetrics) return;

    const rect = canvas.getBoundingClientRect();
    const displayPoint = convertWebEventToDisplayPoint(event, rect, renderMetrics);

    const result = handleElementPointerMove({
      context,
      displayPoint,
      resizeState: resizeHandle
        ? {
            type: resizeHandle.type,
            index: resizeHandle.index,
            handle: resizeHandle.handle,
            startX: resizeHandle.startX,
            startY: resizeHandle.startY,
            startWidth: resizeHandle.startWidth,
            startHeight: resizeHandle.startHeight,
            startFontSize: resizeHandle.startFontSize,
          }
        : null,
      dragState: draggedElement
        ? {
            type: draggedElement.type,
            index: draggedElement.index,
            offsetX: draggedElement.offsetX,
            offsetY: draggedElement.offsetY,
          }
        : null,
    });

    if (result) {
      handleInteractionResult(result, this.config);
    }
  }

  /**
   * @description Handles pointer up event, ending drag or resize operations.
   * @param event React pointer event from the canvas
   * @param canvas HTML canvas element that received the event
   */
  handlePointerUp(
    event: React.PointerEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement
  ): void {
    canvas.releasePointerCapture(event.pointerId);
  }

  /**
   * @description Handles click event on the PDF canvas for placing new elements.
   * @param event React mouse event from the canvas
   * @param canvas HTML canvas element that received the event
   * @param draggedElement Current dragged element state, or null if not dragging
   * @param resizeHandle Current resize handle state, or null if not resizing
   * @param wasDragging Whether a drag or resize operation just completed (prevents accidental clicks)
   */
  handleClick(
    event: React.MouseEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement,
    draggedElement: DraggedElementState | null,
    resizeHandle: ResizeHandleState | null,
    wasDragging: boolean
  ): void {
    const { renderMetrics, context, onPageClick } = this.config;

    if (draggedElement || resizeHandle || wasDragging) {
      return;
    }

    if (!onPageClick || !renderMetrics) return;

    const rect = canvas.getBoundingClientRect();
    const displayPoint = convertWebEventToDisplayPoint(event, rect, renderMetrics);

    const pdfCoords = convertDisplayToPDF({
      displayPoint,
      renderMetrics,
      pageNumber: context.currentPage,
    });

    onPageClick(pdfCoords, {
      clientX: event.clientX,
      clientY: event.clientY,
    });
  }
}

