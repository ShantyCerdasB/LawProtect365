/**
 * @fileoverview SignatureOrchestrator.test.ts - Unit tests for SignatureOrchestrator
 * @summary Tests for the signature orchestrator service
 * @description This file contains comprehensive unit tests for the SignatureOrchestrator class,
 * testing all public methods with mocked dependencies to ensure proper delegation to use cases.
 */

import { generateTestIpAddress } from '../../../helpers/testUtils';
import { SignatureOrchestrator } from '@/services/orchestrators/SignatureOrchestrator';
import { TestUtils } from '../../../helpers/testUtils';
import { NetworkSecurityContext, NotificationType, Email } from '@lawprotect/shared-ts';
import { EnvelopeId } from '@/domain/value-objects/EnvelopeId';
import { SignerId } from '@/domain/value-objects/SignerId';
import { EnvelopeStatus } from '@/domain/value-objects/EnvelopeStatus';
import { DocumentOrigin } from '@/domain/value-objects/DocumentOrigin';
import { SigningOrder } from '@/domain/value-objects/SigningOrder';

describe('SignatureOrchestrator', () => {
  let orchestrator: SignatureOrchestrator;
  let mockServices: any;
  let mockUseCases: any;

  beforeEach(() => {
    mockServices = {
      envelopeSignerService: {
        create: jest.fn(),
        update: jest.fn(),
        findById: jest.fn(),
      },
      invitationTokenService: {
        create: jest.fn(),
        findByToken: jest.fn(),
      },
      auditEventService: {
        create: jest.fn(),
        findByEnvelopeId: jest.fn(),
      },
      s3Service: {
        upload: jest.fn(),
        download: jest.fn(),
      },
      consentService: {
        create: jest.fn(),
        findBySignerId: jest.fn(),
      },
      kmsService: {
        sign: jest.fn(),
        verify: jest.fn(),
      },
      signerReminderTrackingService: {
        track: jest.fn(),
        canSendReminder: jest.fn(),
      },
      envelopeNotificationService: {
        send: jest.fn(),
      },
      envelopeHashService: {
        calculate: jest.fn(),
      },
      envelopeAccessService: {
        validateAccess: jest.fn(),
      },
      envelopeStateService: {
        updateStatus: jest.fn(),
      },
      envelopeCrudService: {
        create: jest.fn(),
        findById: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      envelopeDownloadService: {
        generateDownloadUrl: jest.fn(),
      },
    };

    mockUseCases = {
      createEnvelopeUseCase: {
        execute: jest.fn(),
      },
      cancelEnvelopeUseCase: {
        execute: jest.fn(),
      },
      updateEnvelopeUseCase: {
        execute: jest.fn(),
      },
      sendEnvelopeUseCase: {
        execute: jest.fn(),
      },
      shareDocumentViewUseCase: {
        execute: jest.fn(),
      },
      sendRemindersUseCase: {
        execute: jest.fn(),
      },
      declineSignerUseCase: {
        execute: jest.fn(),
      },
      downloadDocumentUseCase: {
        execute: jest.fn(),
      },
      getAuditTrailUseCase: {
        execute: jest.fn(),
      },
      getEnvelopeUseCase: {
        execute: jest.fn(),
      },
      listEnvelopesByUserUseCase: {
        execute: jest.fn(),
      },
      signDocumentUseCase: {
        execute: jest.fn(),
      },
    };

    orchestrator = new SignatureOrchestrator({
      services: mockServices,
      useCases: mockUseCases,
    });
  });

  describe('createEnvelope', () => {
    it('should delegate to createEnvelopeUseCase and return result', async () => {
      const request = {
        envelopeData: {
          id: EnvelopeId.fromString(TestUtils.generateUuid()),
          createdBy: TestUtils.generateUuid(),
          title: 'Test Envelope',
          description: 'Test Description',
          origin: DocumentOrigin.userUpload(),
          signingOrder: SigningOrder.ownerFirst(),
          sourceKey: 'source-key-123',
          metaKey: 'meta-key-123',
        },
        userId: TestUtils.generateUuid(),
        securityContext: {
          ipAddress: generateTestIpAddress(),
          userAgent: 'Test Agent',
        } as NetworkSecurityContext,
      };
      const expectedResult = {
        envelope: { id: 'envelope-123' },
        signers: [{ id: 'signer-123' }],
      };

      mockUseCases.createEnvelopeUseCase.execute.mockResolvedValue(expectedResult);

      const result = await orchestrator.createEnvelope(request);

      expect(mockUseCases.createEnvelopeUseCase.execute).toHaveBeenCalledWith(request);
      expect(result).toEqual(expectedResult);
    });

    it('should rethrow errors from use case', async () => {
      const request = {
        envelopeData: {
          id: EnvelopeId.fromString(TestUtils.generateUuid()),
          createdBy: TestUtils.generateUuid(),
          title: 'Test Envelope',
          description: 'Test Description',
          origin: DocumentOrigin.userUpload(),
          signingOrder: SigningOrder.ownerFirst(),
          sourceKey: 'source-key-123',
          metaKey: 'meta-key-123',
        },
        userId: TestUtils.generateUuid(),
        securityContext: {
          ipAddress: generateTestIpAddress(),
          userAgent: 'Test Agent',
        } as NetworkSecurityContext,
      };
      const error = new Error('Use case error');

      mockUseCases.createEnvelopeUseCase.execute.mockRejectedValue(error);

      await expect(orchestrator.createEnvelope(request)).rejects.toThrow('Use case error');
    });
  });

  describe('getEnvelope', () => {
    it('should delegate to getEnvelopeUseCase with all parameters', async () => {
      const envelopeId = EnvelopeId.fromString(TestUtils.generateUuid());
      const userId = TestUtils.generateUuid();
      const invitationToken = 'token-123';
      const securityContext = {
        ipAddress: generateTestIpAddress(),
        userAgent: 'Test Agent',
        country: 'US',
      };
      const expectedResult = {
        envelope: { id: envelopeId.toString() },
        signers: [],
        accessType: 'owner',
      };

      mockUseCases.getEnvelopeUseCase.execute.mockResolvedValue(expectedResult);

      const result = await orchestrator.getEnvelope(
        envelopeId,
        userId,
        invitationToken,
        securityContext
      );

      expect(mockUseCases.getEnvelopeUseCase.execute).toHaveBeenCalledWith({
        envelopeId,
        userId,
        invitationToken,
        securityContext,
      });
      expect(result).toEqual(expectedResult);
    });

    it('should delegate with minimal parameters', async () => {
      const envelopeId = EnvelopeId.fromString(TestUtils.generateUuid());
      const expectedResult = {
        envelope: { id: envelopeId.toString() },
        signers: [],
        accessType: 'public',
      };

      mockUseCases.getEnvelopeUseCase.execute.mockResolvedValue(expectedResult);

      const result = await orchestrator.getEnvelope(envelopeId);

      expect(mockUseCases.getEnvelopeUseCase.execute).toHaveBeenCalledWith({
        envelopeId,
        userId: undefined,
        invitationToken: undefined,
        securityContext: undefined,
      });
      expect(result).toEqual(expectedResult);
    });

    it('should throw errors from use case', async () => {
      const envelopeId = EnvelopeId.fromString(TestUtils.generateUuid());
      const error = new Error('Access denied');

      mockUseCases.getEnvelopeUseCase.execute.mockRejectedValue(error);

      await expect(orchestrator.getEnvelope(envelopeId)).rejects.toThrow('Access denied');
    });
  });

  describe('listEnvelopesByUser', () => {
    it('should delegate to listEnvelopesByUserUseCase with filters', async () => {
      const userId = TestUtils.generateUuid();
      const filters = {
        status: EnvelopeStatus.readyForSignature(),
        limit: 10,
        cursor: 'cursor-123',
      };
      const expectedResult = {
        envelopes: [],
        nextCursor: 'next-cursor',
      };

      mockUseCases.listEnvelopesByUserUseCase.execute.mockResolvedValue(expectedResult);

      const result = await orchestrator.listEnvelopesByUser(userId, filters);

      expect(mockUseCases.listEnvelopesByUserUseCase.execute).toHaveBeenCalledWith({
        userId,
        filters,
      });
      expect(result).toEqual(expectedResult);
    });

    it('should delegate with default empty filters', async () => {
      const userId = TestUtils.generateUuid();
      const expectedResult = {
        envelopes: [],
        nextCursor: undefined,
      };

      mockUseCases.listEnvelopesByUserUseCase.execute.mockResolvedValue(expectedResult);

      const result = await orchestrator.listEnvelopesByUser(userId);

      expect(mockUseCases.listEnvelopesByUserUseCase.execute).toHaveBeenCalledWith({
        userId,
        filters: {},
      });
      expect(result).toEqual(expectedResult);
    });

    it('should throw errors from use case', async () => {
      const userId = TestUtils.generateUuid();
      const error = new Error('Repository error');

      mockUseCases.listEnvelopesByUserUseCase.execute.mockRejectedValue(error);

      await expect(orchestrator.listEnvelopesByUser(userId)).rejects.toThrow('Repository error');
    });
  });

  describe('declineSigner', () => {
    it('should delegate to declineSignerUseCase with all parameters', async () => {
      const envelopeId = EnvelopeId.fromString(TestUtils.generateUuid());
      const signerId = SignerId.fromString(TestUtils.generateUuid());
      const request = {
        reason: 'Not interested',
        invitationToken: 'token-123',
      };
      const securityContext = {
        ipAddress: generateTestIpAddress(),
        userAgent: 'Test Agent',
      } as NetworkSecurityContext;
      const expectedResult = {
        envelope: { id: envelopeId.toString() },
        declineInfo: { reason: 'Not interested' },
      };

      mockUseCases.declineSignerUseCase.execute.mockResolvedValue(expectedResult);

      const result = await orchestrator.declineSigner(envelopeId, signerId, request, securityContext);

      expect(mockUseCases.declineSignerUseCase.execute).toHaveBeenCalledWith({
        envelopeId,
        signerId,
        request,
        securityContext,
      });
      expect(result).toEqual(expectedResult);
    });

    it('should throw errors from use case', async () => {
      const envelopeId = EnvelopeId.fromString(TestUtils.generateUuid());
      const signerId = SignerId.fromString(TestUtils.generateUuid());
      const request = { reason: 'Test reason' };
      const securityContext = {
        ipAddress: generateTestIpAddress(),
        userAgent: 'Test Agent',
      } as NetworkSecurityContext;
      const error = new Error('Invalid state');

      mockUseCases.declineSignerUseCase.execute.mockRejectedValue(error);

      await expect(
        orchestrator.declineSigner(envelopeId, signerId, request, securityContext)
      ).rejects.toThrow('Invalid state');
    });
  });

  describe('downloadDocument', () => {
    it('should delegate to downloadDocumentUseCase with all parameters', async () => {
      const envelopeId = EnvelopeId.fromString(TestUtils.generateUuid());
      const userId = TestUtils.generateUuid();
      const invitationToken = 'token-123';
      const expiresIn = 3600;
      const securityContext = {
        ipAddress: generateTestIpAddress(),
        userAgent: 'Test Agent',
      } as NetworkSecurityContext;
      const expectedResult = {
        downloadUrl: 'https://example.com/download',
        expiresAt: new Date(),
      };

      mockUseCases.downloadDocumentUseCase.execute.mockResolvedValue(expectedResult);

      const result = await orchestrator.downloadDocument(
        envelopeId,
        userId,
        invitationToken,
        expiresIn,
        securityContext
      );

      expect(mockUseCases.downloadDocumentUseCase.execute).toHaveBeenCalledWith({
        envelopeId,
        userId,
        invitationToken,
        expiresIn,
        securityContext,
      });
      expect(result).toEqual(expectedResult);
    });

    it('should delegate with minimal parameters', async () => {
      const envelopeId = EnvelopeId.fromString(TestUtils.generateUuid());
      const expectedResult = {
        downloadUrl: 'https://example.com/download',
        expiresAt: new Date(),
      };

      mockUseCases.downloadDocumentUseCase.execute.mockResolvedValue(expectedResult);

      const result = await orchestrator.downloadDocument(envelopeId);

      expect(mockUseCases.downloadDocumentUseCase.execute).toHaveBeenCalledWith({
        envelopeId,
        userId: undefined,
        invitationToken: undefined,
        expiresIn: undefined,
        securityContext: undefined,
      });
      expect(result).toEqual(expectedResult);
    });

    it('should throw errors from use case', async () => {
      const envelopeId = EnvelopeId.fromString(TestUtils.generateUuid());
      const error = new Error('Storage error');

      mockUseCases.downloadDocumentUseCase.execute.mockRejectedValue(error);

      await expect(orchestrator.downloadDocument(envelopeId)).rejects.toThrow('Storage error');
    });
  });

  describe('getAuditTrail', () => {
    it('should delegate to getAuditTrailUseCase', async () => {
      const envelopeId = EnvelopeId.fromString(TestUtils.generateUuid());
      const userId = TestUtils.generateUuid();
      const expectedResult = [
        { id: 'audit-1', event: 'envelope_created' },
        { id: 'audit-2', event: 'envelope_sent' },
      ];

      mockUseCases.getAuditTrailUseCase.execute.mockResolvedValue(expectedResult);

      const result = await orchestrator.getAuditTrail(envelopeId, userId);

      expect(mockUseCases.getAuditTrailUseCase.execute).toHaveBeenCalledWith({
        envelopeId,
        userId,
      });
      expect(result).toEqual(expectedResult);
    });

    it('should throw errors from use case', async () => {
      const envelopeId = EnvelopeId.fromString(TestUtils.generateUuid());
      const userId = TestUtils.generateUuid();
      const error = new Error('Unauthorized');

      mockUseCases.getAuditTrailUseCase.execute.mockRejectedValue(error);

      await expect(orchestrator.getAuditTrail(envelopeId, userId)).rejects.toThrow('Unauthorized');
    });
  });

  describe('sendReminders', () => {
    it('should delegate to sendRemindersUseCase', async () => {
      const envelopeId = EnvelopeId.fromString(TestUtils.generateUuid());
      const request = {
        type: NotificationType.REMINDER as NotificationType.REMINDER,
        signerIds: ['signer-1', 'signer-2'],
        message: 'Please sign the document',
      };
      const userId = TestUtils.generateUuid();
      const securityContext = {
        ipAddress: generateTestIpAddress(),
        userAgent: 'Test Agent',
      } as NetworkSecurityContext;
      const expectedResult = {
        remindersSent: 2,
        remindersSkipped: 0,
      };

      mockUseCases.sendRemindersUseCase.execute.mockResolvedValue(expectedResult);

      const result = await orchestrator.sendReminders(envelopeId, request, userId, securityContext);

      expect(mockUseCases.sendRemindersUseCase.execute).toHaveBeenCalledWith({
        envelopeId,
        request,
        userId,
        securityContext,
      });
      expect(result).toEqual(expectedResult);
    });

    it('should throw errors from use case', async () => {
      const envelopeId = EnvelopeId.fromString(TestUtils.generateUuid());
      const request = {
        type: NotificationType.REMINDER as NotificationType.REMINDER,
      };
      const userId = TestUtils.generateUuid();
      const securityContext = {
        ipAddress: generateTestIpAddress(),
        userAgent: 'Test Agent',
      } as NetworkSecurityContext;
      const error = new Error('Rate limit exceeded');

      mockUseCases.sendRemindersUseCase.execute.mockRejectedValue(error);

      await expect(
        orchestrator.sendReminders(envelopeId, request, userId, securityContext)
      ).rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('cancelEnvelope', () => {
    it('should delegate to cancelEnvelopeUseCase and return result', async () => {
      const envelopeId = EnvelopeId.fromString(TestUtils.generateUuid());
      const userId = TestUtils.generateUuid();
      const securityContext = {
        ipAddress: generateTestIpAddress(),
        userAgent: 'Test Agent',
      } as NetworkSecurityContext;
      const expectedResult = {
        envelope: { id: envelopeId.toString(), status: 'cancelled' },
      };

      mockUseCases.cancelEnvelopeUseCase.execute.mockResolvedValue(expectedResult);

      const result = await orchestrator.cancelEnvelope(envelopeId, userId, securityContext);

      expect(mockUseCases.cancelEnvelopeUseCase.execute).toHaveBeenCalledWith({
        envelopeId,
        userId,
        securityContext,
      });
      expect(result).toEqual(expectedResult);
    });

    it('should rethrow errors from use case', async () => {
      const envelopeId = EnvelopeId.fromString(TestUtils.generateUuid());
      const userId = TestUtils.generateUuid();
      const securityContext = {
        ipAddress: generateTestIpAddress(),
        userAgent: 'Test Agent',
      } as NetworkSecurityContext;
      const error = new Error('Invalid state');

      mockUseCases.cancelEnvelopeUseCase.execute.mockRejectedValue(error);

      await expect(
        orchestrator.cancelEnvelope(envelopeId, userId, securityContext)
      ).rejects.toThrow('Invalid state');
    });
  });

  describe('updateEnvelope', () => {
    it('should delegate to updateEnvelopeUseCase and return result', async () => {
      const envelopeId = EnvelopeId.fromString(TestUtils.generateUuid());
      const updateData = {
        title: 'Updated Title',
        description: 'Updated Description',
      };
      const userId = TestUtils.generateUuid();
      const expectedResult = {
        envelope: { id: envelopeId.toString(), title: 'Updated Title' },
        signers: [{ id: 'signer-1' }],
      };

      mockUseCases.updateEnvelopeUseCase.execute.mockResolvedValue(expectedResult);

      const result = await orchestrator.updateEnvelope(envelopeId, updateData, userId);

      expect(mockUseCases.updateEnvelopeUseCase.execute).toHaveBeenCalledWith({
        envelopeId,
        updateData,
        userId,
      });
      expect(result).toEqual(expectedResult);
    });

    it('should rethrow errors from use case', async () => {
      const envelopeId = EnvelopeId.fromString(TestUtils.generateUuid());
      const updateData = { title: 'Updated Title' };
      const userId = TestUtils.generateUuid();
      const error = new Error('Validation failed');

      mockUseCases.updateEnvelopeUseCase.execute.mockRejectedValue(error);

      await expect(
        orchestrator.updateEnvelope(envelopeId, updateData, userId)
      ).rejects.toThrow('Validation failed');
    });
  });

  describe('sendEnvelope', () => {
    it('should delegate to sendEnvelopeUseCase with all options', async () => {
      const envelopeId = EnvelopeId.fromString(TestUtils.generateUuid());
      const userId = TestUtils.generateUuid();
      const securityContext = {
        ipAddress: generateTestIpAddress(),
        userAgent: 'Test Agent',
      } as NetworkSecurityContext;
      const options = {
        message: 'Please sign this document',
        sendToAll: true,
        signers: [
          { signerId: 'signer-1', message: 'Custom message' },
        ],
      };
      const expectedResult = {
        success: true,
        message: 'Envelope sent successfully',
        envelopeId: envelopeId.toString(),
        status: 'sent',
        tokensGenerated: 2,
        signersNotified: 2,
        tokens: [
          { signerId: 'signer-1', email: 'test@example.com', token: 'token-1', expiresAt: new Date() },
        ],
      };

      mockUseCases.sendEnvelopeUseCase.execute.mockResolvedValue(expectedResult);

      const result = await orchestrator.sendEnvelope(envelopeId, userId, securityContext, options);

      expect(mockUseCases.sendEnvelopeUseCase.execute).toHaveBeenCalledWith({
        envelopeId,
        userId,
        securityContext,
        options,
      });
      expect(result).toEqual(expectedResult);
    });

    it('should delegate with default empty options', async () => {
      const envelopeId = EnvelopeId.fromString(TestUtils.generateUuid());
      const userId = TestUtils.generateUuid();
      const securityContext = {
        ipAddress: generateTestIpAddress(),
        userAgent: 'Test Agent',
      } as NetworkSecurityContext;
      const expectedResult = {
        success: true,
        message: 'Envelope sent successfully',
        envelopeId: envelopeId.toString(),
        status: 'sent',
        tokensGenerated: 0,
        signersNotified: 0,
        tokens: [],
      };

      mockUseCases.sendEnvelopeUseCase.execute.mockResolvedValue(expectedResult);

      const result = await orchestrator.sendEnvelope(envelopeId, userId, securityContext);

      expect(mockUseCases.sendEnvelopeUseCase.execute).toHaveBeenCalledWith({
        envelopeId,
        userId,
        securityContext,
        options: {},
      });
      expect(result).toEqual(expectedResult);
    });

    it('should rethrow errors from use case', async () => {
      const envelopeId = EnvelopeId.fromString(TestUtils.generateUuid());
      const userId = TestUtils.generateUuid();
      const securityContext = {
        ipAddress: generateTestIpAddress(),
        userAgent: 'Test Agent',
      } as NetworkSecurityContext;
      const error = new Error('Notification failed');

      mockUseCases.sendEnvelopeUseCase.execute.mockRejectedValue(error);

      await expect(
        orchestrator.sendEnvelope(envelopeId, userId, securityContext)
      ).rejects.toThrow('Notification failed');
    });
  });

  describe('shareDocumentView', () => {
    it('should delegate to shareDocumentViewUseCase with all parameters', async () => {
      const envelopeId = EnvelopeId.fromString(TestUtils.generateUuid());
      const email = Email.fromString('viewer@example.com');
      const fullName = 'Viewer Name';
      const message = 'Please review this document';
      const expiresInDays = 7;
      const userId = TestUtils.generateUuid();
      const securityContext = {
        ipAddress: generateTestIpAddress(),
        userAgent: 'Test Agent',
      } as NetworkSecurityContext;
      const expectedResult = {
        success: true,
        message: 'Document view shared successfully',
        envelopeId: envelopeId.toString(),
        viewerEmail: 'viewer@example.com',
        viewerName: 'Viewer Name',
        token: 'viewer-token-123',
        expiresAt: new Date(),
        expiresInDays: 7,
      };

      mockUseCases.shareDocumentViewUseCase.execute.mockResolvedValue(expectedResult);

      const result = await orchestrator.shareDocumentView(
        envelopeId,
        email,
        fullName,
        message,
        expiresInDays,
        userId,
        securityContext
      );

      expect(mockUseCases.shareDocumentViewUseCase.execute).toHaveBeenCalledWith({
        envelopeId,
        email,
        fullName,
        message,
        expiresInDays,
        userId,
        securityContext,
      });
      expect(result).toEqual(expectedResult);
    });

    it('should delegate with undefined optional parameters', async () => {
      const envelopeId = EnvelopeId.fromString(TestUtils.generateUuid());
      const email = Email.fromString('viewer@example.com');
      const fullName = 'Viewer Name';
      const userId = TestUtils.generateUuid();
      const securityContext = {
        ipAddress: generateTestIpAddress(),
        userAgent: 'Test Agent',
      } as NetworkSecurityContext;
      const expectedResult = {
        success: true,
        message: 'Document view shared successfully',
        envelopeId: envelopeId.toString(),
        viewerEmail: 'viewer@example.com',
        viewerName: 'Viewer Name',
        token: 'viewer-token-123',
        expiresAt: new Date(),
        expiresInDays: 30,
      };

      mockUseCases.shareDocumentViewUseCase.execute.mockResolvedValue(expectedResult);

      const result = await orchestrator.shareDocumentView(
        envelopeId,
        email,
        fullName,
        undefined,
        undefined,
        userId,
        securityContext
      );

      expect(mockUseCases.shareDocumentViewUseCase.execute).toHaveBeenCalledWith({
        envelopeId,
        email,
        fullName,
        message: undefined,
        expiresInDays: undefined,
        userId,
        securityContext,
      });
      expect(result).toEqual(expectedResult);
    });

    it('should throw errors from use case', async () => {
      const envelopeId = EnvelopeId.fromString(TestUtils.generateUuid());
      const email = Email.fromString('viewer@example.com');
      const fullName = 'Viewer Name';
      const userId = TestUtils.generateUuid();
      const securityContext = {
        ipAddress: generateTestIpAddress(),
        userAgent: 'Test Agent',
      } as NetworkSecurityContext;
      const error = new Error('Invalid email');

      mockUseCases.shareDocumentViewUseCase.execute.mockRejectedValue(error);

      await expect(
        orchestrator.shareDocumentView(envelopeId, email, fullName, undefined, undefined, userId, securityContext)
      ).rejects.toThrow('Invalid email');
    });
  });

  describe('signDocument', () => {
    it('should delegate to signDocumentUseCase and return result', async () => {
      const request = {
        envelopeId: TestUtils.generateUuid(),
        signerId: TestUtils.generateUuid(),
        documentHash: 'document-hash-123',
        signatureHash: 'signature-hash-123',
        s3Key: 's3-key-123',
        kmsKeyId: 'kms-key-123',
        algorithm: 'RSA-SHA256',
        consent: {
          given: true,
          timestamp: new Date().toISOString(),
          text: 'I consent to sign this document',
          ipAddress: generateTestIpAddress(),
          userAgent: 'Test Agent',
        },
      };
      const userId = TestUtils.generateUuid();
      const securityContext = {
        ipAddress: generateTestIpAddress(),
        userAgent: 'Test Agent',
      } as NetworkSecurityContext;
      const expectedResult = {
        envelopeId: request.envelopeId,
        signerId: request.signerId,
        signatureMetadata: {
          signedAt: new Date(),
          signatureHash: 'signature-hash',
        },
        envelopeProgress: {
          totalSigners: 2,
          signedSigners: 1,
          completed: false,
        },
      };

      mockUseCases.signDocumentUseCase.execute.mockResolvedValue(expectedResult);

      const result = await orchestrator.signDocument(request, userId, securityContext);

      expect(mockUseCases.signDocumentUseCase.execute).toHaveBeenCalledWith({
        request,
        userId,
        securityContext,
      });
      expect(result).toEqual(expectedResult);
    });

    it('should rethrow errors from use case', async () => {
      const request = {
        envelopeId: TestUtils.generateUuid(),
        signerId: TestUtils.generateUuid(),
        documentHash: 'document-hash-123',
        signatureHash: 'signature-hash-123',
        s3Key: 's3-key-123',
        kmsKeyId: 'kms-key-123',
        algorithm: 'RSA-SHA256',
        consent: {
          given: true,
          timestamp: new Date().toISOString(),
          text: 'I consent to sign this document',
          ipAddress: generateTestIpAddress(),
          userAgent: 'Test Agent',
        },
      };
      const userId = TestUtils.generateUuid();
      const securityContext = {
        ipAddress: generateTestIpAddress(),
        userAgent: 'Test Agent',
      } as NetworkSecurityContext;
      const error = new Error('KMS signing failed');

      mockUseCases.signDocumentUseCase.execute.mockRejectedValue(error);

      await expect(
        orchestrator.signDocument(request, userId, securityContext)
      ).rejects.toThrow('KMS signing failed');
    });
  });
});
