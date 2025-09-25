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

  // Clear previous mocks
  mockListPage.mockClear();
  mockDecodeCursor.mockClear();

  // Set default return values
  mockListPage.mockResolvedValue(defaultListPageResult);
  mockDecodeCursor.mockReturnValue(defaultDecodeCursorResult);

  if (mockSharedTs) {
    // Mock the shared-ts module using jest.doMock (more reliable than unstable_mockModule)
    jest.doMock('@lawprotect/shared-ts', () => {
      const real = jest.requireActual('@lawprotect/shared-ts') as any;
      return {
        ...real,
        decodeCursor: mockDecodeCursor,
        listPage: mockListPage,
      };
    });
  }

  return {
    mockListPage,
    mockDecodeCursor,
    clearMocks: () => {
      mockListPage.mockClear();
      mockDecodeCursor.mockClear();
    },
    resetMocks: () => {
      mockListPage.mockReset();
      mockDecodeCursor.mockReset();
    }
  };
}

/**
 * Validates that listPage was called with expected parameters
 * @param mockListPage - The mocked listPage function
 * @param expectedLimit - Expected limit parameter
 * @param expectedCursor - Expected cursor parameter (decoded)
 * @param expectedConfig - Expected configuration object
 */
export function expectListPageCalledWith(
  mockListPage: jest.MockedFunction<any>,
  expectedLimit: number,
  expectedCursor?: any,
  expectedConfig?: any
) {
  expect(mockListPage).toHaveBeenCalledWith(
    expect.anything(), // model
    expect.anything(), // where
    expectedLimit,
    expectedCursor,
    expectedConfig
  );
}

/**
 * Validates that decodeCursor was called with expected cursor string
 * @param mockDecodeCursor - The mocked decodeCursor function
 * @param expectedCursor - Expected cursor string
 */
export function expectDecodeCursorCalledWith(
  mockDecodeCursor: jest.MockedFunction<any>,
  expectedCursor: string
) {
  expect(mockDecodeCursor).toHaveBeenCalledWith(expectedCursor);
}
