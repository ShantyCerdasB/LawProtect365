/**
 * @fileoverview Test Utilities - Common test helper functions
 * @summary Provides utility functions for generating test data
 * @description This module provides common utility functions used across test files
 * for generating UUIDs, dates, and other test data.
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Test utility functions for generating test data
 */
export class TestUtils {
  /**
   * @description Generates a random UUID for testing
   * @returns {string} Random UUID string
   */
  static generateUuid(): string {
    return uuidv4();
  }

  /**
   * @description Generates a NotificationId-compatible UUID
   * @returns {string} UUID string for NotificationId
   */
  static generateNotificationId(): string {
    return uuidv4();
  }

  /**
   * @description Generates a test date
   * @param {string} [dateString] - Optional date string (default: current date)
   * @returns {Date} Date object
   */
  static generateDate(dateString?: string): Date {
    return dateString ? new Date(dateString) : new Date();
  }
}




