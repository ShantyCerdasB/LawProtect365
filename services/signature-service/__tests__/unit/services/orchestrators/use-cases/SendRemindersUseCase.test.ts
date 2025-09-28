import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { SendRemindersUseCase } from '../../../../../src/services/orchestrators/use-cases/SendRemindersUseCase';
import { SendRemindersInput, SendRemindersResult } from '../../../../../src/domain/types/usecase/orchestrator/SendRemindersUseCase';
import { EnvelopeId } from '../../../../../src/domain/value-objects/EnvelopeId';
import { NotificationType } from '@lawprotect/shared-ts';
import { TestUtils } from '../../../../helpers/testUtils';
import { createSignatureEnvelopeServiceMock } from '../../../../helpers/mocks/services/SignatureEnvelopeService.mock';
import { createEnvelopeSignerServiceMock } from '../../../../helpers/mocks/services/EnvelopeSignerService.mock';
import { createInvitationTokenServiceMock } from '../../../../helpers/mocks/services/InvitationTokenService.mock';
import { createSignerReminderTrackingServiceMock } from '../../../../helpers/mocks/services/SignerReminderTrackingService.mock';
import { createAuditEventServiceMock } from '../../../../helpers/mocks/services/AuditEventService.mock';
import { createEnvelopeNotificationServiceMock } from '../../../../helpers/mocks/services/EnvelopeNotificationService.mock';
import { signatureEnvelopeEntity } from '../../../../helpers/builders/signatureEnvelope';
import { EnvelopeSigner } from '../../../../../src/domain/entities/EnvelopeSigner';
import { SignerId } from '../../../../../src/domain/value-objects/SignerId';
import { Email } from '@lawprotect/shared-ts';
import { AuditEventType } from '../../../../../src/domain/enums/AuditEventType';

// Mock the EnvelopeAccessValidationRule
jest.mock('../../../../../src/domain/rules/EnvelopeAccessValidationRule', () => ({
  EnvelopeAccessValidationRule: {
    validateEnvelopeModificationAccess: jest.fn(),
  },
}));

// Mock the loadConfig function
jest.mock('../../../../../src/config/AppConfig', () => ({
  loadConfig: jest.fn(() => ({
    reminders: {
      maxRemindersPerSigner: 3,
      minHoursBetweenReminders: 24
    }
  }))
}));

// Mock the filterSignersByIds utility
jest.mock('../../../../../src/services/orchestrators/utils/signerSelection', () => ({
  filterSignersByIds: jest.fn((signers: any[], ids: string[]) => signers.filter((s: any) => ids.includes(s.getId().getValue())))
}));

