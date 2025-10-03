import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { SendEnvelopeUseCase } from '../../../../../src/services/orchestrators/use-cases/SendEnvelopeUseCase';
import { createSignatureEnvelopeServiceMock } from '../../../../helpers/mocks/services/SignatureEnvelopeService.mock';
import { createInvitationTokenServiceMock } from '../../../../helpers/mocks/services/InvitationTokenService.mock';
import { createAuditEventServiceMock } from '../../../../helpers/mocks/services/AuditEventService.mock';
import { createEnvelopeNotificationServiceMock } from '../../../../helpers/mocks/services/EnvelopeNotificationService.mock';
import { 
  createSendEnvelopeTestData, 
  setupSendEnvelopeMocks,
  executeSendEnvelopeTest,
  createSendEnvelopeErrorScenarioData,
  createMultiSignerTestData
} from '../../../../helpers/SendEnvelopeTestHelpers';

// Mock selectTargetSigners utility
jest.mock('../../../../../src/services/orchestrators/utils/signerSelection', () => ({
  selectTargetSigners: jest.fn()
}));

describe('SendEnvelopeUseCase', () => {
  let useCase: SendEnvelopeUseCase;
  let mockSignatureEnvelopeService: any;
  let mockInvitationTokenService: any;
  let mockAuditEventService: any;
  let mockEnvelopeNotificationService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSignatureEnvelopeService = createSignatureEnvelopeServiceMock();
    mockInvitationTokenService = createInvitationTokenServiceMock();
    mockAuditEventService = createAuditEventServiceMock();
    mockEnvelopeNotificationService = createEnvelopeNotificationServiceMock();

    useCase = new SendEnvelopeUseCase(
      mockSignatureEnvelopeService,
      mockInvitationTokenService,
      mockAuditEventService,
      mockEnvelopeNotificationService
    );
  });

  describe('execute', () => {
    it('should send envelope successfully with all operations', async () => {
      const testData = createMultiSignerTestData(2);
      const input = {
        ...testData.input,
        options: {
          message: 'Please sign this document',
          sendToAll: true
        }
      };

      setupSendEnvelopeMocks({
        signatureEnvelopeService: mockSignatureEnvelopeService,
        invitationTokenService: mockInvitationTokenService,
        envelopeNotificationService: mockEnvelopeNotificationService,
        auditEventService: mockAuditEventService
      }, testData);

      const result = await useCase.execute(input);

      expect(mockSignatureEnvelopeService.sendEnvelope).toHaveBeenCalledWith(testData.envelopeId, testData.userId);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Envelope sent successfully');
      expect(result.envelopeId).toBe(testData.envelopeId.getValue());
      expect(result.status).toBe('SENT');
      expect(result.tokensGenerated).toBe(2);
      expect(result.signersNotified).toBe(2);
    });

    it('should send envelope with minimal options', async () => {
      const testData = createSendEnvelopeTestData();
      setupSendEnvelopeMocks({
        signatureEnvelopeService: mockSignatureEnvelopeService,
        invitationTokenService: mockInvitationTokenService,
        envelopeNotificationService: mockEnvelopeNotificationService,
        auditEventService: mockAuditEventService
      }, testData);

      const result = await useCase.execute(testData.input);

      expect(result.success).toBe(true);
      expect(result.tokensGenerated).toBe(1);
      expect(result.signersNotified).toBe(1);
    });

    it('should handle empty external signers', async () => {
      const testData = createSendEnvelopeTestData();
      testData.testEnvelope.getExternalSigners = jest.fn().mockReturnValue([]) as any;
      
      setupSendEnvelopeMocks({
        signatureEnvelopeService: mockSignatureEnvelopeService,
        invitationTokenService: mockInvitationTokenService,
        envelopeNotificationService: mockEnvelopeNotificationService,
        auditEventService: mockAuditEventService
      }, testData, {
        selectTargetSigners: [],
        generateInvitationTokensForSigners: []
      });

      const result = await useCase.execute(testData.input);

      expect(result.tokensGenerated).toBe(0);
      expect(result.signersNotified).toBe(0);
      expect(result.tokens).toEqual([]);
    });

    it('should handle security context with missing optional fields', async () => {
      const testData = createSendEnvelopeTestData({
        securityContext: {
          ipAddress: undefined,
          userAgent: undefined,
          country: 'US'
        }
      });
      
      setupSendEnvelopeMocks({
        signatureEnvelopeService: mockSignatureEnvelopeService,
        invitationTokenService: mockInvitationTokenService,
        envelopeNotificationService: mockEnvelopeNotificationService,
        auditEventService: mockAuditEventService
      }, testData, {
        generateInvitationTokensForSigners: []
      });

      const result = await useCase.execute(testData.input);

      expect(result.success).toBe(true);
    });

    it('should throw error when sendEnvelope fails', async () => {
      const errorData = createSendEnvelopeErrorScenarioData('sendEnvelope');
      setupSendEnvelopeMocks({
        signatureEnvelopeService: mockSignatureEnvelopeService,
        invitationTokenService: mockInvitationTokenService,
        envelopeNotificationService: mockEnvelopeNotificationService,
        auditEventService: mockAuditEventService
      }, errorData, errorData.mockOverrides);

      await expect(useCase.execute(errorData.input)).rejects.toThrow('Send envelope failed');
    });

    it('should throw error when token generation fails', async () => {
      const errorData = createSendEnvelopeErrorScenarioData('tokenGeneration');
      setupSendEnvelopeMocks({
        signatureEnvelopeService: mockSignatureEnvelopeService,
        invitationTokenService: mockInvitationTokenService,
        envelopeNotificationService: mockEnvelopeNotificationService,
        auditEventService: mockAuditEventService
      }, errorData, errorData.mockOverrides);

      await expect(useCase.execute(errorData.input)).rejects.toThrow('Token generation failed');
    });

    it('should throw error when notification sending fails', async () => {
      const errorData = createSendEnvelopeErrorScenarioData('notification');
      setupSendEnvelopeMocks({
        signatureEnvelopeService: mockSignatureEnvelopeService,
        invitationTokenService: mockInvitationTokenService,
        envelopeNotificationService: mockEnvelopeNotificationService,
        auditEventService: mockAuditEventService
      }, errorData, errorData.mockOverrides);

      await expect(useCase.execute(errorData.input)).rejects.toThrow('Notification failed');
    });

    it('should throw error when audit event creation fails', async () => {
      const errorData = createSendEnvelopeErrorScenarioData('auditEvent');
      setupSendEnvelopeMocks({
        signatureEnvelopeService: mockSignatureEnvelopeService,
        invitationTokenService: mockInvitationTokenService,
        envelopeNotificationService: mockEnvelopeNotificationService,
        auditEventService: mockAuditEventService
      }, errorData, errorData.mockOverrides);

      await expect(useCase.execute(errorData.input)).rejects.toThrow('Audit event creation failed');
    });
  });
});
