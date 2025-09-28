/**
 * @fileoverview S3Service Mock - Reusable mock for S3Service
 * @summary Mock implementation for S3Service in tests
 * @description Provides mock implementations for S3Service methods
 * to be used across different test scenarios.
 */

import { jest } from '@jest/globals';

/**
 * Creates a mock S3Service with default implementations
 * @returns Mock S3Service with jest functions
 */
export function createS3ServiceMock() {
  return {
    upload: jest.fn() as jest.MockedFunction<any>,
    download: jest.fn() as jest.MockedFunction<any>,
    delete: jest.fn() as jest.MockedFunction<any>,
    getSignedUrl: jest.fn() as jest.MockedFunction<any>,
    copyObject: jest.fn() as jest.MockedFunction<any>,
    headObject: jest.fn() as jest.MockedFunction<any>,
    assertExists: jest.fn() as jest.MockedFunction<any>
  };
}
