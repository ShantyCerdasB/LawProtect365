/**
 * @fileoverview PDF Pagination Controls - Navigation controls for PDF pages
 * @summary Component for displaying and controlling PDF page navigation
 * @description
 * Provides pagination controls (Previous/Next buttons and page indicator) for
 * navigating through multi-page PDF documents. This is a web-specific component.
 */

import type { ReactElement } from 'react';
import type { PdfPaginationControlsProps } from '@lawprotect/frontend-core';

/**
 * @description Renders pagination controls for PDF navigation.
 * @param props Current page, total pages, and navigation callbacks
 * @returns JSX element with pagination controls
 */
export function PdfPaginationControls({
  currentPage,
  totalPages,
  onPrevious,
  onNext,
}: PdfPaginationControlsProps): ReactElement {
  return (
    <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
      <button
        type="button"
        onClick={onPrevious}
        disabled={currentPage === 1}
        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
      >
        ← Previous
      </button>

      <div className="flex items-center gap-2 text-sm text-slate-700">
        <span className="font-medium">Page</span>
        <span className="px-3 py-1 bg-white border border-slate-300 rounded-md font-mono">
          {currentPage}
        </span>
        <span className="text-slate-500">of</span>
        <span className="font-medium">{totalPages}</span>
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={currentPage === totalPages}
        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
      >
        Next →
      </button>
    </div>
  );
}

