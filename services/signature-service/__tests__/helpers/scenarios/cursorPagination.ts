/**
 * @fileoverview Cursor Pagination Scenarios - Common test scenarios for cursor pagination
 * @summary Provides predefined test scenarios for cursor pagination testing
 * @description This module provides common test scenarios and patterns for testing
 * cursor pagination functionality. It helps standardize test patterns across
 * different repository tests.
 */

/**
 * Helper to create a mock page result for listPage
 * @param rows - Array of rows to return
 * @param nextCursor - Optional next cursor
 * @returns Mock page result
 */
export function createMockPageResult<T>(rows: T[], nextCursor?: string) {
  return {
    rows,
    nextCursor
  };
}

/**
 * Helper to create a mock decoded cursor
 * @param cursorData - The cursor data to return
 * @returns Mock decoded cursor
 */
export function createMockDecodedCursor(cursorData: any) {
  return cursorData;
}

/**
 * Common cursor pagination test scenarios
 */
export const CursorPaginationScenarios = {
  /**
   * First page without cursor
   */
  firstPage: (rows: any[], nextCursor?: string) => ({
    listPageResult: createMockPageResult(rows, nextCursor),
    decodeCursorResult: undefined,
    expectedCursor: undefined
  }),

  /**
   * Subsequent page with cursor
   */
  subsequentPage: (rows: any[], cursorData: any, nextCursor?: string) => ({
    listPageResult: createMockPageResult(rows, nextCursor),
    decodeCursorResult: cursorData,
    expectedCursor: cursorData
  }),

  /**
   * Last page (no next cursor)
   */
  lastPage: (rows: any[], cursorData?: any) => ({
    listPageResult: createMockPageResult(rows, undefined),
    decodeCursorResult: cursorData,
    expectedCursor: cursorData
  }),

  /**
   * Empty page
   */
  emptyPage: (cursorData?: any) => ({
    listPageResult: createMockPageResult([], undefined),
    decodeCursorResult: cursorData,
    expectedCursor: cursorData
  })
};
