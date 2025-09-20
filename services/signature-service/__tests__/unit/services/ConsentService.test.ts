/**
 * @fileoverview ConsentService unit tests
 * @summary Tests for consent business logic operations
 * @description Comprehensive unit tests for ConsentService covering
 * all business logic methods, authorization, and error scenarios.
 */

import { ConsentService } from '@/services/ConsentService';
import { ConsentRepository } from '@/repositories/ConsentRepository';
import { SignerRepository } from '@/repositories/SignerRepository';
import { AuditService } from '@/services/AuditService';
import { ConsentEventService } from '@/services/events/ConsentEventService';
import { Consent } from '@/domain/entities/Consent';
import { Signer } from '@/domain/entities/Signer';
import { SignerId } from '@/domain/value-objects/SignerId';
import { EnvelopeId } from '@/domain/value-objects/EnvelopeId';
import { CreateConsentRequest } from '@/domain/types/consent/CreateConsentRequest';
import { AuditEventType } from '@/domain/enums/AuditEventType';
import { ConsentEventTypes } from '@/domain/enums/ConsentEventTypes';
import { AuditEvent } from '@/domain/types/audit/AuditEvent';
import { NotFoundError, BadRequestError, ForbiddenError, ConflictError, ErrorCodes } from '@lawprotect/shared-ts';
import { TestUtils } from '../../helpers/testUtils';

