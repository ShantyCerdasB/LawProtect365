/**
 * @fileoverview EnvelopeHashService.test.ts - Unit tests for EnvelopeHashService
 * @summary Tests for hash management functionality
 * @description Comprehensive test suite for EnvelopeHashService covering all methods and edge cases
 */

import { jest } from '@jest/globals';
import { EnvelopeHashService } from '../../../../src/services/envelopeHashService/EnvelopeHashService';
import { SignatureEnvelopeRepository } from '../../../../src/repositories/SignatureEnvelopeRepository';
import { AuditEventService } from '../../../../src/services/audit/AuditEventService';

// Mock dependencies
jest.mock('../../../../src/repositories/SignatureEnvelopeRepository');
jest.mock('../../../../src/services/audit/AuditEventService');

describe('EnvelopeHashService', () => {
  let service: EnvelopeHashService;
  let mockSignatureEnvelopeRepository: jest.Mocked<SignatureEnvelopeRepository>;
  let mockAuditEventService: jest.Mocked<AuditEventService>;

  beforeEach(() => {
    mockSignatureEnvelopeRepository = {
      findById: jest.fn(),
      update: jest.fn(),
      updateHashes: jest.fn(),
      updateSignedDocument: jest.fn(),
      updateFlattenedKey: jest.fn(),
    } as any;

    mockAuditEventService = {
      create: jest.fn(),
      createSignerEvent: jest.fn(),
    } as any;

    service = new EnvelopeHashService(
      mockSignatureEnvelopeRepository,
      mockAuditEventService
    );
  });

  describe('updateHashes', () => {
    it('should update hashes successfully', async () => {
      const envelopeId = 'test-envelope-id';
      const hashes = {
        sourceSha256: 'source-hash',
        signedSha256: 'signed-hash',
        flattenedSha256: 'flattened-hash'
      };

      const mockEnvelope = {
        getId: jest.fn(() => ({ getValue: () => envelopeId })),
        getTitle: jest.fn(() => 'Test Envelope'),
        updateHashes: jest.fn(),
      };

      mockSignatureEnvelopeRepository.updateHashes.mockResolvedValue(mockEnvelope as any);
      mockAuditEventService.create.mockResolvedValue({} as any);

      const result = await service.updateHashes(
        { getValue: () => envelopeId } as any,
        hashes,
        'test-user-id'
      );

      expect(result).toBe(mockEnvelope);
      expect(mockSignatureEnvelopeRepository.updateHashes).toHaveBeenCalledWith(
        expect.any(Object),
        hashes
      );
      expect(mockAuditEventService.create).toHaveBeenCalled();
    });

    it('should handle envelope not found', async () => {
      const envelopeId = 'non-existent-envelope';
      const hashes = {
        sourceSha256: 'source-hash',
        signedSha256: 'signed-hash',
        flattenedSha256: 'flattened-hash'
      };

      mockSignatureEnvelopeRepository.updateHashes.mockRejectedValue(new Error('Envelope not found'));

      await expect(
        service.updateHashes(
          { getValue: () => envelopeId } as any,
          hashes
        )
      ).rejects.toThrow('Envelope update failed');
    });

    it('should handle repository errors', async () => {
      const envelopeId = 'test-envelope-id';
      const hashes = {
        sourceSha256: 'source-hash',
        signedSha256: 'signed-hash',
        flattenedSha256: 'flattened-hash'
      };

      mockSignatureEnvelopeRepository.updateHashes.mockRejectedValue(new Error('Database error'));

      await expect(
        service.updateHashes(
          { getValue: () => envelopeId } as any,
          hashes
        )
      ).rejects.toThrow('Envelope update failed');
    });
  });

  describe('updateSignedDocument', () => {
    it('should update signed document successfully', async () => {
      const envelopeId = 'test-envelope-id';
      const signedDocumentKey = 'signed-document-key';
      const signedDocumentHash = 'signed-hash';

      const mockEnvelope = {
        getId: jest.fn(() => ({ getValue: () => envelopeId })),
        getTitle: jest.fn(() => 'Test Envelope'),
        updateSignedDocument: jest.fn(),
      };

      mockSignatureEnvelopeRepository.updateSignedDocument.mockResolvedValue(mockEnvelope as any);
      mockAuditEventService.createSignerEvent.mockResolvedValue({} as any);

      const result = await service.updateSignedDocument(
        { getValue: () => envelopeId } as any,
        signedDocumentKey,
        signedDocumentHash,
        'test-signer-id',
        'test-user-id'
      );

      expect(result).toBe(mockEnvelope);
      expect(mockSignatureEnvelopeRepository.updateSignedDocument).toHaveBeenCalledWith(
        expect.any(Object),
        signedDocumentKey,
        signedDocumentHash
      );
      expect(mockAuditEventService.createSignerEvent).toHaveBeenCalled();
    });

    it('should handle envelope not found for signed document update', async () => {
      const envelopeId = 'non-existent-envelope';
      const signedDocumentKey = 'signed-document-key';
      const signedDocumentHash = 'signed-hash';

      mockSignatureEnvelopeRepository.updateSignedDocument.mockRejectedValue(new Error('Envelope not found'));

      await expect(
        service.updateSignedDocument(
          { getValue: () => envelopeId } as any,
          signedDocumentKey,
          signedDocumentHash,
          'test-signer-id',
          'test-user-id'
        )
      ).rejects.toThrow('Envelope update failed');
    });
  });

  describe('updateFlattenedKey', () => {
    it('should update flattened key successfully', async () => {
      const envelopeId = 'test-envelope-id';
      const flattenedKey = 'flattened-key';

      const mockEnvelope = {
        getId: jest.fn(() => ({ getValue: () => envelopeId })),
        getTitle: jest.fn(() => 'Test Envelope'),
        updateFlattenedKey: jest.fn(),
      };

      mockSignatureEnvelopeRepository.updateFlattenedKey.mockResolvedValue(mockEnvelope as any);
      mockAuditEventService.create.mockResolvedValue({} as any);

      const result = await service.updateFlattenedKey(
        { getValue: () => envelopeId } as any,
        flattenedKey,
        'test-user-id'
      );

      expect(result).toBe(mockEnvelope);
      expect(mockSignatureEnvelopeRepository.updateFlattenedKey).toHaveBeenCalledWith(
        expect.any(Object),
        flattenedKey
      );
      expect(mockAuditEventService.create).toHaveBeenCalled();
    });

    it('should handle envelope not found for flattened key update', async () => {
      const envelopeId = 'non-existent-envelope';
      const flattenedKey = 'flattened-key';

      mockSignatureEnvelopeRepository.updateFlattenedKey.mockRejectedValue(new Error('Envelope not found'));

      await expect(
        service.updateFlattenedKey(
          { getValue: () => envelopeId } as any,
          flattenedKey,
          'test-user-id'
        )
      ).rejects.toThrow('Envelope update failed');
    });
  });
});