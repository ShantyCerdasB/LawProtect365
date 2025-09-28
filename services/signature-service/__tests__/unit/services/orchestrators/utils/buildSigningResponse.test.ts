/**
 * @fileoverview Unit tests for buildSigningResponse utility
 * @summary Tests for building signing response DTOs
 * @description Comprehensive test suite for buildSigningResponse utility, ensuring
 * correct construction of signing response DTOs, proper envelope handling,
 * signature metadata processing, and fallback behavior for response envelopes.
 */

import { describe, it, expect } from '@jest/globals';
import { buildSigningResponse, SigningSummary } from '../../../../../src/services/orchestrators/utils/buildSigningResponse';
import { SignatureEnvelope } from '../../../../../src/domain/entities/SignatureEnvelope';
import { EnvelopeId } from '../../../../../src/domain/value-objects/EnvelopeId';
import { SignerId } from '../../../../../src/domain/value-objects/SignerId';
import { EnvelopeStatus } from '../../../../../src/domain/value-objects/EnvelopeStatus';
import { TestUtils } from '../../../../helpers/testUtils';
import { signatureEnvelopeEntity } from '../../../../helpers/builders/signatureEnvelope';
import { SigningMessages } from '../../../../../src/domain/enums/SigningMessages';

describe('buildSigningResponse', () => {
  describe('buildSigningResponse function', () => {
    it('should build response with response envelope when provided', () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const signerId = TestUtils.generateSignerId();
      const originalEnvelope = signatureEnvelopeEntity({
        id: envelopeId.getValue(),
        status: 'DRAFT'
      });

      const responseEnvelope = signatureEnvelopeEntity({
        id: envelopeId.getValue(),
        status: 'COMPLETED'
      });

      const signature: SigningSummary = {
        id: TestUtils.generateUuid(),
        sha256: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
        timestamp: '2024-01-15T10:30:00Z'
      };

      const result = buildSigningResponse(
        responseEnvelope,
        originalEnvelope,
        signature,
        signerId,
        envelopeId
      );

      expect(result.message).toBe(SigningMessages.DOCUMENT_SIGNED_SUCCESS);
      expect(result.envelope.id).toBe(envelopeId.getValue());
      expect(result.envelope.status).toBe('COMPLETED');
      expect(result.signature.id).toBe(signature.id);
      expect(result.signature.signerId).toBe(signerId.getValue());
      expect(result.signature.envelopeId).toBe(envelopeId.getValue());
      expect(result.signature.signedAt).toBe(signature.timestamp);
      expect(result.signature.hash).toBe(signature.sha256);
    });

    it('should build response with original envelope when response envelope is null', () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const signerId = TestUtils.generateSignerId();
      const originalEnvelope = signatureEnvelopeEntity({
        id: envelopeId.getValue(),
        status: 'READY_FOR_SIGNATURE'
      });

      const signature: SigningSummary = {
        id: TestUtils.generateUuid(),
        sha256: 'b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567',
        timestamp: '2024-01-15T11:45:00Z'
      };

      const result = buildSigningResponse(
        null,
        originalEnvelope,
        signature,
        signerId,
        envelopeId
      );

      expect(result.message).toBe(SigningMessages.DOCUMENT_SIGNED_SUCCESS);
      expect(result.envelope.id).toBe(envelopeId.getValue());
      expect(result.envelope.status).toBe('READY_FOR_SIGNATURE');
      expect(result.signature.id).toBe(signature.id);
      expect(result.signature.signerId).toBe(signerId.getValue());
      expect(result.signature.envelopeId).toBe(envelopeId.getValue());
    });

    it('should build response with original envelope when response envelope is undefined', () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const signerId = TestUtils.generateSignerId();
      const originalEnvelope = signatureEnvelopeEntity({
        id: envelopeId.getValue(),
        status: 'READY_FOR_SIGNATURE'
      });

      const signature: SigningSummary = {
        id: TestUtils.generateUuid(),
        sha256: 'c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345678',
        timestamp: '2024-01-15T12:00:00Z'
      };

      const result = buildSigningResponse(
        undefined,
        originalEnvelope,
        signature,
        signerId,
        envelopeId
      );

      expect(result.message).toBe(SigningMessages.DOCUMENT_SIGNED_SUCCESS);
      expect(result.envelope.id).toBe(envelopeId.getValue());
      expect(result.envelope.status).toBe('READY_FOR_SIGNATURE');
      expect(result.signature.id).toBe(signature.id);
    });

    it('should handle different envelope statuses correctly', () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const signerId = TestUtils.generateSignerId();
      const originalEnvelope = signatureEnvelopeEntity({
        id: envelopeId.getValue(),
        status: 'DRAFT'
      });

      const responseEnvelope = signatureEnvelopeEntity({
        id: envelopeId.getValue(),
        status: 'COMPLETED'
      });

      const signature: SigningSummary = {
        id: TestUtils.generateUuid(),
        sha256: 'd4e5f6789012345678901234567890abcdef1234567890abcdef123456789',
        timestamp: '2024-01-15T13:15:00Z'
      };

      const result = buildSigningResponse(
        responseEnvelope,
        originalEnvelope,
        signature,
        signerId,
        envelopeId
      );

      expect(result.envelope.status).toBe('COMPLETED');
      expect(result.envelope.progress).toBeDefined();
    });

    it('should preserve all signature metadata correctly', () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const signerId = TestUtils.generateSignerId();
      const originalEnvelope = signatureEnvelopeEntity({
        id: envelopeId.getValue(),
        status: 'READY_FOR_SIGNATURE'
      });

      const signature: SigningSummary = {
        id: 'signature-12345',
        sha256: 'e5f6789012345678901234567890abcdef1234567890abcdef1234567890',
        timestamp: '2024-01-15T14:30:00Z'
      };

      const result = buildSigningResponse(
        originalEnvelope,
        originalEnvelope,
        signature,
        signerId,
        envelopeId
      );

      expect(result.signature.id).toBe('signature-12345');
      expect(result.signature.signerId).toBe(signerId.getValue());
      expect(result.signature.envelopeId).toBe(envelopeId.getValue());
      expect(result.signature.signedAt).toBe('2024-01-15T14:30:00Z');
      expect(result.signature.hash).toBe('e5f6789012345678901234567890abcdef1234567890abcdef1234567890');
      expect(result.signature.algorithm).toBeDefined();
    });

    it('should handle different envelope IDs correctly', () => {
      const envelopeId1 = TestUtils.generateEnvelopeId();
      const envelopeId2 = TestUtils.generateEnvelopeId();
      const signerId = TestUtils.generateSignerId();
      const originalEnvelope = signatureEnvelopeEntity({
        id: envelopeId1.getValue(),
        status: 'DRAFT'
      });

      const responseEnvelope = signatureEnvelopeEntity({
        id: envelopeId2.getValue(),
        status: 'COMPLETED'
      });

      const signature: SigningSummary = {
        id: TestUtils.generateUuid(),
        sha256: 'f6789012345678901234567890abcdef1234567890abcdef1234567890ab',
        timestamp: '2024-01-15T15:45:00Z'
      };

      const result = buildSigningResponse(
        responseEnvelope,
        originalEnvelope,
        signature,
        signerId,
        envelopeId1
      );

      expect(result.envelope.id).toBe(envelopeId2.getValue());
      expect(result.signature.envelopeId).toBe(envelopeId1.getValue());
    });

    it('should handle different signer IDs correctly', () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const signerId1 = TestUtils.generateSignerId();
      const signerId2 = TestUtils.generateSignerId();
      const originalEnvelope = signatureEnvelopeEntity({
        id: envelopeId.getValue(),
        status: 'READY_FOR_SIGNATURE'
      });

      const signature: SigningSummary = {
        id: TestUtils.generateUuid(),
        sha256: '6789012345678901234567890abcdef1234567890abcdef1234567890abcd',
        timestamp: '2024-01-15T16:00:00Z'
      };

      const result = buildSigningResponse(
        originalEnvelope,
        originalEnvelope,
        signature,
        signerId1,
        envelopeId
      );

      expect(result.signature.signerId).toBe(signerId1.getValue());
    });

    it('should use standardized success message', () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const signerId = TestUtils.generateSignerId();
      const originalEnvelope = signatureEnvelopeEntity({
        id: envelopeId.getValue(),
        status: 'COMPLETED'
      });

      const signature: SigningSummary = {
        id: TestUtils.generateUuid(),
        sha256: '789012345678901234567890abcdef1234567890abcdef1234567890abcde',
        timestamp: '2024-01-15T17:15:00Z'
      };

      const result = buildSigningResponse(
        originalEnvelope,
        originalEnvelope,
        signature,
        signerId,
        envelopeId
      );

      expect(result.message).toBe(SigningMessages.DOCUMENT_SIGNED_SUCCESS);
    });

    it('should handle edge case with empty signature data', () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const signerId = TestUtils.generateSignerId();
      const originalEnvelope = signatureEnvelopeEntity({
        id: envelopeId.getValue(),
        status: 'DRAFT'
      });

      const signature: SigningSummary = {
        id: '',
        sha256: '',
        timestamp: ''
      };

      const result = buildSigningResponse(
        originalEnvelope,
        originalEnvelope,
        signature,
        signerId,
        envelopeId
      );

      expect(result.signature.id).toBe('');
      expect(result.signature.hash).toBe('');
      expect(result.signature.signedAt).toBe('');
    });

    it('should handle edge case with very long signature hash', () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const signerId = TestUtils.generateSignerId();
      const originalEnvelope = signatureEnvelopeEntity({
        id: envelopeId.getValue(),
        status: 'READY_FOR_SIGNATURE'
      });

      const longHash = 'a'.repeat(128);
      const signature: SigningSummary = {
        id: TestUtils.generateUuid(),
        sha256: longHash,
        timestamp: '2024-01-15T18:30:00Z'
      };

      const result = buildSigningResponse(
        originalEnvelope,
        originalEnvelope,
        signature,
        signerId,
        envelopeId
      );

      expect(result.signature.hash).toBe(longHash);
      expect(result.signature.hash.length).toBe(128);
    });
  });

  describe('SigningSummary type', () => {
    it('should accept valid signature summary data', () => {
      const signature: SigningSummary = {
        id: 'signature-123',
        sha256: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        timestamp: '2024-01-15T19:00:00Z'
      };

      expect(signature.id).toBe('signature-123');
      expect(signature.sha256).toBe('abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890');
      expect(signature.timestamp).toBe('2024-01-15T19:00:00Z');
    });

    it('should handle numeric signature IDs', () => {
      const signature: SigningSummary = {
        id: '12345',
        sha256: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        timestamp: '2024-01-15T20:15:00Z'
      };

      expect(signature.id).toBe('12345');
    });

    it('should handle UUID signature IDs', () => {
      const uuid = TestUtils.generateUuid();
      const signature: SigningSummary = {
        id: uuid,
        sha256: 'fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
        timestamp: '2024-01-15T21:30:00Z'
      };

      expect(signature.id).toBe(uuid);
    });
  });

  describe('Edge cases', () => {
    it('should handle special characters in signature data', () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const signerId = TestUtils.generateSignerId();
      const originalEnvelope = signatureEnvelopeEntity({
        id: envelopeId.getValue(),
        status: 'COMPLETED'
      });

      const signature: SigningSummary = {
        id: 'signature-with-special-chars-!@#$%',
        sha256: 'special-chars-hash-!@#$%^&*()',
        timestamp: '2024-01-15T22:45:00Z'
      };

      const result = buildSigningResponse(
        originalEnvelope,
        originalEnvelope,
        signature,
        signerId,
        envelopeId
      );

      expect(result.signature.id).toBe('signature-with-special-chars-!@#$%');
      expect(result.signature.hash).toBe('special-chars-hash-!@#$%^&*()');
    });

    it('should handle different timestamp formats', () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const signerId = TestUtils.generateSignerId();
      const originalEnvelope = signatureEnvelopeEntity({
        id: envelopeId.getValue(),
        status: 'READY_FOR_SIGNATURE'
      });

      const signature: SigningSummary = {
        id: TestUtils.generateUuid(),
        sha256: 'timestamp-test-hash-1234567890abcdef1234567890abcdef1234567890',
        timestamp: '2024-01-15T23:59:59.999Z'
      };

      const result = buildSigningResponse(
        originalEnvelope,
        originalEnvelope,
        signature,
        signerId,
        envelopeId
      );

      expect(result.signature.signedAt).toBe('2024-01-15T23:59:59.999Z');
    });
  });
});
