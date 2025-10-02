import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { SendRemindersUseCase } from '../../../../../src/services/orchestrators/use-cases/SendRemindersUseCase';
import { SendRemindersInput } from '../../../../../src/domain/types/usecase/orchestrator/SendRemindersUseCase';
import { NotificationType, Email } from '@lawprotect/shared-ts';
import { TestUtils } from '../../../../helpers/testUtils';
import { createSignatureEnvelopeServiceMock } from '../../../../helpers/mocks/services/SignatureEnvelopeService.mock';
import { createEnvelopeSignerServiceMock } from '../../../../helpers/mocks/services/EnvelopeSignerService.mock';
import { createInvitationTokenServiceMock } from '../../../../helpers/mocks/services/InvitationTokenService.mock';
import { createSignerReminderTrackingServiceMock } from '../../../../helpers/mocks/services/SignerReminderTrackingService.mock';
import { createAuditEventServiceMock } from '../../../../helpers/mocks/services/AuditEventService.mock';
import { createEnvelopeNotificationServiceMock } from '../../../../helpers/mocks/services/EnvelopeNotificationService.mock';
import { signatureEnvelopeEntity } from '../../../../helpers/builders/signatureEnvelope';
import { EnvelopeSigner } from '../../../../../src/domain/entities/EnvelopeSigner';

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

  // Helper function to create test input
  function createTestInput(overrides: Partial<SendRemindersInput> = {}): SendRemindersInput {
    const envelopeId = TestUtils.generateEnvelopeId();
    const userId = TestUtils.generateUuid();
    const securityContext = {
      ipAddress: TestUtils.createTestIpAddress(),
      userAgent: TestUtils.createTestUserAgent(),
      country: 'US'
    };
    
    return {
      envelopeId,
      request: {
        message: 'Please sign this document',
        type: NotificationType.REMINDER,
        ...overrides.request
      },
      userId,
      securityContext,
      ...overrides
    };
  }

  // Helper function to create test envelope
  function createTestEnvelope(envelopeId: any, userId: string) {
    return signatureEnvelopeEntity({ id: envelopeId.getValue(), createdBy: userId });
  }

  // Helper function to create test signer
  function createTestSigner(signerId: any, email: string = 'signer@example.com', name: string = 'Test User') {
    return {
      getId: () => signerId,
      getEmail: () => Email.fromString(email),
      getFullName: () => name
    } as EnvelopeSigner;
  }

  // Helper function to create active token
  function createActiveToken(tokenId: string = 'token-1') {
    return {
      getId: () => ({ getValue: () => tokenId }),
      isExpired: () => false
    };
  }

  // Helper function to create tracking data
  function createTrackingData(reminderCount: number = 1, lastReminderAt: Date = new Date('2023-01-01T00:00:00Z')) {
    return {
      getReminderCount: () => reminderCount,
      getLastReminderAt: () => lastReminderAt
    };
  }

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
      
      const input = createTestInput({
        envelopeId,
        userId
      });

      const testEnvelope = createTestEnvelope(envelopeId, userId);
      const signer1Id = TestUtils.generateSignerId();
      const signer2Id = TestUtils.generateSignerId();
      const pendingSigners: EnvelopeSigner[] = [
        createTestSigner(signer1Id, 'signer1@example.com', 'John Doe'),
        createTestSigner(signer2Id, 'signer2@example.com', 'Jane Smith')
      ];

      const tracking1 = createTrackingData(1, new Date('2023-01-01T00:00:00Z'));
      const tracking2 = createTrackingData(2, new Date('2023-01-02T00:00:00Z'));

      const activeToken1 = createActiveToken('token-1');
      const activeToken2 = createActiveToken('token-2');

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
      const signer1Id = TestUtils.generateSignerId();
      const signer2Id = TestUtils.generateSignerId();

      const input = createTestInput({
        envelopeId,
        userId,
        request: {
          signerIds: [signer1Id.getValue()],
          message: 'Please sign this document',
          type: NotificationType.REMINDER
        }
      });

      const testEnvelope = createTestEnvelope(envelopeId, userId);
      const pendingSigners: EnvelopeSigner[] = [
        createTestSigner(signer1Id, 'signer1@example.com', 'John Doe'),
        createTestSigner(signer2Id, 'signer2@example.com', 'Jane Smith')
      ];

      const tracking = createTrackingData();
      const activeToken = createActiveToken();

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
      
      const input = createTestInput({
        envelopeId,
        userId
      });

      const testEnvelope = createTestEnvelope(envelopeId, userId);

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
      const signer1Id = TestUtils.generateSignerId();
      const signer2Id = TestUtils.generateSignerId();

      const input = createTestInput({
        envelopeId,
        userId,
        request: {
          signerIds: ['non-existent-signer'],
          message: 'Please sign this document',
          type: NotificationType.REMINDER
        }
      });

      const testEnvelope = createTestEnvelope(envelopeId, userId);
      const pendingSigners: EnvelopeSigner[] = [
        createTestSigner(signer1Id, 'signer1@example.com', 'John Doe'),
        createTestSigner(signer2Id, 'signer2@example.com', 'Jane Smith')
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
      
      const input = createTestInput({
        envelopeId,
        userId
      });

      const testEnvelope = createTestEnvelope(envelopeId, userId);
      const signerId = TestUtils.generateSignerId();
      const pendingSigners: EnvelopeSigner[] = [
        createTestSigner(signerId, 'signer@example.com', 'John Doe')
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
      
      const input = createTestInput({
        envelopeId,
        userId
      });

      const testEnvelope = createTestEnvelope(envelopeId, userId);
      const signerId = TestUtils.generateSignerId();
      const pendingSigners: EnvelopeSigner[] = [
        createTestSigner(signerId, 'signer@example.com', 'John Doe')
      ];

      const tracking = createTrackingData();

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
      
      const input = createTestInput({
        envelopeId,
        userId
      });

      const testEnvelope = createTestEnvelope(envelopeId, userId);
      const signer1Id = TestUtils.generateSignerId();
      const signer2Id = TestUtils.generateSignerId();
      const pendingSigners: EnvelopeSigner[] = [
        createTestSigner(signer1Id, 'signer1@example.com', 'John Doe'),
        createTestSigner(signer2Id, 'signer2@example.com', 'Jane Smith')
      ];

      const tracking = createTrackingData();
      const activeToken = createActiveToken();

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
      
      const input = createTestInput({
        envelopeId,
        userId
      });

      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(null);

      await expect(useCase.execute(input)).rejects.toThrow('Envelope not found');
    });

    it('should throw error when access validation fails', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      
      const input = createTestInput({
        envelopeId,
        userId
      });

      const testEnvelope = createTestEnvelope(envelopeId, 'another-user');
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
      
      const input = createTestInput({
        envelopeId,
        userId
      });

      const testEnvelope = createTestEnvelope(envelopeId, userId);
      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(testEnvelope);
      mockEnvelopeSignerService.getPendingSigners.mockRejectedValue(new Error('Get pending signers failed'));

      await expect(useCase.execute(input)).rejects.toThrow('Get pending signers failed');
    });

    it('should handle signers with missing optional fields', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      
      const input = createTestInput({
        envelopeId,
        userId
      });

      const testEnvelope = createTestEnvelope(envelopeId, userId);
      const signerId = TestUtils.generateSignerId();
      const pendingSigners: EnvelopeSigner[] = [
        { 
          getId: () => signerId, 
          getEmail: () => undefined, // Missing email
          getFullName: () => undefined // Missing full name
        } as EnvelopeSigner
      ];

      const tracking = createTrackingData();
      const activeToken = createActiveToken();

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
