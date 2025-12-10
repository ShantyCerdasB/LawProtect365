/**
 * @fileoverview Web Element Interaction Handler Interfaces - Types for web element interaction handler
 * @summary Type definitions for web element interaction handler configuration
 * @description
 * Defines interfaces used by the web-specific element interaction handler that bridges
 * React events and frontend-core strategies. These interfaces are web-specific.
 */

import type { PDFCoordinates, PdfRenderMetrics } from '@lawprotect/frontend-core';
import { PdfElementType } from '@lawprotect/frontend-core';
import type { ElementInteractionContext } from '@lawprotect/frontend-core';
import type {
  DraggedElementState,
  ResizeHandleState,
} from './PdfElementInteractionInterfaces';

/**
 * @description Configuration for web element interaction handler.
 */
export interface WebElementInteractionHandlerConfig {
  /** Render metrics for coordinate conversion */
  renderMetrics: PdfRenderMetrics | null;
  /** Interaction context */
  context: ElementInteractionContext;
  /** Callback to set dragged element state */
  setDraggedElement: (state: DraggedElementState | null) => void;
  /** Callback to set resize handle state */
  setResizeHandle: (state: ResizeHandleState | null) => void;
  /** Callback when element is moved */
  onElementMove?: (type: PdfElementType, index: number, coords: PDFCoordinates) => void;
  /** Callback when element is deleted */
  onElementDelete?: (type: PdfElementType, index: number) => void;
  /** Callback when signature is resized */
  onSignatureResize?: (index: number, width: number, height: number) => void;
  /** Callback when text is resized */
  onTextResize?: (index: number, fontSize: number) => void;
  /** Callback when date is resized */
  onDateResize?: (index: number, fontSize: number) => void;
  /** Callback when page is clicked */
  onPageClick?: (coords: PDFCoordinates, event: { clientX: number; clientY: number }) => void;
}

