/**
 * @fileoverview testDataFactory - Factory for creating test data objects
 * @summary Provides factory methods for creating test data with sensible defaults
 * @description This module contains factory methods for creating test data objects
 * used in integration tests. It provides consistent test data patterns and reduces
 * code duplication across test files.
 */

import { randomUUID } from 'crypto';

/**
 * Signer data structure for tests
 */
export interface SignerData {
  email: string;
  fullName: string;
  isExternal: boolean;
  order: number;
  userId?: string;
}

/**
 * Test data factory for creating test data
 */
export class TestDataFactory {
  /**
   * Create envelope data with defaults
   * @param overrides - Optional overrides for the envelope data
   * @returns Envelope data object
   */
  static createEnvelopeData(overrides?: Partial<{
    title: string;
    description: string;
    signingOrderType: string;
    originType: string;
    templateId: string;
    templateVersion: string;
  }>): {
    title: string;
    description: string;
    signingOrderType: string;
    originType: string;
    templateId?: string;
    templateVersion?: string;
  } {
    return {
      title: 'Test Envelope',
      description: 'Test Description',
      signingOrderType: 'OWNER_FIRST',
      originType: 'USER_UPLOAD',
      ...overrides
    };
  }

  /**
   * Create signer data with defaults
   * @param overrides - Optional overrides for the signer data
   * @returns Signer data object
   */
  static createSignerData(overrides?: Partial<SignerData>): SignerData {
    return {
      email: `signer${randomUUID().substring(0, 8)}@example.com`,
      fullName: 'Test Signer',
      isExternal: true,
      order: 1,
      ...overrides
    };
  }

  /**
   * Create multiple signers for testing
   * @param count - Number of signers to create
   * @param baseOrder - Starting order number
   * @returns Array of signer data objects
   */
  static createMultipleSigners(count: number, baseOrder: number = 1): SignerData[] {
    return Array.from({ length: count }, (_, index) => 
      this.createSignerData({
        email: `signer${index + 1}@example.com`,
        fullName: `Signer ${index + 1}`,
        order: baseOrder + index
      })
    );
  }
}
