/**
 * @fileoverview SignatureOrchestrator Mock - Reusable mock for SignatureOrchestrator
 * @summary Mock implementation for SignatureOrchestrator in tests
 * @description Provides mock implementations for SignatureOrchestrator methods
 * to be used across different test scenarios.
 */

import { jest } from '@jest/globals';

/**
 * Creates a mock SignatureOrchestrator with default implementations
 * @returns Mock SignatureOrchestrator with jest functions
 */
export function createSignatureOrchestratorMock() {
  return {
    getAuditTrail: jest.fn() as jest.MockedFunction<any>,
    cancelEnvelope: jest.fn() as jest.MockedFunction<any>,
    createEnvelope: jest.fn() as jest.MockedFunction<any>,
    declineSigner: jest.fn() as jest.MockedFunction<any>,
    downloadDocument: jest.fn() as jest.MockedFunction<any>,
    getEnvelope: jest.fn() as jest.MockedFunction<any>,
    listEnvelopesByUser: jest.fn() as jest.MockedFunction<any>,
    sendEnvelope: jest.fn() as jest.MockedFunction<any>,
    sendReminders: jest.fn() as jest.MockedFunction<any>,
    shareDocumentView: jest.fn() as jest.MockedFunction<any>,
    signDocument: jest.fn() as jest.MockedFunction<any>,
    updateEnvelope: jest.fn() as jest.MockedFunction<any>
  };
}
