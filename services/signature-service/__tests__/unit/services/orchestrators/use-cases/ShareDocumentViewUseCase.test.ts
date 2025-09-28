import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { ShareDocumentViewUseCase } from '../../../../../src/services/orchestrators/use-cases/ShareDocumentViewUseCase';
import { ShareDocumentViewInput, ShareDocumentViewResult } from '../../../../../src/domain/types/usecase/orchestrator/ShareDocumentViewUseCase';
import { EnvelopeId } from '../../../../../src/domain/value-objects/EnvelopeId';
import { Email } from '@lawprotect/shared-ts';
import { TestUtils } from '../../../../helpers/testUtils';
import { createSignatureEnvelopeServiceMock } from '../../../../helpers/mocks/services/SignatureEnvelopeService.mock';
import { createEnvelopeSignerServiceMock } from '../../../../helpers/mocks/services/EnvelopeSignerService.mock';
import { createInvitationTokenServiceMock } from '../../../../helpers/mocks/services/InvitationTokenService.mock';
import { createAuditEventServiceMock } from '../../../../helpers/mocks/services/AuditEventService.mock';
import { createEnvelopeNotificationServiceMock } from '../../../../helpers/mocks/services/EnvelopeNotificationService.mock';
import { signatureEnvelopeEntity } from '../../../../helpers/builders/signatureEnvelope';
import { AuditEventType } from '../../../../../src/domain/enums/AuditEventType';

// Mock the EnvelopeAccessValidationRule
jest.mock('../../../../../src/domain/rules/EnvelopeAccessValidationRule', () => ({
  EnvelopeAccessValidationRule: {
    validateEnvelopeModificationAccess: jest.fn(),
  },
}));

