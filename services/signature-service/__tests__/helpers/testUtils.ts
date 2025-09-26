/**
 * @fileoverview Test utilities - Helper functions for unit tests
 * @summary Common utilities for test data generation and mocking
 * @description This file provides reusable helper functions for creating test data,
 * generating valid UUIDs, and other common test utilities.
 */

import { uuid, sha256Hex } from '@lawprotect/shared-ts';
import { SignerId } from '../../src/domain/value-objects/SignerId';
import { EnvelopeId } from '../../src/domain/value-objects/EnvelopeId';
import { ConsentId } from '../../src/domain/value-objects/ConsentId';
import { SignatureAuditEventId } from '../../src/domain/value-objects/SignatureAuditEventId';
import { InvitationTokenId } from '../../src/domain/value-objects/InvitationTokenId';
import { ReminderTrackingId } from '../../src/domain/value-objects/ReminderTrackingId';

/**
 * Test constants for consistent test data
 */
export const TEST_CONSTANTS = {
  /**
   * Standard IPv6 test address for testing network-related functionality
   * This is a reserved documentation IPv6 address (RFC 3849)
   */
  IPV6_TEST_ADDRESS: '2001:0db8:85a3:0000:0000:8a2e:0370:7334'
} as const;

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
   * Generates a ConsentId for testing
   * @returns A valid ConsentId instance
   */
  static generateConsentId(): ConsentId {
    return ConsentId.generate();
  }

  /**
   * Generates a SignatureAuditEventId for testing
   * @returns A valid SignatureAuditEventId instance
   */
  static generateSignatureAuditEventId(): SignatureAuditEventId {
    return SignatureAuditEventId.generate();
  }

  /**
   * Generates an InvitationTokenId for testing
   * @returns A valid InvitationTokenId instance
   */
  static generateInvitationTokenId(): InvitationTokenId {
    return InvitationTokenId.generate();
  }

  /**
   * Generates a ReminderTrackingId for testing
   * @returns A valid ReminderTrackingId instance
   */
  static generateReminderTrackingId(): ReminderTrackingId {
    return ReminderTrackingId.generate();
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
    // Import generateTestIpAddress from testHelpers to avoid circular dependency
    const { generateTestIpAddress } = require('../integration/helpers/testHelpers');
    return generateTestIpAddress();
  }

  /**
   * Creates a test user agent string
   * @returns A test user agent string
   */
  static createTestUserAgent(): string {
    return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
  }

  /**
   * Generates a valid SHA-256 hash for testing
   * @param data - The data to hash (default: random string)
   * @returns A valid SHA-256 hash (64 hex characters)
   */
  static generateSha256Hash(data?: string): string {
    const input = data || this.generateUuid();
    return sha256Hex(input);
  }

  /**
   * Generates multiple SHA-256 hashes for testing
   * @param count - Number of hashes to generate
   * @returns Array of SHA-256 hash strings
   */
  static generateSha256Hashes(count: number): string[] {
    return Array.from({ length: count }, () => this.generateSha256Hash());
  }
}

