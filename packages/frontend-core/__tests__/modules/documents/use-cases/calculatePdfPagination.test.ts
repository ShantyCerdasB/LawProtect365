/**
 * @fileoverview Tests for calculatePdfPagination use case
 * @summary Unit tests for PDF pagination calculation utilities
 * @description Comprehensive tests for calculating next/previous page numbers and navigation checks
 */

import { describe, it, expect } from '@jest/globals';
import {
  calculateNextPage,
  calculatePreviousPage,
  canGoToNextPage,
  canGoToPreviousPage,
} from '../../../../src/modules/documents/use-cases/calculatePdfPagination';

describe('calculatePdfPagination', () => {
  describe('calculateNextPage', () => {
    it('should return next page when not at last page', () => {
      const result = calculateNextPage({ currentPage: 1, totalPages: 5 });

      expect(result.pageNumber).toBe(2);
      expect(result.canNavigate).toBe(true);
    });

    it('should return same page when at last page', () => {
      const result = calculateNextPage({ currentPage: 5, totalPages: 5 });

      expect(result.pageNumber).toBe(5);
      expect(result.canNavigate).toBe(false);
    });

    it('should return same page when current page exceeds total pages', () => {
      const result = calculateNextPage({ currentPage: 10, totalPages: 5 });

      expect(result.pageNumber).toBe(10);
      expect(result.canNavigate).toBe(false);
    });

    it('should handle single page document', () => {
      const result = calculateNextPage({ currentPage: 1, totalPages: 1 });

      expect(result.pageNumber).toBe(1);
      expect(result.canNavigate).toBe(false);
    });

    it('should handle page 1 of multi-page document', () => {
      const result = calculateNextPage({ currentPage: 1, totalPages: 3 });

      expect(result.pageNumber).toBe(2);
      expect(result.canNavigate).toBe(true);
    });

    it('should handle second to last page', () => {
      const result = calculateNextPage({ currentPage: 4, totalPages: 5 });

      expect(result.pageNumber).toBe(5);
      expect(result.canNavigate).toBe(true);
    });
  });

  describe('calculatePreviousPage', () => {
    it('should return previous page when not at first page', () => {
      const result = calculatePreviousPage({ currentPage: 3, totalPages: 5 });

      expect(result.pageNumber).toBe(2);
      expect(result.canNavigate).toBe(true);
    });

    it('should return same page when at first page', () => {
      const result = calculatePreviousPage({ currentPage: 1, totalPages: 5 });

      expect(result.pageNumber).toBe(1);
      expect(result.canNavigate).toBe(false);
    });

    it('should return same page when current page is 1', () => {
      const result = calculatePreviousPage({ currentPage: 1, totalPages: 10 });

      expect(result.pageNumber).toBe(1);
      expect(result.canNavigate).toBe(false);
    });

    it('should handle single page document', () => {
      const result = calculatePreviousPage({ currentPage: 1, totalPages: 1 });

      expect(result.pageNumber).toBe(1);
      expect(result.canNavigate).toBe(false);
    });

    it('should handle page 2 of multi-page document', () => {
      const result = calculatePreviousPage({ currentPage: 2, totalPages: 5 });

      expect(result.pageNumber).toBe(1);
      expect(result.canNavigate).toBe(true);
    });

    it('should handle last page', () => {
      const result = calculatePreviousPage({ currentPage: 5, totalPages: 5 });

      expect(result.pageNumber).toBe(4);
      expect(result.canNavigate).toBe(true);
    });
  });

  describe('canGoToNextPage', () => {
    it('should return true when not at last page', () => {
      expect(canGoToNextPage(1, 5)).toBe(true);
      expect(canGoToNextPage(2, 5)).toBe(true);
      expect(canGoToNextPage(4, 5)).toBe(true);
    });

    it('should return false when at last page', () => {
      expect(canGoToNextPage(5, 5)).toBe(false);
    });

    it('should return false when current page exceeds total pages', () => {
      expect(canGoToNextPage(10, 5)).toBe(false);
    });

    it('should return false for single page document', () => {
      expect(canGoToNextPage(1, 1)).toBe(false);
    });
  });

  describe('canGoToPreviousPage', () => {
    it('should return true when not at first page', () => {
      expect(canGoToPreviousPage(2)).toBe(true);
      expect(canGoToPreviousPage(3)).toBe(true);
      expect(canGoToPreviousPage(5)).toBe(true);
    });

    it('should return false when at first page', () => {
      expect(canGoToPreviousPage(1)).toBe(false);
    });

    it('should return true for any page greater than 1', () => {
      expect(canGoToPreviousPage(2)).toBe(true);
      expect(canGoToPreviousPage(100)).toBe(true);
    });
  });
});

