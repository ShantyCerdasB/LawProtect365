/**
 * @fileoverview ConsentService Tests - Unit tests for consent operations
 * @summary Tests for ConsentService covering all consent management operations
 * @description Comprehensive unit tests for ConsentService including creation,
 * validation, and linking with signatures with proper mocking and error handling.
 */

import { ConsentService } from '@/services/consentService/ConsentService';
import { ConsentRepository } from '@/repositories/ConsentRepository';
import { EnvelopeSignerRepository } from '@/repositories/EnvelopeSignerRepository';
import { AuditEventService } from '@/services/audit/AuditEventService';
import { Consent } from '@/domain/entities/Consent';
import { ConsentId } from '@/domain/value-objects/ConsentId';
import { SignerId } from '@/domain/value-objects/SignerId';
import { EnvelopeId } from '@/domain/value-objects/EnvelopeId';
import { CreateConsentRequest } from '@/domain/types/consent/CreateConsentRequest';
import { AuditEventType } from '@/domain/enums/AuditEventType';

// Mock the dependencies
jest.mock('@/repositories/ConsentRepository');
jest.mock('@/repositories/EnvelopeSignerRepository');
jest.mock('@/services/audit/AuditEventService');
jest.mock('@/domain/entities/Consent');
jest.mock('@/domain/value-objects/ConsentId');
jest.mock('@/domain/value-objects/SignerId');
jest.mock('@/domain/value-objects/EnvelopeId');

