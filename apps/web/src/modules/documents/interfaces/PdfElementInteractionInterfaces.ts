/**
 * @fileoverview PDF Element Interaction Interfaces - Types for web PDF element interactions
 * @summary Type definitions for element drag, resize, and delete interactions
 * @description
 * Defines interfaces used by the web-specific PDF element interaction hook that handles
 * React Pointer Events for dragging, resizing, and deleting elements. These interfaces
 * are web-specific and not reusable for mobile.
 */

import type {
  PdfRenderMetrics,
  SignaturePlacement,
  TextPlacement,
  DatePlacement,
  PDFCoordinates,
} from '@lawprotect/frontend-core';
import { PdfElementType, ResizeHandle } from '@lawprotect/frontend-core';

/**
 * @description State for a dragged element.
 */
export interface DraggedElementState {
  /** Type of element being dragged. */
  type: PdfElementType;
  /** Index of element (-1 for pending elements). */
  index: number;
  /** Offset from pointer to element center. */
  offsetX: number;
  /** Offset from pointer to element center. */
  offsetY: number;
}

/**
 * @description State for a resize operation.
 */
export interface ResizeHandleState {
  /** Type of element being resized. */
  type: PdfElementType;
  /** Index of element (-1 for pending elements). */
  index: number;
  /** Resize handle being used. */
  handle: ResizeHandle;
  /** Starting X coordinate of pointer. */
  startX: number;
  /** Starting Y coordinate of pointer. */
  startY: number;
  /** Starting width in display space. */
  startWidth: number;
  /** Starting height in display space. */
  startHeight: number;
  /** Starting font size (for text/date). */
  startFontSize?: number;
}

/**
 * @description Configuration for the usePdfElementInteraction hook.
 */
export interface UsePdfElementInteractionConfig {
  /** Current page number (1-based). */
  currentPage: number;
  /** Render metrics for the current page. */
  renderMetrics: PdfRenderMetrics | null;
  /** Signature placements. */
  signatures: SignaturePlacement[];
  /** Text placements. */
  texts: TextPlacement[];
  /** Date placements. */
  dates: DatePlacement[];
  /** Pending coordinates (if placing new element). */
  pendingCoordinates: { x: number; y: number; pageNumber: number } | null;
  /** Pending element type. */
  pendingElementType: PdfElementType | null;
  /** Pending signature width. */
  pendingSignatureWidth: number;
  /** Pending signature height. */
  pendingSignatureHeight: number;
  /** Callback when element is moved. */
  onElementMove?: (type: PdfElementType, index: number, coords: PDFCoordinates) => void;
  /** Callback when element is deleted. */
  onElementDelete?: (type: PdfElementType, index: number) => void;
  /** Callback when signature is resized. */
  onSignatureResize?: (index: number, width: number, height: number) => void;
  /** Callback when text is resized. */
  onTextResize?: (index: number, fontSize: number) => void;
  /** Callback when date is resized. */
  onDateResize?: (index: number, fontSize: number) => void;
  /** Callback when page is clicked (for placing new elements). */
  onPageClick?: (coords: { x: number; y: number; pageNumber: number; pageWidth: number; pageHeight: number }, event: { clientX: number; clientY: number }) => void;
}

/**
 * @description Result of the usePdfElementInteraction hook.
 */
export interface UsePdfElementInteractionResult {
  /** Currently dragged element, or null. */
  draggedElement: DraggedElementState | null;
  /** Currently resized element, or null. */
  resizeHandle: ResizeHandleState | null;
  /** Whether a drag/resize operation just completed (to prevent click). */
  wasDragging: boolean;
  /** Pointer down event handler for the canvas. */
  handlePointerDown: (event: React.PointerEvent<HTMLCanvasElement>) => void;
  /** Pointer move event handler for the canvas. */
  handlePointerMove: (event: React.PointerEvent<HTMLCanvasElement>) => void;
  /** Pointer up event handler for the canvas. */
  handlePointerUp: (event: React.PointerEvent<HTMLCanvasElement>) => void;
  /** Click event handler for the canvas. */
  handleClick: (event: React.MouseEvent<HTMLCanvasElement>) => void;
}

