/**
 * @fileoverview Use PDF Element Interaction - Hook for handling PDF element interactions
 * @summary React hook for managing element drag, resize, and delete interactions
 * @description
 * Simplified hook that uses WebElementInteractionHandler to delegate to frontend-core strategies.
 * This hook maintains React state and provides event handlers for the PDF canvas component.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { ElementInteractionContext } from '@lawprotect/frontend-core';
import type {
  DraggedElementState,
  ResizeHandleState,
  UsePdfElementInteractionConfig,
  UsePdfElementInteractionResult,
} from '../interfaces';
import { WebElementInteractionHandler } from '../handlers/WebElementInteractionHandler';

export type {
  DraggedElementState,
  ResizeHandleState,
  UsePdfElementInteractionConfig,
  UsePdfElementInteractionResult,
};

/**
 * @description Custom hook for handling PDF element interactions.
 * @param config Configuration including elements, callbacks, and render metrics
 * @returns Interaction state and event handlers
 */
export function usePdfElementInteraction(
  config: UsePdfElementInteractionConfig
): UsePdfElementInteractionResult {
  const {
    currentPage,
    renderMetrics,
    signatures,
    texts,
    dates,
    pendingCoordinates,
    pendingElementType,
    pendingSignatureWidth,
    pendingSignatureHeight,
    onElementMove,
    onElementDelete,
    onSignatureResize,
    onTextResize,
    onDateResize,
    onPageClick,
  } = config;

  const [draggedElement, setDraggedElement] = useState<DraggedElementState | null>(null);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandleState | null>(null);
  const [wasDragging, setWasDragging] = useState(false);

  const handlerRef = useRef<WebElementInteractionHandler | null>(null);

  useEffect(() => {
    if (!renderMetrics) return;

    const context: ElementInteractionContext = {
      currentPage,
      renderMetrics,
      signatures,
      texts,
      dates,
      elements: { signatures, texts, dates },
      pendingCoordinates: pendingCoordinates
        ? {
            x: pendingCoordinates.x,
            y: pendingCoordinates.y,
            pageNumber: pendingCoordinates.pageNumber,
            pageWidth: renderMetrics.pdfPageWidth,
            pageHeight: renderMetrics.pdfPageHeight,
          }
        : null,
      pendingElementType: pendingElementType || null,
      pendingSignatureWidth,
      pendingSignatureHeight,
    };

    handlerRef.current = new WebElementInteractionHandler({
      renderMetrics,
      context,
      setDraggedElement,
      setResizeHandle,
      onElementMove,
      onElementDelete,
      onSignatureResize,
      onTextResize,
      onDateResize,
      onPageClick,
    });
  }, [
    renderMetrics,
    currentPage,
    signatures,
    texts,
    dates,
    pendingCoordinates,
    pendingElementType,
    pendingSignatureWidth,
    pendingSignatureHeight,
    onElementMove,
    onElementDelete,
    onSignatureResize,
    onTextResize,
    onDateResize,
    onPageClick,
  ]);

  /**
   * @description Handles pointer down events on the PDF canvas.
   * @param event React pointer event from the canvas
   */
  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      const handler = handlerRef.current;
      if (!handler) return;

      const canvas = event.currentTarget;
      handler.handlePointerDown(event, canvas);
    },
    []
  );

  /**
   * @description Handles pointer move events on the PDF canvas during drag or resize operations.
   * @param event React pointer event from the canvas
   */
  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      const handler = handlerRef.current;
      if (!handler) return;

      const canvas = event.currentTarget;
      handler.handlePointerMove(event, canvas, draggedElement, resizeHandle);
    },
    [draggedElement, resizeHandle]
  );

  /**
   * @description Handles pointer up events on the PDF canvas, ending drag or resize operations.
   * @param event React pointer event from the canvas
   */
  const handlePointerUp = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    const handler = handlerRef.current;
    if (!handler) return;

    const canvas = event.currentTarget;
    handler.handlePointerUp(event, canvas);

    if (draggedElement || resizeHandle) {
      setWasDragging(true);
      setTimeout(() => setWasDragging(false), 100);
    }

    setDraggedElement(null);
    setResizeHandle(null);
  }, [draggedElement, resizeHandle]);

  /**
   * @description Handles click events on the PDF canvas for placing new elements.
   * @param event React mouse event from the canvas
   */
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const handler = handlerRef.current;
      if (!handler) return;

      const canvas = event.currentTarget;
      handler.handleClick(event, canvas, draggedElement, resizeHandle, wasDragging);
    },
    [draggedElement, resizeHandle, wasDragging]
  );

  return {
    draggedElement,
    resizeHandle,
    wasDragging,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleClick,
  };
}
