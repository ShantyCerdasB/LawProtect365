/**
 * @fileoverview Test utilities - Helper functions for unit tests
 * @summary Common utilities for test data generation and mocking
 * @description This file provides reusable helper functions for creating test data,
 * generating valid UUIDs, and other common test utilities.
 */

import { uuid } from '@lawprotect/shared-ts';
import { randomBytes } from 'node:crypto';

/**
 * @description Test constants for consistent test data
 */
export const TEST_CONSTANTS = {
  /**
   * Standard IPv6 test address for testing network-related functionality
   * This is a reserved documentation IPv6 address (RFC 3849)
   */
  IPV6_TEST_ADDRESS: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
  /**
   * Test Cognito User Pool ID
   */
  TEST_USER_POOL_ID: 'us-east-1_test123',
  /**
   * Test Cognito Client ID
   */
  TEST_CLIENT_ID: 'test-client-id-123',
  /**
   * Test AWS Request ID
   */
  TEST_REQUEST_ID: 'test-request-id-123'
} as const;

/**
 * @description Test data generation utilities
 */
export class TestUtils {
  /**
   * @description Generates a valid UUID string for testing.
   * @returns {string} A valid UUID v4 string
   */
  static generateUuid(): string {
    return uuid();
  }

  /**
   * @description Generates multiple UUIDs for testing.
   * @param {number} count - Number of UUIDs to generate
   * @returns {string[]} Array of UUID strings
   */
  static generateUuids(count: number): string[] {
    return Array.from({ length: count }, () => this.generateUuid());
  }

  /**
   * @description Creates a test date string in ISO format.
   * @param {number} offsetDays - Days to offset from current date (default: 0)
   * @returns {string} ISO date string
   */
  static createTestDate(offsetDays: number = 0): string {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    return date.toISOString();
  }

  /**
   * @description Creates a test email address.
   * @param {string} prefix - Email prefix (default: 'test')
   * @returns {string} A test email address
   */
  static createTestEmail(prefix: string = 'test'): string {
    return `${prefix}@example.com`;
  }

  /**
   * @description Creates a test IP address.
   * @returns {string} A test IP address
   */
  static createTestIpAddress(): string {
    const thirdOctet = randomBytes(1)[0];
    const fourthOctet = randomBytes(1)[0];
    return `192.168.${thirdOctet}.${fourthOctet}`;
  }

  /**
   * @description Creates a test user agent string.
   * @returns {string} A test user agent string
   */
  static createTestUserAgent(): string {
    return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
  }

  /**
   * @description Generates a test Cognito sub (user identifier).
   * @returns {string} A test Cognito sub
   */
  static generateCognitoSub(): string {
    return `cognito-sub-${this.generateUuid()}`;
  }
}

/**
 * @description Generate a random test IP address
 * @returns {string} Random IP address in the 192.168.x.x range for testing
 */
export const generateTestIpAddress = (): string => {
  return TestUtils.createTestIpAddress();
};

