/**
 * @fileoverview testTypes - Type definitions for integration test helpers
 * @summary Provides TypeScript interfaces and types for test data structures
 * @description This module contains type definitions used across integration tests,
 * including test user data, envelope data, and other test-related structures.
 * These types ensure consistency and type safety across all test files.
 */

/**
 * Test user data structure
 */
export interface TestUser {
  userId: string;
  email: string;
  name: string;
  role: string;
}

/**
 * Envelope data structure for tests
 */
export interface EnvelopeData {
  id: string;
  title: string;
  description: string;
  status: string;
  signingOrderType: string;
  originType: string;
  createdBy: string;
  sourceKey?: string;
  metaKey?: string;
  templateId?: string;
  templateVersion?: string;
}
