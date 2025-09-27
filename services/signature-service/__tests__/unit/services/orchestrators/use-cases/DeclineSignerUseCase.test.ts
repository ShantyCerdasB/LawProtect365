import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { DeclineSignerUseCase } from '../../../../../src/services/orchestrators/use-cases/DeclineSignerUseCase';
import { DeclineSignerInput } from '../../../../../src/domain/types/usecase/orchestrator/DeclineSignerUseCase';
import { EnvelopeId } from '../../../../../src/domain/value-objects/EnvelopeId';
import { SignerId } from '../../../../../src/domain/value-objects/SignerId';
import { SignatureEnvelope } from '../../../../../src/domain/entities/SignatureEnvelope';
import { EnvelopeSigner } from '../../../../../src/domain/entities/EnvelopeSigner';
import { EnvelopeStatus } from '../../../../../src/domain/value-objects/EnvelopeStatus';
import { TestUtils } from '../../../../helpers/testUtils';
import { signatureEnvelopeEntity } from '../../../../helpers/builders/signatureEnvelope';
// import { envelopeSignerEntity } from '../../../../helpers/builders/envelopeSigner';
import { createSignatureEnvelopeServiceMock } from '../../../../helpers/mocks/services/SignatureEnvelopeService';
import { createEnvelopeSignerServiceMock } from '../../../../helpers/mocks/services/EnvelopeSignerService';
import { createEnvelopeNotificationServiceMock } from '../../../../helpers/mocks/services/EnvelopeNotificationService';