describe('SendRemindersUseCase', () => {
  let useCase: SendRemindersUseCase;
  let mockSignatureEnvelopeService: any;
  let mockEnvelopeSignerService: any;
  let mockInvitationTokenService: any;
  let mockSignerReminderTrackingService: any;
  let mockAuditEventService: any;
  let mockEnvelopeNotificationService: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSignatureEnvelopeService = createSignatureEnvelopeServiceMock();
    mockEnvelopeSignerService = createEnvelopeSignerServiceMock();
    mockInvitationTokenService = createInvitationTokenServiceMock();
    mockSignerReminderTrackingService = createSignerReminderTrackingServiceMock();
    mockAuditEventService = createAuditEventServiceMock();
    mockEnvelopeNotificationService = createEnvelopeNotificationServiceMock();

    // Reset the mock implementation for each test
    const { EnvelopeAccessValidationRule } = require('../../../../../src/domain/rules/EnvelopeAccessValidationRule');
    EnvelopeAccessValidationRule.validateEnvelopeModificationAccess.mockImplementation(() => {
      // Default: no error (success)
    });

    useCase = new SendRemindersUseCase(
      mockSignatureEnvelopeService,
      mockEnvelopeSignerService,
      mockInvitationTokenService,
      mockSignerReminderTrackingService,
      mockAuditEventService,
      mockEnvelopeNotificationService
    );
  });

  describe('execute', () => {
    it('should send reminders successfully to all pending signers', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      const securityContext = {
        ipAddress: TestUtils.createTestIpAddress(),
        userAgent: TestUtils.createTestUserAgent(),
        country: 'US'
      };

      const input: SendRemindersInput = {
        envelopeId,
        request: {
          message: 'Please sign this document',
          type: NotificationType.REMINDER
        },
        userId,
        securityContext
      };

      const testEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue(), createdBy: userId });
      const signer1Id = TestUtils.generateSignerId();
      const signer2Id = TestUtils.generateSignerId();
      const pendingSigners: EnvelopeSigner[] = [
        { 
          getId: () => signer1Id, 
          getEmail: () => Email.fromString('signer1@example.com'),
          getFullName: () => 'John Doe'
        } as EnvelopeSigner,
        { 
          getId: () => signer2Id, 
          getEmail: () => Email.fromString('signer2@example.com'),
          getFullName: () => 'Jane Smith'
        } as EnvelopeSigner
      ];

      const tracking1 = {
        getReminderCount: () => 1,
        getLastReminderAt: () => new Date('2023-01-01T00:00:00Z')
      };
      const tracking2 = {
        getReminderCount: () => 2,
        getLastReminderAt: () => new Date('2023-01-02T00:00:00Z')
      };

      const activeToken1 = {
        getId: () => ({ getValue: () => 'token-1' }),
        isExpired: () => false
      };
      const activeToken2 = {
        getId: () => ({ getValue: () => 'token-2' }),
        isExpired: () => false
      };

      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(testEnvelope);
      mockEnvelopeSignerService.getPendingSigners.mockResolvedValue(pendingSigners);
      mockSignerReminderTrackingService.canSendReminder
        .mockResolvedValueOnce({ canSend: true })
        .mockResolvedValueOnce({ canSend: true });
      mockSignerReminderTrackingService.recordReminderSent
        .mockResolvedValueOnce(tracking1)
        .mockResolvedValueOnce(tracking2);
      mockInvitationTokenService.getTokensBySigner
        .mockResolvedValueOnce([activeToken1])
        .mockResolvedValueOnce([activeToken2]);
      mockInvitationTokenService.updateTokenSent.mockResolvedValue(undefined);
      mockEnvelopeNotificationService.publishReminder.mockResolvedValue(undefined);
      mockAuditEventService.create.mockResolvedValue(undefined);

      const result = await useCase.execute(input);

      expect(mockSignatureEnvelopeService.getEnvelopeWithSigners).toHaveBeenCalledWith(envelopeId);
      expect(require('../../../../../src/domain/rules/EnvelopeAccessValidationRule').EnvelopeAccessValidationRule.validateEnvelopeModificationAccess).toHaveBeenCalledWith(testEnvelope, userId);
      expect(mockEnvelopeSignerService.getPendingSigners).toHaveBeenCalledWith(envelopeId);
      expect(mockSignerReminderTrackingService.canSendReminder).toHaveBeenCalledTimes(2);
      expect(mockSignerReminderTrackingService.recordReminderSent).toHaveBeenCalledTimes(2);
      expect(mockInvitationTokenService.getTokensBySigner).toHaveBeenCalledTimes(2);
      expect(mockInvitationTokenService.updateTokenSent).toHaveBeenCalledTimes(2);
      expect(mockEnvelopeNotificationService.publishReminder).toHaveBeenCalledTimes(2);
      expect(mockAuditEventService.create).toHaveBeenCalledTimes(2);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Reminders sent to 2 signers');
      expect(result.envelopeId).toBe(envelopeId.getValue());
      expect(result.remindersSent).toBe(2);
      expect(result.signersNotified).toHaveLength(2);
      expect(result.signersNotified[0].id).toBe(signer1Id.getValue());
      expect(result.signersNotified[1].id).toBe(signer2Id.getValue());
      expect(result.skippedSigners).toHaveLength(0);
    });

    it('should send reminders to filtered signers only', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      const securityContext = {
        ipAddress: TestUtils.createTestIpAddress(),
        userAgent: TestUtils.createTestUserAgent(),
        country: 'US'
      };

      const signer1Id = TestUtils.generateSignerId();
      const signer2Id = TestUtils.generateSignerId();

      const input: SendRemindersInput = {
        envelopeId,
        request: {
          signerIds: [signer1Id.getValue()],
          message: 'Please sign this document',
          type: NotificationType.REMINDER
        },
        userId,
        securityContext
      };

      const testEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue(), createdBy: userId });
      const pendingSigners: EnvelopeSigner[] = [
        { 
          getId: () => signer1Id, 
          getEmail: () => Email.fromString('signer1@example.com'),
          getFullName: () => 'John Doe'
        } as EnvelopeSigner,
        { 
          getId: () => signer2Id, 
          getEmail: () => Email.fromString('signer2@example.com'),
          getFullName: () => 'Jane Smith'
        } as EnvelopeSigner
      ];

      const tracking = {
        getReminderCount: () => 1,
        getLastReminderAt: () => new Date('2023-01-01T00:00:00Z')
      };

      const activeToken = {
        getId: () => ({ getValue: () => 'token-1' }),
        isExpired: () => false
      };

      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(testEnvelope);
      mockEnvelopeSignerService.getPendingSigners.mockResolvedValue(pendingSigners);
      mockSignerReminderTrackingService.canSendReminder.mockResolvedValue({ canSend: true });
      mockSignerReminderTrackingService.recordReminderSent.mockResolvedValue(tracking);
      mockInvitationTokenService.getTokensBySigner.mockResolvedValue([activeToken]);
      mockInvitationTokenService.updateTokenSent.mockResolvedValue(undefined);
      mockEnvelopeNotificationService.publishReminder.mockResolvedValue(undefined);
      mockAuditEventService.create.mockResolvedValue(undefined);

      const result = await useCase.execute(input);

      expect(result.remindersSent).toBe(1);
      expect(result.signersNotified).toHaveLength(1);
      expect(result.signersNotified[0].id).toBe(signer1Id.getValue());
    });

    it('should return early when no pending signers', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      const securityContext = {
        ipAddress: TestUtils.createTestIpAddress(),
        userAgent: TestUtils.createTestUserAgent(),
        country: 'US'
      };

      const input: SendRemindersInput = {
        envelopeId,
        request: {
          message: 'Please sign this document',
          type: NotificationType.REMINDER
        },
        userId,
        securityContext
      };

      const testEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue(), createdBy: userId });

      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(testEnvelope);
      mockEnvelopeSignerService.getPendingSigners.mockResolvedValue([]);

      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
      expect(result.message).toBe('No pending signers to remind');
      expect(result.remindersSent).toBe(0);
      expect(result.signersNotified).toHaveLength(0);
      expect(result.skippedSigners).toHaveLength(0);
    });

    it('should return early when no matching signers after filtering', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      const securityContext = {
        ipAddress: TestUtils.createTestIpAddress(),
        userAgent: TestUtils.createTestUserAgent(),
        country: 'US'
      };

      const signer1Id = TestUtils.generateSignerId();
      const signer2Id = TestUtils.generateSignerId();

      const input: SendRemindersInput = {
        envelopeId,
        request: {
          signerIds: ['non-existent-signer'],
          message: 'Please sign this document',
          type: NotificationType.REMINDER
        },
        userId,
        securityContext
      };

      const testEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue(), createdBy: userId });
      const pendingSigners: EnvelopeSigner[] = [
        { 
          getId: () => signer1Id, 
          getEmail: () => Email.fromString('signer1@example.com'),
          getFullName: () => 'John Doe'
        } as EnvelopeSigner,
        { 
          getId: () => signer2Id, 
          getEmail: () => Email.fromString('signer2@example.com'),
          getFullName: () => 'Jane Smith'
        } as EnvelopeSigner
      ];

      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(testEnvelope);
      mockEnvelopeSignerService.getPendingSigners.mockResolvedValue(pendingSigners);

      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
      expect(result.message).toBe('No matching pending signers found');
      expect(result.remindersSent).toBe(0);
      expect(result.signersNotified).toHaveLength(0);
      expect(result.skippedSigners).toHaveLength(0);
    });

    it('should skip signers when reminder policy prevents sending', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      const securityContext = {
        ipAddress: TestUtils.createTestIpAddress(),
        userAgent: TestUtils.createTestUserAgent(),
        country: 'US'
      };

      const input: SendRemindersInput = {
        envelopeId,
        request: {
          message: 'Please sign this document',
          type: NotificationType.REMINDER
        },
        userId,
        securityContext
      };

      const testEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue(), createdBy: userId });
      const signerId = TestUtils.generateSignerId();
      const pendingSigners: EnvelopeSigner[] = [
        { 
          getId: () => signerId, 
          getEmail: () => Email.fromString('signer@example.com'),
          getFullName: () => 'John Doe'
        } as EnvelopeSigner
      ];

      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(testEnvelope);
      mockEnvelopeSignerService.getPendingSigners.mockResolvedValue(pendingSigners);
      mockSignerReminderTrackingService.canSendReminder.mockResolvedValue({
        canSend: false,
        reason: 'Rate limit exceeded'
      });

      const result = await useCase.execute(input);

      expect(result.remindersSent).toBe(0);
      expect(result.signersNotified).toHaveLength(0);
      expect(result.skippedSigners).toHaveLength(1);
      expect(result.skippedSigners[0].id).toBe(signerId.getValue());
      expect(result.skippedSigners[0].reason).toBe('Rate limit exceeded');
    });

    it('should skip signers when no active invitation token found', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      const securityContext = {
        ipAddress: TestUtils.createTestIpAddress(),
        userAgent: TestUtils.createTestUserAgent(),
        country: 'US'
      };

      const input: SendRemindersInput = {
        envelopeId,
        request: {
          message: 'Please sign this document',
          type: NotificationType.REMINDER
        },
        userId,
        securityContext
      };

      const testEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue(), createdBy: userId });
      const signerId = TestUtils.generateSignerId();
      const pendingSigners: EnvelopeSigner[] = [
        { 
          getId: () => signerId, 
          getEmail: () => Email.fromString('signer@example.com'),
          getFullName: () => 'John Doe'
        } as EnvelopeSigner
      ];

      const tracking = {
        getReminderCount: () => 1,
        getLastReminderAt: () => new Date('2023-01-01T00:00:00Z')
      };

      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(testEnvelope);
      mockEnvelopeSignerService.getPendingSigners.mockResolvedValue(pendingSigners);
      mockSignerReminderTrackingService.canSendReminder.mockResolvedValue({ canSend: true });
      mockSignerReminderTrackingService.recordReminderSent.mockResolvedValue(tracking);
      mockInvitationTokenService.getTokensBySigner.mockResolvedValue([]); // No active tokens

      const result = await useCase.execute(input);

      expect(result.remindersSent).toBe(0);
      expect(result.signersNotified).toHaveLength(0);
      expect(result.skippedSigners).toHaveLength(1);
      expect(result.skippedSigners[0].id).toBe(signerId.getValue());
      expect(result.skippedSigners[0].reason).toBe('No active invitation token found');
    });

    it('should handle mixed success and skip scenarios', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      const securityContext = {
        ipAddress: TestUtils.createTestIpAddress(),
        userAgent: TestUtils.createTestUserAgent(),
        country: 'US'
      };

      const input: SendRemindersInput = {
        envelopeId,
        request: {
          message: 'Please sign this document',
          type: NotificationType.REMINDER
        },
        userId,
        securityContext
      };

      const testEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue(), createdBy: userId });
      const signer1Id = TestUtils.generateSignerId();
      const signer2Id = TestUtils.generateSignerId();
      const pendingSigners: EnvelopeSigner[] = [
        { 
          getId: () => signer1Id, 
          getEmail: () => Email.fromString('signer1@example.com'),
          getFullName: () => 'John Doe'
        } as EnvelopeSigner,
        { 
          getId: () => signer2Id, 
          getEmail: () => Email.fromString('signer2@example.com'),
          getFullName: () => 'Jane Smith'
        } as EnvelopeSigner
      ];

      const tracking = {
        getReminderCount: () => 1,
        getLastReminderAt: () => new Date('2023-01-01T00:00:00Z')
      };

      const activeToken = {
        getId: () => ({ getValue: () => 'token-1' }),
        isExpired: () => false
      };

      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(testEnvelope);
      mockEnvelopeSignerService.getPendingSigners.mockResolvedValue(pendingSigners);
      mockSignerReminderTrackingService.canSendReminder
        .mockResolvedValueOnce({ canSend: true })
        .mockResolvedValueOnce({ canSend: false, reason: 'Rate limit exceeded' });
      mockSignerReminderTrackingService.recordReminderSent.mockResolvedValue(tracking);
      mockInvitationTokenService.getTokensBySigner
        .mockResolvedValueOnce([activeToken])
        .mockResolvedValueOnce([]); // No tokens for second signer
      mockInvitationTokenService.updateTokenSent.mockResolvedValue(undefined);
      mockEnvelopeNotificationService.publishReminder.mockResolvedValue(undefined);
      mockAuditEventService.create.mockResolvedValue(undefined);

      const result = await useCase.execute(input);

      expect(result.remindersSent).toBe(1);
      expect(result.signersNotified).toHaveLength(1);
      expect(result.signersNotified[0].id).toBe(signer1Id.getValue());
      expect(result.skippedSigners).toHaveLength(1);
      expect(result.skippedSigners[0].id).toBe(signer2Id.getValue());
    });

    it('should throw error when envelope is not found', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      const securityContext = {
        ipAddress: TestUtils.createTestIpAddress(),
        userAgent: TestUtils.createTestUserAgent(),
        country: 'US'
      };

      const input: SendRemindersInput = {
        envelopeId,
        request: {
          message: 'Please sign this document',
          type: NotificationType.REMINDER
        },
        userId,
        securityContext
      };

      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(null);

      await expect(useCase.execute(input)).rejects.toThrow('Envelope not found');
    });

    it('should throw error when access validation fails', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      const securityContext = {
        ipAddress: TestUtils.createTestIpAddress(),
        userAgent: TestUtils.createTestUserAgent(),
        country: 'US'
      };

      const input: SendRemindersInput = {
        envelopeId,
        request: {
          message: 'Please sign this document',
          type: NotificationType.REMINDER
        },
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

    it('should throw error when getPendingSigners fails', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      const securityContext = {
        ipAddress: TestUtils.createTestIpAddress(),
        userAgent: TestUtils.createTestUserAgent(),
        country: 'US'
      };

      const input: SendRemindersInput = {
        envelopeId,
        request: {
          message: 'Please sign this document',
          type: NotificationType.REMINDER
        },
        userId,
        securityContext
      };

      const testEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue(), createdBy: userId });
      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(testEnvelope);
      mockEnvelopeSignerService.getPendingSigners.mockRejectedValue(new Error('Get pending signers failed'));

      await expect(useCase.execute(input)).rejects.toThrow('Get pending signers failed');
    });

    it('should handle signers with missing optional fields', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      const securityContext = {
        ipAddress: TestUtils.createTestIpAddress(),
        userAgent: TestUtils.createTestUserAgent(),
        country: 'US'
      };

      const input: SendRemindersInput = {
        envelopeId,
        request: {
          message: 'Please sign this document',
          type: NotificationType.REMINDER
        },
        userId,
        securityContext
      };

      const testEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue(), createdBy: userId });
      const signerId = TestUtils.generateSignerId();
      const pendingSigners: EnvelopeSigner[] = [
        { 
          getId: () => signerId, 
          getEmail: () => undefined, // Missing email
          getFullName: () => undefined // Missing full name
        } as EnvelopeSigner
      ];

      const tracking = {
        getReminderCount: () => 1,
        getLastReminderAt: () => new Date('2023-01-01T00:00:00Z')
      };

      const activeToken = {
        getId: () => ({ getValue: () => 'token-1' }),
        isExpired: () => false
      };

      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(testEnvelope);
      mockEnvelopeSignerService.getPendingSigners.mockResolvedValue(pendingSigners);
      mockSignerReminderTrackingService.canSendReminder.mockResolvedValue({ canSend: true });
      mockSignerReminderTrackingService.recordReminderSent.mockResolvedValue(tracking);
      mockInvitationTokenService.getTokensBySigner.mockResolvedValue([activeToken]);
      mockInvitationTokenService.updateTokenSent.mockResolvedValue(undefined);
      mockEnvelopeNotificationService.publishReminder.mockResolvedValue(undefined);
      mockAuditEventService.create.mockResolvedValue(undefined);

      const result = await useCase.execute(input);

      expect(result.signersNotified).toHaveLength(1);
      expect(result.signersNotified[0].email).toBe('Unknown');
      expect(result.signersNotified[0].name).toBe('Unknown');
    });
  });
});