describe('ShareDocumentViewUseCase', () => {
  let useCase: ShareDocumentViewUseCase;
  let mockSignatureEnvelopeService: any;
  let mockEnvelopeSignerService: any;
  let mockInvitationTokenService: any;
  let mockAuditEventService: any;
  let mockEnvelopeNotificationService: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSignatureEnvelopeService = createSignatureEnvelopeServiceMock();
    mockEnvelopeSignerService = createEnvelopeSignerServiceMock();
    mockInvitationTokenService = createInvitationTokenServiceMock();
    mockAuditEventService = createAuditEventServiceMock();
    mockEnvelopeNotificationService = createEnvelopeNotificationServiceMock();

    // Reset the mock implementation for each test
    const { EnvelopeAccessValidationRule } = require('../../../../../src/domain/rules/EnvelopeAccessValidationRule');
    EnvelopeAccessValidationRule.validateEnvelopeModificationAccess.mockImplementation(() => {
      // Default: no error (success)
    });

    useCase = new ShareDocumentViewUseCase(
      mockSignatureEnvelopeService,
      mockEnvelopeSignerService,
      mockInvitationTokenService,
      mockAuditEventService,
      mockEnvelopeNotificationService
    );
  });

  describe('execute', () => {
    it('should share document view successfully with all operations', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const email = Email.fromString('viewer@example.com');
      const fullName = 'John Doe';
      const message = 'Please review this document';
      const expiresInDays = 7;
      const userId = TestUtils.generateUuid();
      const securityContext = {
        ipAddress: TestUtils.createTestIpAddress(),
        userAgent: TestUtils.createTestUserAgent(),
        country: 'US'
      };

      const input: ShareDocumentViewInput = {
        envelopeId,
        email,
        fullName,
        message,
        expiresInDays,
        userId,
        securityContext
      };

      const testEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue(), createdBy: userId });
      const viewerId = TestUtils.generateSignerId();
      const viewer = {
        getId: () => viewerId
      };

      const tokenResult = {
        token: 'viewer-token-123',
        expiresAt: new Date('2023-12-31T23:59:59Z'),
        entity: {
          getId: () => ({ getValue: () => 'token-entity-123' })
        }
      };

      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(testEnvelope);
      mockEnvelopeSignerService.createViewerParticipant.mockResolvedValue(viewer);
      mockInvitationTokenService.generateViewerInvitationToken.mockResolvedValue(tokenResult);
      mockEnvelopeNotificationService.sendViewerInvitation.mockResolvedValue(undefined);
      mockAuditEventService.create.mockResolvedValue(undefined);

      const result = await useCase.execute(input);

      expect(mockSignatureEnvelopeService.getEnvelopeWithSigners).toHaveBeenCalledWith(envelopeId);
      expect(require('../../../../../src/domain/rules/EnvelopeAccessValidationRule').EnvelopeAccessValidationRule.validateEnvelopeModificationAccess).toHaveBeenCalledWith(testEnvelope, userId);
      expect(mockEnvelopeSignerService.createViewerParticipant).toHaveBeenCalledWith(
        envelopeId,
        email.getValue(),
        fullName,
        userId
      );
      expect(mockInvitationTokenService.generateViewerInvitationToken).toHaveBeenCalledWith(
        viewerId,
        email.getValue(),
        fullName,
        envelopeId,
        {
          userId,
          ipAddress: securityContext.ipAddress,
          userAgent: securityContext.userAgent,
          country: securityContext.country
        },
        expiresInDays
      );
      expect(mockEnvelopeNotificationService.sendViewerInvitation).toHaveBeenCalledWith(
        testEnvelope,
        email.getValue(),
        fullName,
        tokenResult.token,
        tokenResult.expiresAt,
        message
      );
      expect(mockAuditEventService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          envelopeId: envelopeId.getValue(),
          signerId: viewerId.getValue(),
          eventType: AuditEventType.LINK_SHARED,
          description: `Document view access shared with ${fullName} (${email.getValue()})`,
          userId,
          userEmail: undefined
        })
      );
      expect(result.success).toBe(true);
      expect(result.message).toBe(`Document view access successfully shared with ${fullName}`);
      expect(result.envelopeId).toBe(envelopeId.getValue());
      expect(result.viewerEmail).toBe(email.getValue());
      expect(result.viewerName).toBe(fullName);
      expect(result.token).toBe(tokenResult.token);
      expect(result.expiresAt).toBe(tokenResult.expiresAt);
      expect(result.expiresInDays).toBe(expiresInDays);
    });

    it('should share document view with minimal parameters', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const email = Email.fromString('viewer@example.com');
      const fullName = 'Jane Smith';
      const userId = TestUtils.generateUuid();
      const securityContext = {
        ipAddress: TestUtils.createTestIpAddress(),
        userAgent: TestUtils.createTestUserAgent(),
        country: 'US'
      };

      const input: ShareDocumentViewInput = {
        envelopeId,
        email,
        fullName,
        userId,
        securityContext
        // No message, expiresInDays defaults to 7
      };

      const testEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue(), createdBy: userId });
      const viewerId = TestUtils.generateSignerId();
      const viewer = {
        getId: () => viewerId
      };

      const tokenResult = {
        token: 'viewer-token-minimal',
        expiresAt: new Date('2023-12-31T23:59:59Z'),
        entity: {
          getId: () => ({ getValue: () => 'token-entity-minimal' })
        }
      };

      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(testEnvelope);
      mockEnvelopeSignerService.createViewerParticipant.mockResolvedValue(viewer);
      mockInvitationTokenService.generateViewerInvitationToken.mockResolvedValue(tokenResult);
      mockEnvelopeNotificationService.sendViewerInvitation.mockResolvedValue(undefined);
      mockAuditEventService.create.mockResolvedValue(undefined);

      const result = await useCase.execute(input);

      expect(mockInvitationTokenService.generateViewerInvitationToken).toHaveBeenCalledWith(
        viewerId,
        email.getValue(),
        fullName,
        envelopeId,
        {
          userId,
          ipAddress: securityContext.ipAddress,
          userAgent: securityContext.userAgent,
          country: securityContext.country
        },
        7 // Default expiresInDays
      );
      expect(mockEnvelopeNotificationService.sendViewerInvitation).toHaveBeenCalledWith(
        testEnvelope,
        email.getValue(),
        fullName,
        tokenResult.token,
        tokenResult.expiresAt,
        undefined // No message provided
      );
      expect(result.success).toBe(true);
      expect(result.expiresInDays).toBe(7);
    });

    it('should handle security context with missing optional fields', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const email = Email.fromString('viewer@example.com');
      const fullName = 'John Doe';
      const userId = TestUtils.generateUuid();
      const securityContext = {
        ipAddress: TestUtils.createTestIpAddress(),
        userAgent: TestUtils.createTestUserAgent(),
        country: undefined // Missing country
      };

      const input: ShareDocumentViewInput = {
        envelopeId,
        email,
        fullName,
        userId,
        securityContext
      };

      const testEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue(), createdBy: userId });
      const viewerId = TestUtils.generateSignerId();
      const viewer = {
        getId: () => viewerId
      };

      const tokenResult = {
        token: 'viewer-token-missing-fields',
        expiresAt: new Date('2023-12-31T23:59:59Z'),
        entity: {
          getId: () => ({ getValue: () => 'token-entity-missing' })
        }
      };

      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(testEnvelope);
      mockEnvelopeSignerService.createViewerParticipant.mockResolvedValue(viewer);
      mockInvitationTokenService.generateViewerInvitationToken.mockResolvedValue(tokenResult);
      mockEnvelopeNotificationService.sendViewerInvitation.mockResolvedValue(undefined);
      mockAuditEventService.create.mockResolvedValue(undefined);

      const result = await useCase.execute(input);

      expect(mockInvitationTokenService.generateViewerInvitationToken).toHaveBeenCalledWith(
        viewerId,
        email.getValue(),
        fullName,
        envelopeId,
        {
          userId,
          ipAddress: securityContext.ipAddress,
          userAgent: securityContext.userAgent,
          country: undefined // Should be undefined when not provided
        },
        7
      );
      expect(mockAuditEventService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          networkContext: expect.objectContaining({
            ipAddress: securityContext.ipAddress,
            userAgent: securityContext.userAgent,
            country: undefined // Should be undefined when not provided
          })
        })
      );
      expect(result.success).toBe(true);
    });

    it('should throw error when envelope is not found', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const email = Email.fromString('viewer@example.com');
      const fullName = 'John Doe';
      const userId = TestUtils.generateUuid();
      const securityContext = {
        ipAddress: TestUtils.createTestIpAddress(),
        userAgent: TestUtils.createTestUserAgent(),
        country: 'US'
      };

      const input: ShareDocumentViewInput = {
        envelopeId,
        email,
        fullName,
        userId,
        securityContext
      };

      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(null);

      await expect(useCase.execute(input)).rejects.toThrow('Envelope not found');
    });

    it('should throw error when access validation fails', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const email = Email.fromString('viewer@example.com');
      const fullName = 'John Doe';
      const userId = TestUtils.generateUuid();
      const securityContext = {
        ipAddress: TestUtils.createTestIpAddress(),
        userAgent: TestUtils.createTestUserAgent(),
        country: 'US'
      };

      const input: ShareDocumentViewInput = {
        envelopeId,
        email,
        fullName,
        userId,
        securityContext
      };

      const testEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue(), createdBy: 'another-user' });
      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(testEnvelope);

      const { EnvelopeAccessValidationRule } = require('../../../../../src/domain/rules/EnvelopeAccessValidationRule');
      EnvelopeAccessValidationRule.validateEnvelopeModificationAccess.mockImplementation(() => {
        throw new Error('Access denied');
      });

      await expect(useCase.execute(input)).rejects.toThrow('Access denied');
    });

    it('should throw error when viewer participant creation fails', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const email = Email.fromString('viewer@example.com');
      const fullName = 'John Doe';
      const userId = TestUtils.generateUuid();
      const securityContext = {
        ipAddress: TestUtils.createTestIpAddress(),
        userAgent: TestUtils.createTestUserAgent(),
        country: 'US'
      };

      const input: ShareDocumentViewInput = {
        envelopeId,
        email,
        fullName,
        userId,
        securityContext
      };

      const testEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue(), createdBy: userId });
      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(testEnvelope);
      mockEnvelopeSignerService.createViewerParticipant.mockRejectedValue(new Error('Viewer creation failed'));

      await expect(useCase.execute(input)).rejects.toThrow('Viewer creation failed');
    });

    it('should throw error when token generation fails', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const email = Email.fromString('viewer@example.com');
      const fullName = 'John Doe';
      const userId = TestUtils.generateUuid();
      const securityContext = {
        ipAddress: TestUtils.createTestIpAddress(),
        userAgent: TestUtils.createTestUserAgent(),
        country: 'US'
      };

      const input: ShareDocumentViewInput = {
        envelopeId,
        email,
        fullName,
        userId,
        securityContext
      };

      const testEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue(), createdBy: userId });
      const viewerId = TestUtils.generateSignerId();
      const viewer = {
        getId: () => viewerId
      };

      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(testEnvelope);
      mockEnvelopeSignerService.createViewerParticipant.mockResolvedValue(viewer);
      mockInvitationTokenService.generateViewerInvitationToken.mockRejectedValue(new Error('Token generation failed'));

      await expect(useCase.execute(input)).rejects.toThrow('Token generation failed');
    });

    it('should throw error when notification sending fails', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const email = Email.fromString('viewer@example.com');
      const fullName = 'John Doe';
      const userId = TestUtils.generateUuid();
      const securityContext = {
        ipAddress: TestUtils.createTestIpAddress(),
        userAgent: TestUtils.createTestUserAgent(),
        country: 'US'
      };

      const input: ShareDocumentViewInput = {
        envelopeId,
        email,
        fullName,
        userId,
        securityContext
      };

      const testEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue(), createdBy: userId });
      const viewerId = TestUtils.generateSignerId();
      const viewer = {
        getId: () => viewerId
      };

      const tokenResult = {
        token: 'viewer-token-notification-fail',
        expiresAt: new Date('2023-12-31T23:59:59Z'),
        entity: {
          getId: () => ({ getValue: () => 'token-entity-notification' })
        }
      };

      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(testEnvelope);
      mockEnvelopeSignerService.createViewerParticipant.mockResolvedValue(viewer);
      mockInvitationTokenService.generateViewerInvitationToken.mockResolvedValue(tokenResult);
      mockEnvelopeNotificationService.sendViewerInvitation.mockRejectedValue(new Error('Notification failed'));

      await expect(useCase.execute(input)).rejects.toThrow('Notification failed');
    });

    it('should throw error when audit event creation fails', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const email = Email.fromString('viewer@example.com');
      const fullName = 'John Doe';
      const userId = TestUtils.generateUuid();
      const securityContext = {
        ipAddress: TestUtils.createTestIpAddress(),
        userAgent: TestUtils.createTestUserAgent(),
        country: 'US'
      };

      const input: ShareDocumentViewInput = {
        envelopeId,
        email,
        fullName,
        userId,
        securityContext
      };

      const testEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue(), createdBy: userId });
      const viewerId = TestUtils.generateSignerId();
      const viewer = {
        getId: () => viewerId
      };

      const tokenResult = {
        token: 'viewer-token-audit-fail',
        expiresAt: new Date('2023-12-31T23:59:59Z'),
        entity: {
          getId: () => ({ getValue: () => 'token-entity-audit' })
        }
      };

      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(testEnvelope);
      mockEnvelopeSignerService.createViewerParticipant.mockResolvedValue(viewer);
      mockInvitationTokenService.generateViewerInvitationToken.mockResolvedValue(tokenResult);
      mockEnvelopeNotificationService.sendViewerInvitation.mockResolvedValue(undefined);
      mockAuditEventService.create.mockRejectedValue(new Error('Audit creation failed'));

      await expect(useCase.execute(input)).rejects.toThrow('Audit creation failed');
    });

    it('should handle different expiration periods', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const email = Email.fromString('viewer@example.com');
      const fullName = 'John Doe';
      const expiresInDays = 30;
      const userId = TestUtils.generateUuid();
      const securityContext = {
        ipAddress: TestUtils.createTestIpAddress(),
        userAgent: TestUtils.createTestUserAgent(),
        country: 'US'
      };

      const input: ShareDocumentViewInput = {
        envelopeId,
        email,
        fullName,
        expiresInDays,
        userId,
        securityContext
      };

      const testEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue(), createdBy: userId });
      const viewerId = TestUtils.generateSignerId();
      const viewer = {
        getId: () => viewerId
      };

      const tokenResult = {
        token: 'viewer-token-30-days',
        expiresAt: new Date('2024-01-31T23:59:59Z'),
        entity: {
          getId: () => ({ getValue: () => 'token-entity-30' })
        }
      };

      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(testEnvelope);
      mockEnvelopeSignerService.createViewerParticipant.mockResolvedValue(viewer);
      mockInvitationTokenService.generateViewerInvitationToken.mockResolvedValue(tokenResult);
      mockEnvelopeNotificationService.sendViewerInvitation.mockResolvedValue(undefined);
      mockAuditEventService.create.mockResolvedValue(undefined);

      const result = await useCase.execute(input);

      expect(mockInvitationTokenService.generateViewerInvitationToken).toHaveBeenCalledWith(
        viewerId,
        email.getValue(),
        fullName,
        envelopeId,
        {
          userId,
          ipAddress: securityContext.ipAddress,
          userAgent: securityContext.userAgent,
          country: securityContext.country
        },
        30 // Custom expiration
      );
      expect(result.expiresInDays).toBe(30);
    });
  });
});
