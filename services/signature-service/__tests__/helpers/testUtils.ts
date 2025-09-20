/**
 * @fileoverview Test utilities - Helper functions for unit tests
 * @summary Common utilities for test data generation and mocking
 * @description This file provides reusable helper functions for creating test data,
 * generating valid UUIDs, and other common test utilities.
 */

import { uuid } from '@lawprotect/shared-ts';
import { SignerId } from '@/domain/value-objects/SignerId';
import { EnvelopeId } from '@/domain/value-objects/EnvelopeId';
import { SignatureId } from '@/domain/value-objects/SignatureId';
import { ConsentId } from '@/domain/value-objects/ConsentId';

/**
 * Test data generation utilities
 */
export class TestUtils {
  /**
   * Generates a valid UUID string for testing
   * @returns A valid UUID v4 string
   */
  static generateUuid(): string {
    return uuid();
  }

  /**
   * Generates a SignerId for testing
   * @returns A valid SignerId instance
   */
  static generateSignerId(): SignerId {
    return SignerId.generate();
  }

  /**
   * Generates an EnvelopeId for testing
   * @returns A valid EnvelopeId instance
   */
  static generateEnvelopeId(): EnvelopeId {
    return EnvelopeId.generate();
  }

  /**
   * Generates a SignatureId for testing
   * @returns A valid SignatureId instance
   */
  static generateSignatureId(): SignatureId {
    return SignatureId.generate();
  }

  /**
   * Generates a ConsentId for testing
   * @returns A valid ConsentId instance
   */
  static generateConsentId(): ConsentId {
    return ConsentId.generate();
  }

  /**
   * Creates a mock value object with getValue method
   * @param value - The value to return
   * @returns A mock object with getValue method
   */
  static createMockValueObject<T>(value: T): { getValue: () => T } {
    return { getValue: () => value };
  }

  /**
   * Generates multiple UUIDs for testing
   * @param count - Number of UUIDs to generate
   * @returns Array of UUID strings
   */
  static generateUuids(count: number): string[] {
    return Array.from({ length: count }, () => this.generateUuid());
  }

  /**
   * Creates a test date string in ISO format
   * @param offsetDays - Days to offset from current date (default: 0)
   * @returns ISO date string
   */
  static createTestDate(offsetDays: number = 0): string {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    return date.toISOString();
  }

  /**
   * Creates a test email address
   * @param prefix - Email prefix (default: 'test')
   * @returns A test email address
   */
  static createTestEmail(prefix: string = 'test'): string {
    return `${prefix}@example.com`;
  }

  /**
   * Creates a test IP address
   * @returns A test IP address
   */
  static createTestIpAddress(): string {
    return '192.168.1.1';
  }

  /**
   * Creates a test user agent string
   * @returns A test user agent string
   */
  static createTestUserAgent(): string {
    return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
  }
}

