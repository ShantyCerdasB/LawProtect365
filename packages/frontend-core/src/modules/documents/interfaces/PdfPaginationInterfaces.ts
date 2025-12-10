/**
 * @fileoverview PDF Pagination Interfaces - Input/output types for pagination calculations
 * @summary Type definitions for PDF page navigation
 * @description Defines interfaces used by pagination calculation use cases and pagination controls.
 */

/**
 * @description Input for calculating next page.
 */
export interface CalculateNextPageInput {
  /** Current page number (1-based). */
  currentPage: number;
  /** Total number of pages in the document. */
  totalPages: number;
}

/**
 * @description Input for calculating previous page.
 */
export interface CalculatePreviousPageInput {
  /** Current page number (1-based). */
  currentPage: number;
  /** Total number of pages in the document. */
  totalPages: number;
}

/**
 * @description Result of pagination calculation.
 */
export interface PaginationResult {
  /** The calculated page number (stays within bounds). */
  pageNumber: number;
  /** Whether navigation is possible (false if already at boundary). */
  canNavigate: boolean;
}

/**
 * @description Props for PDF pagination controls component.
 */
export interface PdfPaginationControlsProps {
  /** Current page number (1-based). */
  currentPage: number;
  /** Total number of pages in the document. */
  totalPages: number;
  /** Callback when previous page is clicked. */
  onPrevious: () => void;
  /** Callback when next page is clicked. */
  onNext: () => void;
}

