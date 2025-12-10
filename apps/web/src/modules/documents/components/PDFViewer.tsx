/**
 * @fileoverview PDF Viewer - Renders PDF documents using pdfjs-dist
 * @summary Component for displaying PDF pages as canvas elements with interactive element placement
 * @description
 * This component uses PDF.js to render PDF documents page by page as canvas elements.
 * It provides interactive functionality for placing, moving, resizing, and deleting elements
 * (signatures, text, dates) on PDF pages. The component coordinates multiple hooks to handle
 * PDF rendering, element overlay drawing, and user interactions. This is a web-specific
 * component that uses HTML canvas and React Pointer Events.
 * 
 * Architecture:
 * - Uses usePdfPageRenderer hook for PDF loading and page rendering
 * - Uses usePdfElementInteraction hook for handling drag, resize, and delete interactions
 * - Uses usePdfElementOverlay hook for drawing element previews and controls on canvas
 * - Delegates complex calculations to frontend-core use cases (reusable for mobile)
 */

import { useRef, useState, type ReactElement } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFViewerProps } from '../types';
import { calculateNextPage, calculatePreviousPage } from '@lawprotect/frontend-core';
import { PdfPaginationControls } from './PdfPaginationControls';
import { PdfPageCanvas } from './PdfPageCanvas';
import { usePdfPageRenderer } from '../hooks/usePdfPageRenderer';
import { usePdfElementOverlay } from '../hooks/usePdfElementOverlay';
import { usePdfElementInteraction } from '../hooks/usePdfElementInteraction';

/**
 * @description Configures PDF.js worker for rendering PDF documents.
 * @description
 * PDF.js uses a Web Worker to parse and render PDF files without blocking the main thread.
 * The worker file (pdf.worker.min.mjs) must be accessible at the specified path.
 * 
 * For production (CloudFront + S3):
 * - The worker file should be copied to the public folder during build
 * - It will be served from the same origin as the app (e.g., /pdf.worker.min.mjs)
 * - CloudFront will cache it with appropriate headers
 * - No CDN URL needed - same origin is recommended for CORS and security
 * 
 * Alternative options:
 * - CDN: pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/X.X.X/pdf.worker.min.mjs'
 *   (Not recommended: version mismatch, external dependency, CORS issues)
 * - Import: import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
 *   (Recommended for Vite/Webpack bundlers - handles version automatically)
 */
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

/**
 * @description Renders a PDF document with interactive element placement capabilities.
 * @param props PDF source, element data, callbacks, and styling options
 * @returns JSX element with rendered PDF pages, pagination controls, and interactive canvas
 */
export function PDFViewer({
  pdfSource,
  onPageClick,
  className,
  signatures = [],
  texts = [],
  dates = [],
  pendingCoordinates,
  pendingElementType,
  pendingSignatureImage,
  pendingSignatureWidth = 150,
  pendingSignatureHeight = 60,
  onSignatureResize,
  onTextResize,
  onDateResize,
  pendingText,
  pendingTextFontSize = 12,
  pendingDate,
  pendingDateFormat = 'MM/DD/YYYY',
  pendingDateFontSize = 12,
  onElementMove,
  onElementDelete,
}: PDFViewerProps): ReactElement {
  const [currentPage, setCurrentPage] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  const {
    pdfDoc,
    currentPageCanvas,
    renderMetrics,
    loading,
    error,
    totalPages,
    renderKey,
  } = usePdfPageRenderer({
    pdfSource,
    currentPage,
    containerRef: canvasContainerRef as React.RefObject<HTMLDivElement>,
  });

  const {
    draggedElement,
    resizeHandle,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleClick,
  } = usePdfElementInteraction({
    currentPage,
    renderMetrics,
    signatures,
    texts,
    dates,
    pendingCoordinates: pendingCoordinates ?? null,
    pendingElementType: pendingElementType ?? null,
    pendingSignatureWidth,
    pendingSignatureHeight,
    onElementMove,
    onElementDelete,
    onSignatureResize,
    onTextResize,
    onDateResize,
    onPageClick,
  });

  usePdfElementOverlay({
    currentPageCanvas,
    displayCanvasRef: displayCanvasRef as React.RefObject<HTMLCanvasElement>,
    renderMetrics,
    currentPage,
    signatures,
    texts,
    dates,
    pendingCoordinates: pendingCoordinates ?? null,
    pendingElementType: pendingElementType ?? null,
    pendingSignatureImage: pendingSignatureImage ?? null,
    pendingSignatureWidth,
    pendingSignatureHeight,
    pendingText: pendingText ?? null,
    pendingTextFontSize,
    pendingDate: pendingDate ?? null,
    pendingDateFormat,
    pendingDateFontSize,
    draggedElement,
    resizeHandle,
    onElementDelete,
    onSignatureResize,
    renderKey,
  });

  /**
   * @description Navigates to the previous page if not already on the first page.
   * Uses the shared pagination calculation from frontend-core.
   */
  const handlePreviousPage = () => {
    const result = calculatePreviousPage({ currentPage, totalPages });
    if (result.canNavigate) {
      setCurrentPage(result.pageNumber);
    }
  };

  /**
   * @description Navigates to the next page if not already on the last page.
   * Uses the shared pagination calculation from frontend-core.
   */
  const handleNextPage = () => {
    const result = calculateNextPage({ currentPage, totalPages });
    if (result.canNavigate) {
      setCurrentPage(result.pageNumber);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className || ''}`}>
        <div className="text-sm text-slate-500">Loading PDF...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center p-8 ${className || ''}`}>
        <div className="text-sm text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!currentPageCanvas || totalPages === 0) {
    if (pdfDoc && (loading || !currentPageCanvas)) {
      return (
        <div className={`flex items-center justify-center p-8 ${className || ''}`}>
          <div className="text-sm text-slate-500">Loading PDF...</div>
        </div>
      );
    }
    if (!pdfDoc) {
      return (
        <div className={`flex items-center justify-center p-8 ${className || ''}`}>
          <div className="text-sm text-slate-500">No PDF loaded</div>
        </div>
      );
    }
    return (
      <div className={`flex items-center justify-center p-8 ${className || ''}`}>
        <div className="text-sm text-slate-500">No pages available</div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`space-y-4 ${className || ''}`}>
      <PdfPaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPrevious={handlePreviousPage}
        onNext={handleNextPage}
      />

      <PdfPageCanvas
        displayCanvasRef={displayCanvasRef as React.RefObject<HTMLCanvasElement>}
        containerRef={canvasContainerRef as React.RefObject<HTMLDivElement>}
        draggedElement={draggedElement}
        resizeHandle={resizeHandle}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        currentPage={currentPage}
        totalPages={totalPages}
      />
    </div>
  );
}

