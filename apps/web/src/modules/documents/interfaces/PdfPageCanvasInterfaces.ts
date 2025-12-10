/**
 * @fileoverview PDF Page Canvas Interfaces - Types for web PDF page canvas component
 * @summary Type definitions for PDF page canvas component props
 * @description
 * Defines interfaces used by the web-specific PDF page canvas component that renders
 * PDF pages on HTML canvas with interactive overlays. These interfaces are web-specific.
 */

import type { DraggedElementState, ResizeHandleState } from './PdfElementInteractionInterfaces';

/**
 * @description Props for the PDF page canvas component.
 */
export interface PdfPageCanvasProps {
  /** Canvas ref for display canvas */
  displayCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** Container ref for canvas container */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Currently dragged element */
  draggedElement: DraggedElementState | null;
  /** Currently resized element */
  resizeHandle: ResizeHandleState | null;
  /** Click handler */
  onClick: (event: React.MouseEvent<HTMLCanvasElement>) => void;
  /** Pointer down handler */
  onPointerDown: (event: React.PointerEvent<HTMLCanvasElement>) => void;
  /** Pointer move handler */
  onPointerMove: (event: React.PointerEvent<HTMLCanvasElement>) => void;
  /** Pointer up handler */
  onPointerUp: (event: React.PointerEvent<HTMLCanvasElement>) => void;
  /** Current page number (1-based). */
  currentPage: number;
  /** Total number of pages in the document. */
  totalPages: number;
}

