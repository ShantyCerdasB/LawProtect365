/**
 * @fileoverview Cursor Pagination Mock - Helper for mocking cursor pagination in tests
 * @summary Provides utilities for mocking shared-ts cursor pagination functions
 * @description This helper provides a centralized way to mock cursor pagination
 * functionality from shared-ts, including listPage and decodeCursor functions.
 * It ensures consistent mocking across all repository tests that use cursor pagination.
 */

import { jest } from '@jest/globals';

/**
 * Mock functions for cursor pagination
 */
export const mockListPage = jest.fn() as jest.MockedFunction<any>;
export const mockDecodeCursor = jest.fn() as jest.MockedFunction<any>;

/**
 * Configuration for cursor pagination mocking
 */
export interface CursorPaginationMockConfig {
  /**
   * Whether to mock the shared-ts module
   */
  mockSharedTs?: boolean;
  /**
   * Default return value for listPage mock
   */
  defaultListPageResult?: {
    rows: any[];
    nextCursor?: string;
  };
  /**
   * Default return value for decodeCursor mock
   */
  defaultDecodeCursorResult?: any;
}

/**
 * Sets up cursor pagination mocks for tests using jest.doMock
 * This is the recommended approach for mocking shared-ts functions
 * @param config - Configuration for the mocks
 * @returns Object containing the mock functions
 */
export function setupCursorPaginationMocks(config: CursorPaginationMockConfig = {}) {
  const {
    mockSharedTs = true,
    defaultListPageResult = { rows: [], nextCursor: undefined },
    defaultDecodeCursorResult = undefined
  } = config;

  if (mockSharedTs) {
    jest.doMock('@lawprotect/shared-ts', () => {
      const actual = jest.requireActual('@lawprotect/shared-ts') as Record<string, unknown>;
      return {
        ...actual,
        listPage: mockListPage,
        decodeCursor: mockDecodeCursor
      };
    });
  }

  // Set default return values
  mockListPage.mockResolvedValue(defaultListPageResult);
  mockDecodeCursor.mockReturnValue(defaultDecodeCursorResult);

  return {
    mockListPage,
    mockDecodeCursor
  };
}

