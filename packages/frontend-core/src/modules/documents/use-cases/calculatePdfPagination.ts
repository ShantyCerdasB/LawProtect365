/**
 * @fileoverview Calculate PDF Pagination - Pagination calculation utilities
 * @summary Provides pure functions for calculating PDF page navigation
 * @description
 * These functions calculate the next or previous page number for PDF pagination,
 * ensuring the result stays within valid bounds (1 to totalPages). All functions
 * are pure and platform-agnostic, making them reusable across web and mobile.
 */

import type {
  CalculateNextPageInput,
  CalculatePreviousPageInput,
  PaginationResult,
} from '../interfaces';

/**
 * @description Calculates the next page number, ensuring it doesn't exceed totalPages.
 * @param input Current page and total pages.
 * @returns Next page number and whether navigation is possible.
 */
export function calculateNextPage(
  input: CalculateNextPageInput
): PaginationResult {
  const { currentPage, totalPages } = input;

  if (currentPage >= totalPages) {
    return {
      pageNumber: currentPage,
      canNavigate: false,
    };
  }

  return {
    pageNumber: currentPage + 1,
    canNavigate: true,
  };
}

/**
 * @description Calculates the previous page number, ensuring it doesn't go below 1.
 * @param input Current page and total pages.
 * @returns Previous page number and whether navigation is possible.
 */
export function calculatePreviousPage(
  input: CalculatePreviousPageInput
): PaginationResult {
  const { currentPage } = input;

  if (currentPage <= 1) {
    return {
      pageNumber: currentPage,
      canNavigate: false,
    };
  }

  return {
    pageNumber: currentPage - 1,
    canNavigate: true,
  };
}

/**
 * @description Checks if navigation to next page is possible.
 * @param currentPage Current page number (1-based).
 * @param totalPages Total number of pages.
 * @returns True if next page exists, false otherwise.
 */
export function canGoToNextPage(
  currentPage: number,
  totalPages: number
): boolean {
  return currentPage < totalPages;
}

/**
 * @description Checks if navigation to previous page is possible.
 * @param currentPage Current page number (1-based).
 * @returns True if previous page exists, false otherwise.
 */
export function canGoToPreviousPage(currentPage: number): boolean {
  return currentPage > 1;
}

