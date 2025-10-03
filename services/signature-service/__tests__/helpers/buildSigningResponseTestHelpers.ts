/**
 * @fileoverview BuildSigningResponse Test Helpers - Reusable test utilities for buildSigningResponse tests
 * @summary Helper functions for testing buildSigningResponse functionality
 * @description This module provides reusable helper functions for creating test data,
 * performing common assertions, and handling edge cases in buildSigningResponse tests.
 * These helpers eliminate code duplication and improve test maintainability.
 */

import { TestUtils } from './testUtils';
import { signatureEnvelopeEntity } from './builders/signatureEnvelope';

/**
 * Interface for test data overrides
 */
export interface TestSigningDataOverrides {
  envelopeId?: string;
  signerId?: string;
  originalEnvelope?: {
    id?: string;
    status?: string;
  };
  responseEnvelope?: {
    id?: string;
    status?: string;
  } | null;
  signature?: {
    id?: string;
    sha256?: string;
    timestamp?: string;
  };
}

/**
 * Creates test data for buildSigningResponse tests with sensible defaults
 * @param overrides - Partial data to override defaults
 * @returns Complete test data object
 * @example
 * const testData = createTestSigningData({ 
 *   originalEnvelope: { status: 'DRAFT' },
 *   signature: { id: 'custom-id' }
 * });
 */
export function createTestSigningData(overrides: TestSigningDataOverrides = {}) {
  const envelopeId = TestUtils.generateEnvelopeId();
  const signerId = TestUtils.generateSignerId();
  
  const originalEnvelope = signatureEnvelopeEntity({
    id: envelopeId.getValue(),
    status: overrides.originalEnvelope?.status || 'DRAFT',
    ...overrides.originalEnvelope
  });

  const responseEnvelope = overrides.responseEnvelope === null 
    ? null 
    : overrides.responseEnvelope === undefined
    ? undefined
    : signatureEnvelopeEntity({
        id: envelopeId.getValue(),
        status: overrides.responseEnvelope?.status || 'COMPLETED',
        ...overrides.responseEnvelope
      });

  const signature = {
    id: overrides.signature?.id || TestUtils.generateUuid(),
    sha256: overrides.signature?.sha256 || 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
    timestamp: overrides.signature?.timestamp || '2024-01-15T10:30:00Z'
  };

  return {
    envelopeId,
    signerId,
    originalEnvelope,
    responseEnvelope,
    signature
  };
}

/**
 * Performs basic assertions for buildSigningResponse results
 * @param result - The result from buildSigningResponse
 * @param envelopeId - The envelope ID used in the test
 * @param signerId - The signer ID used in the test
 * @param signature - The signature data used in the test
 * @param expectedMessage - The expected success message
 * @example
 * assertBasicSigningResponse(result, envelopeId, signerId, signature, SigningMessages.DOCUMENT_SIGNED_SUCCESS);
 */
export function assertBasicSigningResponse(
  result: any,
  envelopeId: any,
  signerId: any,
  signature: any,
  expectedMessage: string
): void {
  expect(result.message).toBe(expectedMessage);
  expect(result.envelope.id).toBe(envelopeId.getValue());
  expect(result.signature.signerId).toBe(signerId.getValue());
  expect(result.signature.envelopeId).toBe(envelopeId.getValue());
  expect(result.signature.signedAt).toBe(signature.timestamp);
  expect(result.signature.hash).toBe(signature.sha256);
}

/**
 * Performs signature-specific assertions
 * @param result - The result from buildSigningResponse
 * @param signature - The signature data used in the test
 * @example
 * assertSignatureMetadata(result, signature);
 */
export function assertSignatureMetadata(result: any, signature: any): void {
  expect(result.signature.id).toBe(signature.id);
  expect(result.signature.signedAt).toBe(signature.timestamp);
  expect(result.signature.hash).toBe(signature.sha256);
}

/**
 * Creates edge case signature data for testing
 * @param type - Type of edge case to create
 * @returns Signature object for edge case testing
 * @example
 * const emptySignature = createEdgeCaseSignature('empty');
 * const longHashSignature = createEdgeCaseSignature('longHash');
 */
