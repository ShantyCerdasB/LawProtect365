/**
 * @fileoverview PDF Page Renderer Interfaces - Types for web PDF page rendering
 * @summary Type definitions for PDF page rendering with pdfjs-dist
 * @description
 * Defines interfaces used by the web-specific PDF page renderer hook that uses pdfjs-dist
 * and HTML canvas. These interfaces are web-specific and not reusable for mobile.
 */

import * as pdfjsLib from 'pdfjs-dist';

/**
 * @description Render metrics for a PDF page rendered on web canvas.
 */
export interface PdfPageRenderMetrics {
  /** Viewport width in display pixels */
  viewportWidth: number;
  /** Viewport height in display pixels */
  viewportHeight: number;
  /** Output scale (devicePixelRatio) */
  outputScale: number;
  /** Real PDF page width at scale 1.0 */
  pdfPageWidth: number;
  /** Real PDF page height at scale 1.0 */
  pdfPageHeight: number;
}

/**
 * @description Result of the PDF page renderer hook.
 */
export interface UsePdfPageRendererResult {
  /** PDF document proxy from pdfjs-dist */
  pdfDoc: pdfjsLib.PDFDocumentProxy | null;
  /** Rendered canvas for current page */
  currentPageCanvas: HTMLCanvasElement | null;
  /** Render metrics for current page */
  renderMetrics: PdfPageRenderMetrics | null;
  /** Loading state */
  loading: boolean;
  /** Error message if loading/rendering failed */
  error: string | null;
  /** Total number of pages */
  totalPages: number;
  /** Current scale factor */
  scale: number;
  /** Key to force re-render */
  renderKey: number;
  /** Function to increment render key (force re-render) */
  incrementRenderKey: () => void;
}

/**
 * @description Configuration for PDF page renderer.
 */
export interface UsePdfPageRendererConfig {
  /** PDF source (ArrayBuffer, Uint8Array, or URL string) */
  pdfSource: ArrayBuffer | Uint8Array | string;
  /** Current page number (1-based) */
  currentPage: number;
  /** Container ref for calculating scale */
  containerRef: React.RefObject<HTMLDivElement | null>;
}

