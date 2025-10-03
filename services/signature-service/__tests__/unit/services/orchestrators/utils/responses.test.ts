/**
 * @fileoverview Unit tests for responses utility
 * @summary Tests for building signing response DTOs
 * @description Comprehensive test suite for responses utility, ensuring
 * correct construction of signing response DTOs, proper envelope handling,
 * signature metadata processing, and fallback behavior for response envelopes.
 */

import { describe, it, expect } from '@jest/globals';
import { buildSigningResponse } from '../../../../../src/services/orchestrators/utils/responses';
import { TestUtils } from '../../../../helpers/testUtils';
import { SigningMessages } from '../../../../../src/domain/enums/SigningMessages';
import { 
  createTestSigningData, 
  assertBasicSigningResponse, 
  assertSignatureMetadata,
  createEdgeCaseSignature,
  createStatusScenarioData,
  TEST_SCENARIOS
} from '../../../../helpers/buildSigningResponseTestHelpers';

describe('responses utility', () => {
  describe('buildSigningResponse function', () => {
    it('should build response with response envelope when provided', () => {
      const testData = createTestSigningData({
        originalEnvelope: { status: 'DRAFT' },
        responseEnvelope: { status: 'COMPLETED' }
      });

      const result = buildSigningResponse(
        testData.responseEnvelope,
        testData.originalEnvelope,
        testData.signature,
        testData.signerId,
        testData.envelopeId
      );

      assertBasicSigningResponse(result, testData.envelopeId, testData.signerId, testData.signature, SigningMessages.DOCUMENT_SIGNED_SUCCESS);
      expect(result.envelope.status).toBe('COMPLETED');
      expect(result.signature.id).toBe(testData.signature.id);
    });

    describe.each(TEST_SCENARIOS.responseEnvelopeScenarios)(
      'should build response $name',
      ({ responseEnvelope }) => {
        it(`should build response ${(() => {
          if (responseEnvelope === null) return 'with null';
          if (responseEnvelope === undefined) return 'with undefined';
          return 'with provided';
        })()} response envelope`, () => {
          const testData = createTestSigningData({
            originalEnvelope: { status: 'READY_FOR_SIGNATURE' },
            responseEnvelope: responseEnvelope === 'provided' ? { status: 'COMPLETED' } : responseEnvelope
          });

          const result = buildSigningResponse(
            testData.responseEnvelope,
            testData.originalEnvelope,
            testData.signature,
            testData.signerId,
            testData.envelopeId
          );

          assertBasicSigningResponse(result, testData.envelopeId, testData.signerId, testData.signature, SigningMessages.DOCUMENT_SIGNED_SUCCESS);
          expect(result.envelope.status).toBe(testData.responseEnvelope ? 'COMPLETED' : 'READY_FOR_SIGNATURE');
          expect(result.signature.id).toBe(testData.signature.id);
        });
      }
    );

    it('should handle different envelope statuses correctly', () => {
      const testData = createTestSigningData({
        originalEnvelope: { status: 'DRAFT' },
        responseEnvelope: { status: 'COMPLETED' }
      });

      const result = buildSigningResponse(
        testData.responseEnvelope,
        testData.originalEnvelope,
        testData.signature,
        testData.signerId,
        testData.envelopeId
      );

      expect(result.envelope.status).toBe('COMPLETED');
      expect(result.envelope.progress).toBeDefined();
    });

    it('should preserve all signature metadata correctly', () => {
      const testData = createTestSigningData({
        originalEnvelope: { status: 'READY_FOR_SIGNATURE' },
        signature: {
          id: 'signature-12345',
          sha256: 'e5f6789012345678901234567890abcdef1234567890abcdef1234567890',
          timestamp: '2024-01-15T14:30:00Z'
        }
      });

      const result = buildSigningResponse(
        testData.originalEnvelope,
        testData.originalEnvelope,
        testData.signature,
        testData.signerId,
        testData.envelopeId
      );

      assertSignatureMetadata(result, testData.signature);
      expect(result.signature.signerId).toBe(testData.signerId.getValue());
      expect(result.signature.envelopeId).toBe(testData.envelopeId.getValue());
      expect(result.signature.algorithm).toBeDefined();
    });

    it('should handle different envelope IDs correctly', () => {
      const testData = createStatusScenarioData('differentIds');

      const result = buildSigningResponse(
        testData.responseEnvelope,
        testData.originalEnvelope,
        testData.signature,
        testData.signerId,
        testData.envelopeId
      );

      expect(result.envelope.id).toBe(testData.responseEnvelope?.getId()?.getValue());
      expect(result.signature.envelopeId).toBe(testData.envelopeId.getValue());
    });

    it('should handle different signer IDs correctly', () => {
      const testData = createTestSigningData({
        originalEnvelope: { status: 'READY_FOR_SIGNATURE' }
      });

      const result = buildSigningResponse(
        testData.originalEnvelope,
        testData.originalEnvelope,
        testData.signature,
        testData.signerId,
        testData.envelopeId
      );

      expect(result.signature.signerId).toBe(testData.signerId.getValue());
    });

    it('should use standardized success message from enum', () => {
      const testData = createTestSigningData({
        originalEnvelope: { status: 'COMPLETED' }
      });

      const result = buildSigningResponse(
        testData.originalEnvelope,
        testData.originalEnvelope,
        testData.signature,
        testData.signerId,
        testData.envelopeId
      );

      expect(result.message).toBe(SigningMessages.DOCUMENT_SIGNED_SUCCESS);
    });

    describe.each(TEST_SCENARIOS.edgeCaseScenarios)(
      'should handle edge case $name',
      ({ type }) => {
        it(`should handle edge case with ${type}`, () => {
          const testData = createTestSigningData({
            originalEnvelope: { status: 'DRAFT' }
          });
          
          // Override signature for edge cases
          const edgeCaseSignature = createEdgeCaseSignature(type);
          testData.signature = edgeCaseSignature;

          const result = buildSigningResponse(
            testData.originalEnvelope,
            testData.originalEnvelope,
            testData.signature,
            testData.signerId,
            testData.envelopeId
          );

          if (type === 'empty') {
            expect(result.signature.id).toBe('');
            expect(result.signature.hash).toBe('');
            expect(result.signature.signedAt).toBe('');
          } else if (type === 'longHash') {
            expect(result.signature.hash).toBe(testData.signature.sha256);
            expect(result.signature.hash.length).toBe(128);
          } else {
            assertSignatureMetadata(result, testData.signature);
          }
        });
      }
    );

    it('should handle different timestamp formats', () => {
      const testData = createTestSigningData({
        originalEnvelope: { status: 'READY_FOR_SIGNATURE' },
        signature: {
          id: TestUtils.generateUuid(),
          sha256: 'timestamp-test-hash-1234567890abcdef1234567890abcdef1234567890',
          timestamp: '2024-01-15T23:59:59.999Z'
        }
      });

      const result = buildSigningResponse(
        testData.originalEnvelope,
        testData.originalEnvelope,
        testData.signature,
        testData.signerId,
        testData.envelopeId
      );

      expect(result.signature.signedAt).toBe('2024-01-15T23:59:59.999Z');
    });
  });
});

