/**
 * @fileoverview ConsentService Tests - Unit tests for consent operations
 * @summary Tests for ConsentService covering all consent management operations
 * @description Comprehensive unit tests for ConsentService including creation,
 * validation, and linking with signatures with proper mocking and error handling.
 */

import { generateTestIpAddress } from '../../../helpers/testUtils';
import { ConsentService } from '../../../../src/services/consentService/ConsentService';
import { ConsentRepository } from '../../../../src/repositories/ConsentRepository';
import { EnvelopeSignerRepository } from '../../../../src/repositories/EnvelopeSignerRepository';
import { AuditEventService } from '../../../../src/services/audit/AuditEventService';
import { Consent } from '../../../../src/domain/entities/Consent';
import { CreateConsentRequest } from '../../../../src/domain/types/consent/CreateConsentRequest';

// Mock the dependencies
jest.mock('../../../../src/repositories/ConsentRepository');
jest.mock('../../../../src/repositories/EnvelopeSignerRepository');
jest.mock('../../../../src/services/audit/AuditEventService');

// Helper functions to reduce nesting and improve readability
function createExistingConsent() {
  return {
    getId: jest.fn(() => ({ getValue: () => 'existing-consent-id' }))
  };
}

function createTestConsentRequest(): CreateConsentRequest {
  return {
    id: { getValue: () => 'test-consent-id' } as any,
    envelopeId: { getValue: () => 'test-envelope-id' } as any,
    signerId: { getValue: () => 'test-signer-id' } as any,
    signatureId: { getValue: () => 'test-signature-id' } as any,
    consentGiven: true,
    consentTimestamp: new Date('2024-01-01'),
    consentText: 'I consent to sign this document',
    ipAddress: generateTestIpAddress(),
    userAgent: 'TestAgent/1.0',
    country: 'US',
    userEmail: 'test@example.com'
  };
}

function createMockConsent() {
  return {
    getId: jest.fn(() => ({ getValue: () => 'test-consent-id' })),
    getEnvelopeId: jest.fn(() => ({ getValue: () => 'test-envelope-id' })),
    getSignerId: jest.fn(() => ({ getValue: () => 'test-signer-id' })),
    getConsentGiven: jest.fn(() => true),
    getConsentText: jest.fn(() => 'I consent to sign this document'),
    getCountry: jest.fn(() => 'US'),
    validateForCompliance: jest.fn()
  };
}

function createMockSigner() {
  return {
    getFullName: jest.fn(() => 'Test User'),
    getEmail: jest.fn(() => ({ getValue: () => 'test@example.com' }))
  };
}

function createMockConsentWithLink() {
  return {
    getId: jest.fn(() => ({ getValue: () => 'test-consent-id' })),
    getEnvelopeId: jest.fn(() => ({ getValue: () => 'test-envelope-id' })),
    getSignerId: jest.fn(() => ({ getValue: () => 'test-signer-id' })),
    linkWithSignature: jest.fn(() => ({
      getId: jest.fn(() => ({ getValue: () => 'test-consent-id' })),
      getSignatureId: jest.fn(() => ({ getValue: () => 'test-signature-id' }))
    }))
  };
}

function createMockUpdatedConsent() {
  return {
    getId: jest.fn(() => ({ getValue: () => 'test-consent-id' })),
    getSignatureId: jest.fn(() => ({ getValue: () => 'test-signature-id' }))
  };
}

// Mock the Consent entity
jest.mock('../../../../src/domain/entities/Consent', () => ({
  Consent: {
    create: jest.fn().mockImplementation(() => ({
      getId: jest.fn(() => ({ getValue: () => 'test-consent-id' })),
      getEnvelopeId: jest.fn(() => ({ getValue: () => 'test-envelope-id' })),
      getSignerId: jest.fn(() => ({ getValue: () => 'test-signer-id' })),
      getConsentGiven: jest.fn(() => true),
      getConsentText: jest.fn(() => 'I consent to sign this document'),
      getCountry: jest.fn(() => 'US'),
      validateForCompliance: jest.fn()
    }))
  }
}));
jest.mock('../../../../src/domain/entities/Consent');

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

  describe('Create Consent - Success Cases', () => {
    it('should create consent successfully', async () => {
      const request = createTestConsentRequest();
      const userId = 'test-user-id';

      const mockConsent = createMockConsent();
      const mockSigner = createMockSigner();

      mockConsentRepository.findBySignerAndEnvelope.mockResolvedValue(null);
      mockConsentRepository.create.mockResolvedValue(mockConsent as any);
      mockEnvelopeSignerRepository.findById.mockResolvedValue(mockSigner as any);
      mockAuditEventService.createSignerEvent.mockResolvedValue({} as any);

      const result = await service.createConsent(request, userId);
      
      expect(result).toBeDefined();
      expect(mockConsentRepository.create).toHaveBeenCalled();
      expect(mockAuditEventService.createSignerEvent).toHaveBeenCalled();
    });
  });

  describe('Create Consent - Error Cases', () => {
    it('should handle consent already exists', async () => {
      const request = createTestConsentRequest();
      const userId = 'test-user-id';

      const existingConsent = createExistingConsent();

      mockConsentRepository.findBySignerAndEnvelope.mockResolvedValue(existingConsent as any);

      await expect(service.createConsent(request, userId)).rejects.toThrow();
    });

    it('should handle creation errors', async () => {
      const request = createTestConsentRequest();
      const userId = 'test-user-id';

      mockConsentRepository.findBySignerAndEnvelope.mockResolvedValue(null);
      mockConsentRepository.create.mockRejectedValue(new Error('Database error'));

      await expect(service.createConsent(request, userId)).rejects.toThrow('Consent creation failed');
    });

    it('should handle error in consent creation and wrap it', async () => {
      const request = createTestConsentRequest();
      const userId = 'test-user-id';

      mockConsentRepository.findBySignerAndEnvelope.mockResolvedValue(null);
      mockConsentRepository.create.mockRejectedValue(new Error('Database connection failed'));

      await expect(service.createConsent(request, userId)).rejects.toThrow('Consent creation failed');
    });
  });

  describe('Link Consent with Signature - Success Cases', () => {
    it('should link consent with signature successfully', async () => {
      const consentId = { getValue: () => 'test-consent-id' } as any;
      const signatureId = { getValue: () => 'test-signature-id' } as any;

      const mockConsent = createMockConsentWithLink();
      const updatedConsent = createMockUpdatedConsent();

      mockConsentRepository.findById.mockResolvedValue(mockConsent as any);
      mockConsentRepository.update.mockResolvedValue(updatedConsent as any);

      const result = await service.linkConsentWithSignature(consentId, signatureId);

      expect(result).toBe(updatedConsent);
      expect(mockConsentRepository.findById).toHaveBeenCalledWith(consentId);
      expect(mockConsent.linkWithSignature).toHaveBeenCalledWith(signatureId);
      expect(mockConsentRepository.update).toHaveBeenCalledWith(consentId, expect.any(Object));
    });
  });

  describe('Link Consent with Signature - Error Cases', () => {
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