export function createEdgeCaseSignature(type: 'empty' | 'longHash' | 'specialChars' | 'numericId' | 'uuidId') {
  switch (type) {
    case 'empty':
      return {
        id: '',
        sha256: '',
        timestamp: ''
      };
    
    case 'longHash':
      return {
        id: TestUtils.generateUuid(),
        sha256: 'a'.repeat(128),
        timestamp: '2024-01-15T18:30:00Z'
      };
    
    case 'specialChars':
      return {
        id: 'signature-with-special-chars-!@#$%',
        sha256: 'special-chars-hash-!@#$%^&*()',
        timestamp: '2024-01-15T22:45:00Z'
      };
    
    case 'numericId':
      return {
        id: '12345',
        sha256: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        timestamp: '2024-01-15T20:15:00Z'
      };
    
    case 'uuidId':
      return {
        id: TestUtils.generateUuid(),
        sha256: 'fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
        timestamp: '2024-01-15T21:30:00Z'
      };
    
    default:
      throw new Error(`Unknown edge case type: ${type}`);
  }
}

/**
 * Creates test data for different envelope status scenarios
 * @param scenario - The scenario to test
 * @returns Test data for the specified scenario
 * @example
 * const draftData = createStatusScenarioData('draft');
 * const completedData = createStatusScenarioData('completed');
 */
export function createStatusScenarioData(scenario: 'draft' | 'ready' | 'completed' | 'differentIds') {
  const baseData = createTestSigningData();
  
  switch (scenario) {
    case 'draft':
      return {
        ...baseData,
        originalEnvelope: signatureEnvelopeEntity({
          id: baseData.envelopeId.getValue(),
          status: 'DRAFT'
        })
      };
    
    case 'ready':
      return {
        ...baseData,
        originalEnvelope: signatureEnvelopeEntity({
          id: baseData.envelopeId.getValue(),
          status: 'READY_FOR_SIGNATURE'
        })
      };
    
    case 'completed':
      return {
        ...baseData,
        originalEnvelope: signatureEnvelopeEntity({
          id: baseData.envelopeId.getValue(),
          status: 'COMPLETED'
        }),
        responseEnvelope: signatureEnvelopeEntity({
          id: baseData.envelopeId.getValue(),
          status: 'COMPLETED'
        })
      };
    
    case 'differentIds':
      const envelopeId1 = TestUtils.generateEnvelopeId();
      const envelopeId2 = TestUtils.generateEnvelopeId();
      return {
        ...baseData,
        envelopeId: envelopeId1,
        originalEnvelope: signatureEnvelopeEntity({
          id: envelopeId1.getValue(),
          status: 'DRAFT'
        }),
        responseEnvelope: signatureEnvelopeEntity({
          id: envelopeId2.getValue(),
          status: 'COMPLETED'
        })
      };
    
    default:
      throw new Error(`Unknown scenario: ${scenario}`);
  }
}

/**
 * Test scenarios for parametrized testing
 */
export const TEST_SCENARIOS = {
  responseEnvelopeScenarios: [
    { name: 'with response envelope', responseEnvelope: 'provided' },
    { name: 'with null response envelope', responseEnvelope: null },
    { name: 'with undefined response envelope', responseEnvelope: undefined }
  ],
  
  edgeCaseScenarios: [
    { name: 'empty signature data', type: 'empty' as const },
    { name: 'very long signature hash', type: 'longHash' as const },
    { name: 'special characters in signature data', type: 'specialChars' as const },
    { name: 'numeric signature IDs', type: 'numericId' as const },
    { name: 'UUID signature IDs', type: 'uuidId' as const }
  ],
  
  statusScenarios: [
    { name: 'DRAFT status', status: 'DRAFT' },
    { name: 'READY_FOR_SIGNATURE status', status: 'READY_FOR_SIGNATURE' },
    { name: 'COMPLETED status', status: 'COMPLETED' }
  ]
} as const;
