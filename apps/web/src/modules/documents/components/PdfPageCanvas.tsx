/**
 * @fileoverview PDF Page Canvas - Interactive canvas for PDF page rendering
 * @summary Component for rendering PDF page with interactive overlays
 * @description
 * Renders a canvas element with PDF page content and handles user interactions
 * (click, drag, resize). This is a web-specific component that uses HTML canvas.
 */

import type { ReactElement } from 'react';
import type { PdfPageCanvasProps } from '../interfaces';

/**
 * @description Renders interactive PDF page canvas.
 * @param props Canvas refs, event handlers, and page info
 * @returns JSX element with canvas and container
 */
export function PdfPageCanvas({
  displayCanvasRef,
  containerRef,
  draggedElement,
  resizeHandle,
  onClick,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  currentPage,
  totalPages,
}: PdfPageCanvasProps): ReactElement {
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
      <div className="bg-slate-50 px-4 py-2 text-xs text-slate-500 border-b border-slate-200">
        Page {currentPage} of {totalPages}
      </div>
      <div className="bg-white relative flex justify-center overflow-auto" ref={containerRef}>
        <canvas
          ref={displayCanvasRef}
          onClick={onClick}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className={`hover:opacity-90 transition-opacity ${
            draggedElement ? 'cursor-grabbing' : resizeHandle ? 'cursor-nwse-resize' : 'cursor-crosshair'
          }`}
          style={{
            maxWidth: '100%',
            height: 'auto',
            display: 'block',
            touchAction: 'none',
          }}
        />
      </div>
    </div>
  );
}

