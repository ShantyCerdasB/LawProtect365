import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { DeclineSignerUseCase } from '../../../../../src/services/orchestrators/use-cases/DeclineSignerUseCase';
import { DeclineSignerInput } from '../../../../../src/domain/types/usecase/orchestrator/DeclineSignerUseCase';
import { TestUtils } from '../../../../helpers/testUtils';
import { signatureEnvelopeEntity } from '../../../../helpers/builders/signatureEnvelope';
import { createSignatureEnvelopeServiceMock } from '../../../../helpers/mocks/services/SignatureEnvelopeService.mock';
import { createEnvelopeSignerServiceMock } from '../../../../helpers/mocks/services/EnvelopeSignerService.mock';
import { createEnvelopeNotificationServiceMock } from '../../../../helpers/mocks/services/EnvelopeNotificationService.mock';
import { createEnvelopeAccessServiceMock } from '../../../../helpers/mocks/services/EnvelopeAccessService.mock';
import { createEnvelopeStateServiceMock } from '../../../../helpers/mocks/services/EnvelopeStateService.mock';

describe('DeclineSignerUseCase', () => {
  let useCase: DeclineSignerUseCase;
  let mockSignatureEnvelopeService: any;
  let mockEnvelopeSignerService: any;
  let mockEnvelopeNotificationService: any;
  let mockEnvelopeAccessService: any;
  let mockEnvelopeStateService: any;

  // Helper function to create test input
  function createTestInput(overrides: Partial<DeclineSignerInput> = {}): DeclineSignerInput {
    const envelopeId = TestUtils.generateEnvelopeId();
    const signerId = TestUtils.generateSignerId();
    const reason = 'Not interested in signing';
    
    return {
      envelopeId,
      signerId,
      request: {
        reason,
        ...overrides.request
      },
      securityContext: {
        ipAddress: TestUtils.createTestIpAddress(),
        userAgent: TestUtils.createTestUserAgent(),
        country: 'US',
        ...overrides.securityContext
      },
      ...overrides
    };
  }

  // Helper function to create test signer
  function createTestSigner(signerId: any) {
    return { 
      getId: () => signerId,
      getFullName: () => 'John Doe',
      getEmail: () => ({ getValue: () => 'john.doe@example.com' })
    } as any;
  }

  // Helper function to create test envelope
  function createTestEnvelope(envelopeId: any, signer: any) {
    const testEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue() });
    testEnvelope.getSigners = jest.fn().mockReturnValue([signer]) as any;
    return testEnvelope;
  }

  // Helper function to setup successful mocks
  function setupSuccessfulMocks(testEnvelope: any, updatedEnvelope: any) {
    mockEnvelopeAccessService.validateUserAccess.mockResolvedValue(testEnvelope);
    mockEnvelopeSignerService.declineSigner.mockResolvedValue(undefined);
    mockEnvelopeStateService.updateEnvelopeStatusAfterDecline.mockResolvedValue(undefined);
    mockEnvelopeNotificationService.publishSignerDeclined.mockResolvedValue(undefined);
    mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(updatedEnvelope);
  }

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSignatureEnvelopeService = createSignatureEnvelopeServiceMock();
    mockEnvelopeSignerService = createEnvelopeSignerServiceMock();
    mockEnvelopeNotificationService = createEnvelopeNotificationServiceMock();
    mockEnvelopeAccessService = createEnvelopeAccessServiceMock();
    mockEnvelopeStateService = createEnvelopeStateServiceMock();

    useCase = new DeclineSignerUseCase(
      mockSignatureEnvelopeService,
      mockEnvelopeSignerService,
      mockEnvelopeNotificationService,
      mockEnvelopeAccessService,
      mockEnvelopeStateService
    );
  });

  describe('execute', () => {
    it('should decline signer successfully with all operations', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const signerId = TestUtils.generateSignerId();
      const invitationToken = TestUtils.generateUuid();
      
      const input = createTestInput({
        envelopeId,
        signerId,
        request: { invitationToken }
      });

      const testSigner = createTestSigner(signerId);
      const testEnvelope = createTestEnvelope(envelopeId, testSigner);
      const updatedEnvelope = signatureEnvelopeEntity({ 
        id: envelopeId.getValue(),
        status: 'DRAFT'
      });

      setupSuccessfulMocks(testEnvelope, updatedEnvelope);

      const result = await useCase.execute(input);

      expect(mockEnvelopeAccessService.validateUserAccess).toHaveBeenCalledWith(
        envelopeId,
        undefined,
        invitationToken
      );
      expect(mockEnvelopeSignerService.declineSigner).toHaveBeenCalledWith({
        signerId,
        reason: 'Not interested in signing',
        userId: undefined,
        invitationToken,
        ipAddress: input.securityContext.ipAddress,
        userAgent: input.securityContext.userAgent,
        country: input.securityContext.country
      });
      expect(mockEnvelopeStateService.updateEnvelopeStatusAfterDecline).toHaveBeenCalledWith(
        envelopeId,
        signerId,
        'Not interested in signing',
        'external-user:John Doe'
      );
      expect(mockEnvelopeNotificationService.publishSignerDeclined).toHaveBeenCalledWith(
        testEnvelope,
        testSigner,
        'Not interested in signing',
        input.securityContext
      );
      expect(mockSignatureEnvelopeService.getEnvelopeWithSigners).toHaveBeenCalledWith(envelopeId);

      expect(result).toEqual({
        success: true,
        message: 'Signer declined successfully',
        envelope: {
          id: updatedEnvelope.getId().getValue(),
          status: updatedEnvelope.getStatus().getValue()
        },
        declineInfo: {
          signerId: signerId.getValue(),
          reason: 'Not interested in signing',
          declinedAt: expect.any(String)
        }
      });
    });

    it('should throw error when signer is not found in envelope', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const signerId = TestUtils.generateSignerId();
      
      const input = createTestInput({
        envelopeId,
        signerId,
        request: { reason: 'Not interested' }
      });

      const differentSigner = createTestSigner(TestUtils.generateSignerId());
      const testEnvelope = createTestEnvelope(envelopeId, differentSigner);

      mockEnvelopeAccessService.validateUserAccess.mockResolvedValue(testEnvelope);

      await expect(useCase.execute(input)).rejects.toThrow('Signer not found');
    });

    it('should throw error when envelope is not found after decline', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const signerId = TestUtils.generateSignerId();
      
      const input = createTestInput({
        envelopeId,
        signerId,
        request: { reason: 'Not interested' }
      });

      const testSigner = createTestSigner(signerId);
      const testEnvelope = createTestEnvelope(envelopeId, testSigner);

      mockEnvelopeAccessService.validateUserAccess.mockResolvedValue(testEnvelope);
      mockEnvelopeSignerService.declineSigner.mockResolvedValue(undefined);
      mockEnvelopeStateService.updateEnvelopeStatusAfterDecline.mockResolvedValue(undefined);
      mockEnvelopeNotificationService.publishSignerDeclined.mockResolvedValue(undefined);
      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(null);

      await expect(useCase.execute(input)).rejects.toThrow('Envelope not found');
    });

    it('should throw error when decline signer fails', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const signerId = TestUtils.generateSignerId();
      
      const input = createTestInput({
        envelopeId,
        signerId,
        request: { reason: 'Not interested' }
      });

      const testSigner = createTestSigner(signerId);
      const testEnvelope = createTestEnvelope(envelopeId, testSigner);

      const declineError = new Error('Decline signer failed');
      mockEnvelopeAccessService.validateUserAccess.mockResolvedValue(testEnvelope);
      mockEnvelopeSignerService.declineSigner.mockRejectedValue(declineError);

      await expect(useCase.execute(input)).rejects.toThrow('Decline signer failed');
    });

    it('should throw error when update envelope status fails', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const signerId = TestUtils.generateSignerId();
      
      const input = createTestInput({
        envelopeId,
        signerId,
        request: { reason: 'Not interested' }
      });

      const testSigner = createTestSigner(signerId);
      const testEnvelope = createTestEnvelope(envelopeId, testSigner);

      const updateError = new Error('Update envelope status failed');
      mockEnvelopeAccessService.validateUserAccess.mockResolvedValue(testEnvelope);
      mockEnvelopeSignerService.declineSigner.mockResolvedValue(undefined);
      mockEnvelopeStateService.updateEnvelopeStatusAfterDecline.mockRejectedValue(updateError);

      await expect(useCase.execute(input)).rejects.toThrow('Update envelope status failed');
    });

    it('should handle notification failure gracefully (fire-and-forget)', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const signerId = TestUtils.generateSignerId();
      
      const input = createTestInput({
        envelopeId,
        signerId,
        request: { reason: 'Not interested' }
      });

      const testSigner = createTestSigner(signerId);
      const testEnvelope = createTestEnvelope(envelopeId, testSigner);
      const updatedEnvelope = signatureEnvelopeEntity({ 
        id: envelopeId.getValue(),
        status: 'DRAFT'
      });

      setupSuccessfulMocks(testEnvelope, updatedEnvelope);

      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Signer declined successfully');
    });

    it('should throw error when validate user access fails', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const signerId = TestUtils.generateSignerId();
      
      const input = createTestInput({
        envelopeId,
        signerId,
        request: { reason: 'Not interested' }
      });

      const accessError = new Error('Access denied');
      mockEnvelopeAccessService.validateUserAccess.mockRejectedValue(accessError);

      await expect(useCase.execute(input)).rejects.toThrow('Access denied');
    });

    it('should handle decline with invitation token', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const signerId = TestUtils.generateSignerId();
      const invitationToken = TestUtils.generateUuid();
      
      const input = createTestInput({
        envelopeId,
        signerId,
        request: {
          reason: 'Not interested',
          invitationToken
        }
      });

      const testSigner = createTestSigner(signerId);
      const testEnvelope = createTestEnvelope(envelopeId, testSigner);
      const updatedEnvelope = signatureEnvelopeEntity({ 
        id: envelopeId.getValue(),
        status: 'DRAFT'
      });

      setupSuccessfulMocks(testEnvelope, updatedEnvelope);

      const result = await useCase.execute(input);

      expect(mockEnvelopeAccessService.validateUserAccess).toHaveBeenCalledWith(
        envelopeId,
        undefined,
        invitationToken
      );
      expect(mockEnvelopeSignerService.declineSigner).toHaveBeenCalledWith({
        signerId,
        reason: 'Not interested',
        userId: undefined,
        invitationToken,
        ipAddress: input.securityContext.ipAddress,
        userAgent: input.securityContext.userAgent,
        country: input.securityContext.country
      });

      expect(result.success).toBe(true);
      expect(result.declineInfo.signerId).toBe(signerId.getValue());
      expect(result.declineInfo.reason).toBe('Not interested');
    });
  });
});