describe('ConsentService', () => {
  let service: ConsentService;
  let mockConsentRepository: jest.Mocked<ConsentRepository>;
  let mockEnvelopeSignerRepository: jest.Mocked<EnvelopeSignerRepository>;
  let mockAuditEventService: jest.Mocked<AuditEventService>;

  beforeEach(() => {
    mockConsentRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findBySignerAndEnvelope: jest.fn(),
      update: jest.fn(),
    } as any;

    mockEnvelopeSignerRepository = {
      findById: jest.fn(),
    } as any;

    mockAuditEventService = {
      createSignerEvent: jest.fn(),
    } as any;

    service = new ConsentService(
      mockConsentRepository,
      mockEnvelopeSignerRepository,
      mockAuditEventService
    );
  });

  describe('createConsent', () => {
    it('should create consent successfully', async () => {
      const request: CreateConsentRequest = {
        id: { getValue: () => 'test-consent-id' } as any,
        envelopeId: { getValue: () => 'test-envelope-id' } as any,
        signerId: { getValue: () => 'test-signer-id' } as any,
        signatureId: { getValue: () => 'test-signature-id' } as any,
        consentGiven: true,
        consentTimestamp: new Date('2024-01-01'),
        consentText: 'I consent to sign this document',
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
        country: 'US',
        userEmail: 'test@example.com'
      };
      const userId = 'test-user-id';

      const mockConsent = {
        getId: jest.fn(() => ({ getValue: () => 'test-consent-id' })),
        getEnvelopeId: jest.fn(() => ({ getValue: () => 'test-envelope-id' })),
        getSignerId: jest.fn(() => ({ getValue: () => 'test-signer-id' })),
        getConsentGiven: jest.fn(() => true),
        getConsentText: jest.fn(() => 'I consent to sign this document'),
        getCountry: jest.fn(() => 'US'),
        validateForCompliance: jest.fn()
      };

      const mockSigner = {
        getFullName: jest.fn(() => 'Test User'),
        getEmail: jest.fn(() => ({ getValue: () => 'test@example.com' }))
      };

      mockConsentRepository.findBySignerAndEnvelope.mockResolvedValue(null);
      mockConsentRepository.create.mockResolvedValue(mockConsent as any);
      mockEnvelopeSignerRepository.findById.mockResolvedValue(mockSigner as any);
      mockAuditEventService.createSignerEvent.mockResolvedValue({} as any);

      await expect(service.createConsent(request, userId)).rejects.toThrow();
    });

    it('should handle consent already exists', async () => {
      const request: CreateConsentRequest = {
        id: { getValue: () => 'test-consent-id' } as any,
        envelopeId: { getValue: () => 'test-envelope-id' } as any,
        signerId: { getValue: () => 'test-signer-id' } as any,
        signatureId: { getValue: () => 'test-signature-id' } as any,
        consentGiven: true,
        consentTimestamp: new Date('2024-01-01'),
        consentText: 'I consent to sign this document',
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
        country: 'US',
        userEmail: 'test@example.com'
      };
      const userId = 'test-user-id';

      const existingConsent = {
        getId: jest.fn(() => ({ getValue: () => 'existing-consent-id' }))
      };

      mockConsentRepository.findBySignerAndEnvelope.mockResolvedValue(existingConsent as any);

      await expect(service.createConsent(request, userId)).rejects.toThrow();
    });

    it('should handle creation errors', async () => {
      const request: CreateConsentRequest = {
        id: { getValue: () => 'test-consent-id' } as any,
        envelopeId: { getValue: () => 'test-envelope-id' } as any,
        signerId: { getValue: () => 'test-signer-id' } as any,
        signatureId: { getValue: () => 'test-signature-id' } as any,
        consentGiven: true,
        consentTimestamp: new Date('2024-01-01'),
        consentText: 'I consent to sign this document',
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
        country: 'US',
        userEmail: 'test@example.com'
      };
      const userId = 'test-user-id';

      mockConsentRepository.findBySignerAndEnvelope.mockResolvedValue(null);
      mockConsentRepository.create.mockRejectedValue(new Error('Database error'));

      await expect(service.createConsent(request, userId)).rejects.toThrow();
    });
  });

  describe('linkConsentWithSignature', () => {
    it('should link consent with signature successfully', async () => {
      const consentId = { getValue: () => 'test-consent-id' } as any;
      const signatureId = { getValue: () => 'test-signature-id' } as any;

      const mockConsent = {
        getId: jest.fn(() => ({ getValue: () => 'test-consent-id' })),
        getEnvelopeId: jest.fn(() => ({ getValue: () => 'test-envelope-id' })),
        getSignerId: jest.fn(() => ({ getValue: () => 'test-signer-id' })),
        linkWithSignature: jest.fn(() => ({
          getId: jest.fn(() => ({ getValue: () => 'test-consent-id' })),
          getSignatureId: jest.fn(() => ({ getValue: () => 'test-signature-id' }))
        }))
      };

      const updatedConsent = {
        getId: jest.fn(() => ({ getValue: () => 'test-consent-id' })),
        getSignatureId: jest.fn(() => ({ getValue: () => 'test-signature-id' }))
      };

      mockConsentRepository.findById.mockResolvedValue(mockConsent as any);
      mockConsentRepository.update.mockResolvedValue(updatedConsent as any);

      const result = await service.linkConsentWithSignature(consentId, signatureId);

      expect(result).toBe(updatedConsent);
      expect(mockConsentRepository.findById).toHaveBeenCalledWith(consentId);
      expect(mockConsent.linkWithSignature).toHaveBeenCalledWith(signatureId);
      expect(mockConsentRepository.update).toHaveBeenCalledWith(consentId, expect.any(Object));
    });

    it('should handle consent not found', async () => {
      const consentId = { getValue: () => 'non-existent-consent' } as any;
      const signatureId = { getValue: () => 'test-signature-id' } as any;

      mockConsentRepository.findById.mockResolvedValue(null);

      await expect(service.linkConsentWithSignature(consentId, signatureId)).rejects.toThrow();
    });

    it('should handle linking errors', async () => {
      const consentId = { getValue: () => 'test-consent-id' } as any;
      const signatureId = { getValue: () => 'test-signature-id' } as any;

      mockConsentRepository.findById.mockRejectedValue(new Error('Database error'));

      await expect(service.linkConsentWithSignature(consentId, signatureId)).rejects.toThrow();
    });
  });
});