describe('ConsentService', () => {
  let consentService: ConsentService;
  let mockConsentRepository: jest.Mocked<ConsentRepository>;
  let mockSignerRepository: jest.Mocked<SignerRepository>;
  let mockAuditService: jest.Mocked<AuditService>;
  let mockEventService: jest.Mocked<ConsentEventService>;
  let mockConsent: jest.Mocked<Consent>;
  let mockSigner: jest.Mocked<Signer>;
  let mockAuditEvent: jest.Mocked<AuditEvent>;
  
  // Test data
  const testSignerId = TestUtils.generateSignerId();
  const testEnvelopeId = TestUtils.generateEnvelopeId();
  const testSignatureId = TestUtils.generateSignatureId();
  
  const createRequest: CreateConsentRequest = {
    signerId: testSignerId,
    envelopeId: testEnvelopeId,
    signatureId: testSignatureId,
    consentGiven: true,
    consentTimestamp: new Date('2023-01-01T00:00:00.000Z'),
    consentText: 'I agree to sign this document',
    userEmail: TestUtils.createTestEmail(),
    ipAddress: TestUtils.createTestIpAddress(),
    userAgent: TestUtils.createTestUserAgent(),
    country: 'US'
  };

  beforeEach(() => {
    // Mock repositories and services
    mockConsentRepository = {
      create: jest.fn(),
      getById: jest.fn(),
      getBySignerAndEnvelope: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    } as any;

    mockSignerRepository = {
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    } as any;

    mockAuditService = {
      createEvent: jest.fn()
    } as any;

    mockEventService = {
      publishEvent: jest.fn()
    } as any;

    // Create service instance
    consentService = new ConsentService(
      mockConsentRepository,
      mockSignerRepository,
      mockAuditService,
      mockEventService
    );

    // Mock entities
    mockConsent = {
      getId: jest.fn().mockReturnValue({ getValue: () => 'consent-123' }),
      getSignerId: jest.fn().mockReturnValue({ getValue: () => 'signer-456' }),
      getEnvelopeId: jest.fn().mockReturnValue({ getValue: () => 'envelope-789' }),
      getConsentGiven: jest.fn().mockReturnValue(true),
      getTimestamp: jest.fn().mockReturnValue({ toISOString: () => '2023-01-01T00:00:00.000Z' })
    } as any;

    mockSigner = {
      getId: jest.fn().mockReturnValue({ getValue: () => 'signer-456' }),
      getEmail: jest.fn().mockReturnValue({ getValue: () => 'test@example.com' }),
      getEnvelopeId: jest.fn().mockReturnValue('envelope-789'),
      getFullName: jest.fn().mockReturnValue('Test Signer'),
      getStatus: jest.fn().mockReturnValue('PENDING')
    } as any;

    mockAuditEvent = {
      getId: jest.fn().mockReturnValue({ getValue: () => 'audit-event-123' }),
      getType: jest.fn().mockReturnValue(AuditEventType.CONSENT_GIVEN),
      getEnvelopeId: jest.fn().mockReturnValue('envelope-789'),
      getUserId: jest.fn().mockReturnValue('user-456'),
      getDescription: jest.fn().mockReturnValue('Test audit event'),
      getTimestamp: jest.fn().mockReturnValue({ toISOString: () => '2023-01-01T00:00:00.000Z' }),
      getMetadata: jest.fn().mockReturnValue({ action: 'create' })
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createConsent', () => {

    it('should create consent successfully for authorized user', async () => {
      const userId = 'test@example.com';
      
      // Configure mock signer to match the request
      const configuredMockSigner = {
        ...mockSigner,
        getId: jest.fn().mockReturnValue(testSignerId),
        getEnvelopeId: jest.fn().mockReturnValue(testEnvelopeId.getValue())
      } as any;
      
      mockSignerRepository.getById.mockResolvedValue(configuredMockSigner);
      mockConsentRepository.getBySignerAndEnvelope.mockResolvedValue(null);
      mockConsentRepository.create.mockResolvedValue(mockConsent);

      const result = await consentService.createConsent(createRequest, userId);

      expect(mockSignerRepository.getById).toHaveBeenCalledWith(createRequest.signerId);
      expect(mockConsentRepository.getBySignerAndEnvelope).toHaveBeenCalledWith(
        createRequest.signerId,
        createRequest.envelopeId
      );
      expect(mockConsentRepository.create).toHaveBeenCalledWith(createRequest);
      expect(mockAuditService.createEvent).toHaveBeenCalledWith({
        type: AuditEventType.CONSENT_GIVEN,
        envelopeId: testEnvelopeId.getValue(),
        userId,
        userEmail: TestUtils.createTestEmail(),
        ipAddress: TestUtils.createTestIpAddress(),
        userAgent: TestUtils.createTestUserAgent(),
        country: 'US',
        description: `Consent given by signer ${testSignerId.getValue()}`,
        metadata: {
          consentId: 'consent-123',
          signerId: testSignerId.getValue(),
          envelopeId: testEnvelopeId.getValue(),
          consentGiven: true
        }
      });
      expect(mockEventService.publishEvent).toHaveBeenCalledWith(ConsentEventTypes.GIVEN, {
        consentId: 'consent-123',
        signerId: testSignerId.getValue(),
        envelopeId: testEnvelopeId.getValue(),
        userId,
        consentGiven: true
      });
      expect(result).toBe(mockConsent);
    });

    it('should create consent successfully for external user', async () => {
      const userId = 'external-user';
      
      // Configure mock signer to match the request
      const configuredMockSigner = {
        ...mockSigner,
        getId: jest.fn().mockReturnValue(testSignerId),
        getEnvelopeId: jest.fn().mockReturnValue(testEnvelopeId.getValue())
      } as any;
      
      mockSignerRepository.getById.mockResolvedValue(configuredMockSigner);
      mockConsentRepository.getBySignerAndEnvelope.mockResolvedValue(null);
      mockConsentRepository.create.mockResolvedValue(mockConsent);

      const result = await consentService.createConsent(createRequest, userId);

      expect(mockSignerRepository.getById).toHaveBeenCalledWith(createRequest.signerId);
      expect(mockConsentRepository.create).toHaveBeenCalledWith(createRequest);
      expect(result).toBe(mockConsent);
    });

    it('should throw NotFoundError when signer does not exist', async () => {
      const userId = 'test@example.com';
      mockSignerRepository.getById.mockResolvedValue(null);

      await expect(consentService.createConsent(createRequest, userId)).rejects.toThrow(NotFoundError);
      await expect(consentService.createConsent(createRequest, userId)).rejects.toThrow(
        `Signer with ID ${testSignerId.getValue()} not found`
      );
      expect(mockConsentRepository.create).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenError when user is not authorized', async () => {
      const userId = 'unauthorized@example.com';
      mockSignerRepository.getById.mockResolvedValue(mockSigner);

      await expect(consentService.createConsent(createRequest, userId)).rejects.toThrow(ForbiddenError);
      await expect(consentService.createConsent(createRequest, userId)).rejects.toThrow(
        `User unauthorized@example.com is not authorized to create consent for signer ${testSignerId.getValue()}`
      );
      expect(mockConsentRepository.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestError when envelope ID does not match signer', async () => {
      const userId = 'test@example.com';
      const signerWithDifferentEnvelope = {
        ...mockSigner,
        getEnvelopeId: jest.fn().mockReturnValue('different-envelope')
      } as any;
      mockSignerRepository.getById.mockResolvedValue(signerWithDifferentEnvelope);

      await expect(consentService.createConsent(createRequest, userId)).rejects.toThrow(BadRequestError);
      await expect(consentService.createConsent(createRequest, userId)).rejects.toThrow(
        'Envelope ID does not match signer\'s envelope'
      );
      expect(mockConsentRepository.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictError when consent already exists', async () => {
      const userId = 'test@example.com';
      
      // Configure mock signer to match the request
      const configuredMockSigner = {
        ...mockSigner,
        getId: jest.fn().mockReturnValue(testSignerId),
        getEnvelopeId: jest.fn().mockReturnValue(testEnvelopeId.getValue())
      } as any;
      
      mockSignerRepository.getById.mockResolvedValue(configuredMockSigner);
      mockConsentRepository.getBySignerAndEnvelope.mockResolvedValue(mockConsent);

      await expect(consentService.createConsent(createRequest, userId)).rejects.toThrow(ConflictError);
      await expect(consentService.createConsent(createRequest, userId)).rejects.toThrow(
        `Consent already exists for signer ${testSignerId.getValue()} and envelope ${testEnvelopeId.getValue()}`
      );
      expect(mockConsentRepository.create).not.toHaveBeenCalled();
    });

    it('should handle repository errors', async () => {
      const userId = 'test@example.com';
      
      // Configure mock signer to match the request
      const configuredMockSigner = {
        ...mockSigner,
        getId: jest.fn().mockReturnValue(testSignerId),
        getEnvelopeId: jest.fn().mockReturnValue(testEnvelopeId.getValue())
      } as any;
      
      mockSignerRepository.getById.mockResolvedValue(configuredMockSigner);
      mockConsentRepository.getBySignerAndEnvelope.mockResolvedValue(null);
      const error = new Error('Repository error');
      mockConsentRepository.create.mockRejectedValue(error);

      await expect(consentService.createConsent(createRequest, userId)).rejects.toThrow('Repository error');
    });
  });

  describe('getConsentBySignerAndEnvelope', () => {
    it('should return consent for authorized user', async () => {
      const signerId = TestUtils.generateUuid();
      const envelopeId = TestUtils.generateUuid();
      const userId = 'test@example.com';
      mockSignerRepository.getById.mockResolvedValue(mockSigner);
      mockConsentRepository.getBySignerAndEnvelope.mockResolvedValue(mockConsent);

      const result = await consentService.getConsentBySignerAndEnvelope(signerId, envelopeId, userId);

      expect(mockSignerRepository.getById).toHaveBeenCalledWith(expect.any(Object));
      expect(mockConsentRepository.getBySignerAndEnvelope).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object)
      );
      expect(result).toBe(mockConsent);
    });

    it('should return consent for external user', async () => {
      const signerId = TestUtils.generateUuid();
      const envelopeId = TestUtils.generateUuid();
      const userId = 'external-user';
      mockSignerRepository.getById.mockResolvedValue(mockSigner);
      mockConsentRepository.getBySignerAndEnvelope.mockResolvedValue(mockConsent);

      const result = await consentService.getConsentBySignerAndEnvelope(signerId, envelopeId, userId);

      expect(mockSignerRepository.getById).toHaveBeenCalledWith(expect.any(Object));
      expect(mockConsentRepository.getBySignerAndEnvelope).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object)
      );
      expect(result).toBe(mockConsent);
    });

    it('should return null when consent does not exist', async () => {
      const signerId = TestUtils.generateUuid();
      const envelopeId = TestUtils.generateUuid();
      const userId = 'test@example.com';
      mockSignerRepository.getById.mockResolvedValue(mockSigner);
      mockConsentRepository.getBySignerAndEnvelope.mockResolvedValue(null);

      const result = await consentService.getConsentBySignerAndEnvelope(signerId, envelopeId, userId);

      expect(result).toBeNull();
    });

    it('should throw NotFoundError when signer does not exist', async () => {
      const signerId = TestUtils.generateUuid();
      const envelopeId = TestUtils.generateUuid();
      const userId = 'test@example.com';
      mockSignerRepository.getById.mockResolvedValue(null);

      await expect(
        consentService.getConsentBySignerAndEnvelope(signerId, envelopeId, userId)
      ).rejects.toThrow(NotFoundError);
      await expect(
        consentService.getConsentBySignerAndEnvelope(signerId, envelopeId, userId)
      ).rejects.toThrow(`Signer with ID ${signerId} not found`);
    });

    it('should throw ForbiddenError when user is not authorized', async () => {
      const signerId = TestUtils.generateUuid();
      const envelopeId = TestUtils.generateUuid();
      const userId = 'unauthorized@example.com';
      mockSignerRepository.getById.mockResolvedValue(mockSigner);

      await expect(
        consentService.getConsentBySignerAndEnvelope(signerId, envelopeId, userId)
      ).rejects.toThrow(ForbiddenError);
      await expect(
        consentService.getConsentBySignerAndEnvelope(signerId, envelopeId, userId)
      ).rejects.toThrow(`User unauthorized@example.com is not authorized to access consent for signer ${signerId}`);
    });

    it('should handle repository errors', async () => {
      const signerId = TestUtils.generateUuid();
      const envelopeId = TestUtils.generateUuid();
      const userId = 'test@example.com';
      const error = new Error('Repository error');
      mockSignerRepository.getById.mockRejectedValue(error);

      await expect(
        consentService.getConsentBySignerAndEnvelope(signerId, envelopeId, userId)
      ).rejects.toThrow('Repository error');
    });
  });

  describe('Authorization logic', () => {
    it('should allow external user access', async () => {
      const signerId = TestUtils.generateUuid();
      const envelopeId = TestUtils.generateUuid();
      const userId = 'external-user';
      mockSignerRepository.getById.mockResolvedValue(mockSigner);
      mockConsentRepository.getBySignerAndEnvelope.mockResolvedValue(mockConsent);

      const result = await consentService.getConsentBySignerAndEnvelope(signerId, envelopeId, userId);

      expect(result).toBe(mockConsent);
      expect(mockSignerRepository.getById).toHaveBeenCalled();
    });

    it('should allow same user access', async () => {
      const signerId = TestUtils.generateUuid();
      const envelopeId = TestUtils.generateUuid();
      const userId = 'test@example.com';
      mockSignerRepository.getById.mockResolvedValue(mockSigner);
      mockConsentRepository.getBySignerAndEnvelope.mockResolvedValue(mockConsent);

      const result = await consentService.getConsentBySignerAndEnvelope(signerId, envelopeId, userId);

      expect(result).toBe(mockConsent);
    });

    it('should deny different user access', async () => {
      const signerId = TestUtils.generateUuid();
      const envelopeId = TestUtils.generateUuid();
      const userId = 'different@example.com';
      mockSignerRepository.getById.mockResolvedValue(mockSigner);

      await expect(
        consentService.getConsentBySignerAndEnvelope(signerId, envelopeId, userId)
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('Error handling', () => {
    it('should handle audit service errors gracefully', async () => {
      const userId = 'test@example.com';
      
      // Configure mock signer to match the request
      const configuredMockSigner = {
        ...mockSigner,
        getId: jest.fn().mockReturnValue(testSignerId),
        getEnvelopeId: jest.fn().mockReturnValue(testEnvelopeId.getValue())
      } as any;
      
      mockSignerRepository.getById.mockResolvedValue(configuredMockSigner);
      mockConsentRepository.getBySignerAndEnvelope.mockResolvedValue(null);
      mockConsentRepository.create.mockResolvedValue(mockConsent);
      const auditError = new Error('Audit service error');
      mockAuditService.createEvent.mockRejectedValue(auditError);

      await expect(consentService.createConsent(createRequest, userId)).rejects.toThrow('Audit service error');
    });

    it('should handle event service errors gracefully', async () => {
      const userId = 'test@example.com';
      
      // Configure mock signer to match the request
      const configuredMockSigner = {
        ...mockSigner,
        getId: jest.fn().mockReturnValue(testSignerId),
        getEnvelopeId: jest.fn().mockReturnValue(testEnvelopeId.getValue())
      } as any;
      
      mockSignerRepository.getById.mockResolvedValue(configuredMockSigner);
      mockConsentRepository.getBySignerAndEnvelope.mockResolvedValue(null);
      mockConsentRepository.create.mockResolvedValue(mockConsent);
      mockAuditService.createEvent.mockResolvedValue(mockAuditEvent);
      const eventError = new Error('Event service error');
      mockEventService.publishEvent.mockRejectedValue(eventError);

      await expect(consentService.createConsent(createRequest, userId)).rejects.toThrow('Event service error');
    });
  });

  describe('Service configuration', () => {
    it('should be properly configured with all dependencies', () => {
      expect(consentService).toBeDefined();
      expect(consentService).toBeInstanceOf(ConsentService);
    });

    it('should have access to all required methods', () => {
      expect(typeof consentService.createConsent).toBe('function');
      expect(typeof consentService.getConsentBySignerAndEnvelope).toBe('function');
    });
  });

  describe('Value object handling', () => {
    it('should create SignerId and EnvelopeId value objects correctly', async () => {
      const signerId = TestUtils.generateUuid();
      const envelopeId = TestUtils.generateUuid();
      const userId = 'test@example.com';
      mockSignerRepository.getById.mockResolvedValue(mockSigner);
      mockConsentRepository.getBySignerAndEnvelope.mockResolvedValue(mockConsent);

      await consentService.getConsentBySignerAndEnvelope(signerId, envelopeId, userId);

      expect(mockSignerRepository.getById).toHaveBeenCalledWith(expect.any(SignerId));
      expect(mockConsentRepository.getBySignerAndEnvelope).toHaveBeenCalledWith(
        expect.any(SignerId),
        expect.any(EnvelopeId)
      );
    });
  });

  describe('Event publishing', () => {
    it('should publish consent event with correct payload', async () => {
      const userId = 'test@example.com';
      
      // Configure mock signer to match the request
      const configuredMockSigner = {
        ...mockSigner,
        getId: jest.fn().mockReturnValue(testSignerId),
        getEnvelopeId: jest.fn().mockReturnValue(testEnvelopeId.getValue())
      } as any;
      
      mockSignerRepository.getById.mockResolvedValue(configuredMockSigner);
      mockConsentRepository.getBySignerAndEnvelope.mockResolvedValue(null);
      mockConsentRepository.create.mockResolvedValue(mockConsent);
      mockAuditService.createEvent.mockResolvedValue(mockAuditEvent);

      await consentService.createConsent(createRequest, userId);

      expect(mockEventService.publishEvent).toHaveBeenCalledWith(ConsentEventTypes.GIVEN, {
        consentId: 'consent-123',
        signerId: testSignerId.getValue(),
        envelopeId: testEnvelopeId.getValue(),
        userId,
        consentGiven: true
      });
    });
  });
});