describe('DeclineSignerUseCase', () => {
  let useCase: DeclineSignerUseCase;
  let mockSignatureEnvelopeService: any;
  let mockEnvelopeSignerService: any;
  let mockEnvelopeNotificationService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSignatureEnvelopeService = createSignatureEnvelopeServiceMock();
    mockEnvelopeSignerService = createEnvelopeSignerServiceMock();
    mockEnvelopeNotificationService = createEnvelopeNotificationServiceMock();

    useCase = new DeclineSignerUseCase(
      mockSignatureEnvelopeService,
      mockEnvelopeSignerService,
      mockEnvelopeNotificationService
    );
  });

  describe('execute', () => {
    it('should decline signer successfully with all operations', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const signerId = TestUtils.generateSignerId();
      const reason = 'Not interested in signing';
      const invitationToken = TestUtils.generateUuid();
      
      const input: DeclineSignerInput = {
        envelopeId,
        signerId,
        request: {
          reason,
          invitationToken
        },
        securityContext: {
          ipAddress: TestUtils.createTestIpAddress(),
          userAgent: TestUtils.createTestUserAgent(),
          country: 'US'
        }
      };

      const testEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue() });
      const testSigner = { getId: () => signerId } as any;
      testEnvelope.getSigners = jest.fn().mockReturnValue([testSigner]) as any;
      const updatedEnvelope = signatureEnvelopeEntity({ 
        id: envelopeId.getValue(),
        status: 'DRAFT'
      });

      mockSignatureEnvelopeService.validateUserAccess.mockResolvedValue(testEnvelope);
      mockEnvelopeSignerService.declineSigner.mockResolvedValue(undefined);
      mockSignatureEnvelopeService.updateEnvelopeStatusAfterDecline.mockResolvedValue(undefined);
      mockEnvelopeNotificationService.publishSignerDeclined.mockResolvedValue(undefined);
      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(updatedEnvelope);

      const result = await useCase.execute(input);

      expect(mockSignatureEnvelopeService.validateUserAccess).toHaveBeenCalledWith(
        envelopeId,
        undefined,
        invitationToken
      );
      expect(mockEnvelopeSignerService.declineSigner).toHaveBeenCalledWith({
        signerId,
        reason,
        userId: undefined,
        invitationToken,
        ipAddress: input.securityContext.ipAddress,
        userAgent: input.securityContext.userAgent,
        country: input.securityContext.country
      });
      expect(mockSignatureEnvelopeService.updateEnvelopeStatusAfterDecline).toHaveBeenCalledWith(
        envelopeId,
        signerId,
        reason
      );
      expect(mockEnvelopeNotificationService.publishSignerDeclined).toHaveBeenCalledWith(
        testEnvelope,
        testSigner,
        reason,
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
          reason,
          declinedAt: expect.any(String)
        }
      });
    });

    it('should throw error when signer is not found in envelope', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const signerId = TestUtils.generateSignerId();
      const reason = 'Not interested';
      
      const input: DeclineSignerInput = {
        envelopeId,
        signerId,
        request: { reason },
        securityContext: {
          ipAddress: TestUtils.createTestIpAddress(),
          userAgent: TestUtils.createTestUserAgent(),
          country: 'US'
        }
      };

      const testEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue() });
      // Mock envelope with different signer ID
      const differentSigner = { getId: () => TestUtils.generateSignerId() } as any;
      testEnvelope.getSigners = jest.fn().mockReturnValue([differentSigner]) as any;

      mockSignatureEnvelopeService.validateUserAccess.mockResolvedValue(testEnvelope);

      await expect(useCase.execute(input)).rejects.toThrow('Signer not found');
    });

    it('should throw error when envelope is not found after decline', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const signerId = TestUtils.generateSignerId();
      const reason = 'Not interested';
      
      const input: DeclineSignerInput = {
        envelopeId,
        signerId,
        request: { reason },
        securityContext: {
          ipAddress: TestUtils.createTestIpAddress(),
          userAgent: TestUtils.createTestUserAgent(),
          country: 'US'
        }
      };

      const testEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue() });
      const testSigner = { getId: () => signerId } as any;
      testEnvelope.getSigners = jest.fn().mockReturnValue([testSigner]) as any;

      mockSignatureEnvelopeService.validateUserAccess.mockResolvedValue(testEnvelope);
      mockEnvelopeSignerService.declineSigner.mockResolvedValue(undefined);
      mockSignatureEnvelopeService.updateEnvelopeStatusAfterDecline.mockResolvedValue(undefined);
      mockEnvelopeNotificationService.publishSignerDeclined.mockResolvedValue(undefined);
      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(null);

      await expect(useCase.execute(input)).rejects.toThrow('Envelope not found');
    });

    it('should throw error when decline signer fails', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const signerId = TestUtils.generateSignerId();
      const reason = 'Not interested';
      
      const input: DeclineSignerInput = {
        envelopeId,
        signerId,
        request: { reason },
        securityContext: {
          ipAddress: TestUtils.createTestIpAddress(),
          userAgent: TestUtils.createTestUserAgent(),
          country: 'US'
        }
      };

      const testEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue() });
      const testSigner = { getId: () => signerId } as any;
      testEnvelope.getSigners = jest.fn().mockReturnValue([testSigner]) as any;

      const declineError = new Error('Decline signer failed');
      mockSignatureEnvelopeService.validateUserAccess.mockResolvedValue(testEnvelope);
      mockEnvelopeSignerService.declineSigner.mockRejectedValue(declineError);

      await expect(useCase.execute(input)).rejects.toThrow('Decline signer failed');
    });

    it('should throw error when update envelope status fails', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const signerId = TestUtils.generateSignerId();
      const reason = 'Not interested';
      
      const input: DeclineSignerInput = {
        envelopeId,
        signerId,
        request: { reason },
        securityContext: {
          ipAddress: TestUtils.createTestIpAddress(),
          userAgent: TestUtils.createTestUserAgent(),
          country: 'US'
        }
      };

      const testEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue() });
      const testSigner = { getId: () => signerId } as any;
      testEnvelope.getSigners = jest.fn().mockReturnValue([testSigner]) as any;

      const updateError = new Error('Update envelope status failed');
      mockSignatureEnvelopeService.validateUserAccess.mockResolvedValue(testEnvelope);
      mockEnvelopeSignerService.declineSigner.mockResolvedValue(undefined);
      mockSignatureEnvelopeService.updateEnvelopeStatusAfterDecline.mockRejectedValue(updateError);

      await expect(useCase.execute(input)).rejects.toThrow('Update envelope status failed');
    });

    it('should handle notification failure gracefully (fire-and-forget)', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const signerId = TestUtils.generateSignerId();
      const reason = 'Not interested';
      
      const input: DeclineSignerInput = {
        envelopeId,
        signerId,
        request: { reason },
        securityContext: {
          ipAddress: TestUtils.createTestIpAddress(),
          userAgent: TestUtils.createTestUserAgent(),
          country: 'US'
        }
      };

      const testEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue() });
      const testSigner = { getId: () => signerId } as any;
      testEnvelope.getSigners = jest.fn().mockReturnValue([testSigner]) as any;
      const updatedEnvelope = signatureEnvelopeEntity({ 
        id: envelopeId.getValue(),
        status: 'DRAFT'
      });

      mockSignatureEnvelopeService.validateUserAccess.mockResolvedValue(testEnvelope);
      mockEnvelopeSignerService.declineSigner.mockResolvedValue(undefined);
      mockSignatureEnvelopeService.updateEnvelopeStatusAfterDecline.mockResolvedValue(undefined);
      mockEnvelopeNotificationService.publishSignerDeclined.mockResolvedValue(undefined);
      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(updatedEnvelope);

      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Signer declined successfully');
    });

    it('should throw error when validate user access fails', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const signerId = TestUtils.generateSignerId();
      const reason = 'Not interested';
      
      const input: DeclineSignerInput = {
        envelopeId,
        signerId,
        request: { reason },
        securityContext: {
          ipAddress: TestUtils.createTestIpAddress(),
          userAgent: TestUtils.createTestUserAgent(),
          country: 'US'
        }
      };

      const accessError = new Error('Access denied');
      mockSignatureEnvelopeService.validateUserAccess.mockRejectedValue(accessError);

      await expect(useCase.execute(input)).rejects.toThrow('Access denied');
    });

    it('should handle decline with invitation token', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const signerId = TestUtils.generateSignerId();
      const reason = 'Not interested';
      const invitationToken = TestUtils.generateUuid();
      
      const input: DeclineSignerInput = {
        envelopeId,
        signerId,
        request: {
          reason,
          invitationToken
        },
        securityContext: {
          ipAddress: TestUtils.createTestIpAddress(),
          userAgent: TestUtils.createTestUserAgent(),
          country: 'US'
        }
      };

      const testEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue() });
      const testSigner = { getId: () => signerId } as any;
      testEnvelope.getSigners = jest.fn().mockReturnValue([testSigner]) as any;
      const updatedEnvelope = signatureEnvelopeEntity({ 
        id: envelopeId.getValue(),
        status: 'DRAFT'
      });

      mockSignatureEnvelopeService.validateUserAccess.mockResolvedValue(testEnvelope);
      mockEnvelopeSignerService.declineSigner.mockResolvedValue(undefined);
      mockSignatureEnvelopeService.updateEnvelopeStatusAfterDecline.mockResolvedValue(undefined);
      mockEnvelopeNotificationService.publishSignerDeclined.mockResolvedValue(undefined);
      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(updatedEnvelope);

      const result = await useCase.execute(input);

      expect(mockSignatureEnvelopeService.validateUserAccess).toHaveBeenCalledWith(
        envelopeId,
        undefined,
        invitationToken
      );
      expect(mockEnvelopeSignerService.declineSigner).toHaveBeenCalledWith({
        signerId,
        reason,
        userId: undefined,
        invitationToken,
        ipAddress: input.securityContext.ipAddress,
        userAgent: input.securityContext.userAgent,
        country: input.securityContext.country
      });

      expect(result.success).toBe(true);
      expect(result.declineInfo.signerId).toBe(signerId.getValue());
      expect(result.declineInfo.reason).toBe(reason);
    });
  });
});
