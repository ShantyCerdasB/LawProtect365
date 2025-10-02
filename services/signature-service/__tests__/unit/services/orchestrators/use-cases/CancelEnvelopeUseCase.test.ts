import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { CancelEnvelopeUseCase } from '../../../../../src/services/orchestrators/use-cases/CancelEnvelopeUseCase';
import { NetworkSecurityContext } from '@lawprotect/shared-ts';
import { TestUtils } from '../../../../helpers/testUtils';
import { signatureEnvelopeEntity } from '../../../../helpers/builders/signatureEnvelope';
import {
  createSignatureEnvelopeServiceMock,
  createEnvelopeNotificationServiceMock
} from '../../../../helpers/mocks/services';

describe('CancelEnvelopeUseCase', () => {
  let useCase: CancelEnvelopeUseCase;
  let mockSignatureEnvelopeService: any;
  let mockEnvelopeNotificationService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSignatureEnvelopeService = createSignatureEnvelopeServiceMock();
    mockEnvelopeNotificationService = createEnvelopeNotificationServiceMock();
    useCase = new CancelEnvelopeUseCase(mockSignatureEnvelopeService, mockEnvelopeNotificationService);
  });

  describe('execute', () => {
    it('should cancel envelope and dispatch notification successfully', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      const securityContext: NetworkSecurityContext = {
        ipAddress: TestUtils.createTestIpAddress(),
        userAgent: TestUtils.createTestUserAgent(),
        country: 'US'
      };

      const testEnvelope = signatureEnvelopeEntity();
      mockSignatureEnvelopeService.cancelEnvelope.mockResolvedValue(testEnvelope);
      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(testEnvelope);
      mockEnvelopeNotificationService.publishEnvelopeCancelled.mockResolvedValue(undefined);

      const result = await useCase.execute({
        envelopeId,
        userId,
        securityContext
      });

      expect(mockSignatureEnvelopeService.cancelEnvelope).toHaveBeenCalledWith(envelopeId, userId);
      expect(result).toEqual({ envelope: testEnvelope });
    });

    it('should handle cancellation failure and rethrow error', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      const securityContext: NetworkSecurityContext = {
        ipAddress: TestUtils.createTestIpAddress(),
        userAgent: TestUtils.createTestUserAgent(),
        country: 'US'
      };

      const error = new Error('Cancellation failed');
      mockSignatureEnvelopeService.cancelEnvelope.mockRejectedValue(error);

      await expect(useCase.execute({
        envelopeId,
        userId,
        securityContext
      })).rejects.toThrow('Cancellation failed');

      expect(mockSignatureEnvelopeService.cancelEnvelope).toHaveBeenCalledWith(envelopeId, userId);
      expect(mockEnvelopeNotificationService.publishEnvelopeCancelled).not.toHaveBeenCalled();
    });

    it('should handle getEnvelopeWithSigners failure in notification without affecting result', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      const securityContext: NetworkSecurityContext = {
        ipAddress: TestUtils.createTestIpAddress(),
        userAgent: TestUtils.createTestUserAgent(),
        country: 'US'
      };

      const testEnvelope = signatureEnvelopeEntity();
      mockSignatureEnvelopeService.cancelEnvelope.mockResolvedValue(testEnvelope);
      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockRejectedValue(new Error('Get envelope failed'));
      mockEnvelopeNotificationService.publishEnvelopeCancelled.mockResolvedValue(undefined);

      const result = await useCase.execute({
        envelopeId,
        userId,
        securityContext
      });

      expect(result).toEqual({ envelope: testEnvelope });
      expect(mockSignatureEnvelopeService.cancelEnvelope).toHaveBeenCalledWith(envelopeId, userId);
    });

    it('should handle publishEnvelopeCancelled failure in notification without affecting result', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      const securityContext: NetworkSecurityContext = {
        ipAddress: TestUtils.createTestIpAddress(),
        userAgent: TestUtils.createTestUserAgent(),
        country: 'US'
      };

      const testEnvelope = signatureEnvelopeEntity();
      mockSignatureEnvelopeService.cancelEnvelope.mockResolvedValue(testEnvelope);
      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(testEnvelope);
      mockEnvelopeNotificationService.publishEnvelopeCancelled.mockRejectedValue(new Error('Notification failed'));

      const result = await useCase.execute({
        envelopeId,
        userId,
        securityContext
      });

      expect(result).toEqual({ envelope: testEnvelope });
      expect(mockSignatureEnvelopeService.cancelEnvelope).toHaveBeenCalledWith(envelopeId, userId);
    });

    it('should handle null envelope in notification flow', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      const securityContext: NetworkSecurityContext = {
        ipAddress: TestUtils.createTestIpAddress(),
        userAgent: TestUtils.createTestUserAgent(),
        country: 'US'
      };

      const testEnvelope = signatureEnvelopeEntity();
      mockSignatureEnvelopeService.cancelEnvelope.mockResolvedValue(testEnvelope);
      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(null);
      mockEnvelopeNotificationService.publishEnvelopeCancelled.mockResolvedValue(undefined);

      const result = await useCase.execute({
        envelopeId,
        userId,
        securityContext
      });

      expect(result).toEqual({ envelope: testEnvelope });
      expect(mockSignatureEnvelopeService.cancelEnvelope).toHaveBeenCalledWith(envelopeId, userId);
      expect(mockEnvelopeNotificationService.publishEnvelopeCancelled).not.toHaveBeenCalled();
    });

    it('should return cancelled envelope on success', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      const securityContext: NetworkSecurityContext = {
        ipAddress: TestUtils.createTestIpAddress(),
        userAgent: TestUtils.createTestUserAgent(),
        country: 'US'
      };

      const testEnvelope = signatureEnvelopeEntity();
      mockSignatureEnvelopeService.cancelEnvelope.mockResolvedValue(testEnvelope);
      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(testEnvelope);
      mockEnvelopeNotificationService.publishEnvelopeCancelled.mockResolvedValue(undefined);

      const result = await useCase.execute({
        envelopeId,
        userId,
        securityContext
      });

      expect(result.envelope).toBe(testEnvelope);
      expect(result).toHaveProperty('envelope');
    });

    it('should not affect result when notification fails', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      const securityContext: NetworkSecurityContext = {
        ipAddress: TestUtils.createTestIpAddress(),
        userAgent: TestUtils.createTestUserAgent(),
        country: 'US'
      };

      const testEnvelope = signatureEnvelopeEntity();
      mockSignatureEnvelopeService.cancelEnvelope.mockResolvedValue(testEnvelope);
      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(testEnvelope);
      mockEnvelopeNotificationService.publishEnvelopeCancelled.mockRejectedValue(new Error('Notification service down'));

      const result = await useCase.execute({
        envelopeId,
        userId,
        securityContext
      });

      expect(result).toEqual({ envelope: testEnvelope });
      expect(mockSignatureEnvelopeService.cancelEnvelope).toHaveBeenCalledWith(envelopeId, userId);
    });

    it('should handle non-Error objects in catch blocks', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      const securityContext: NetworkSecurityContext = {
        ipAddress: TestUtils.createTestIpAddress(),
        userAgent: TestUtils.createTestUserAgent(),
        country: 'US'
      };

      mockSignatureEnvelopeService.cancelEnvelope.mockRejectedValue('String error');

      await expect(useCase.execute({
        envelopeId,
        userId,
        securityContext
      })).rejects.toThrow('String error');
    });

    it('should handle complex error objects', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      const securityContext: NetworkSecurityContext = {
        ipAddress: TestUtils.createTestIpAddress(),
        userAgent: TestUtils.createTestUserAgent(),
        country: 'US'
      };

      const complexError = {
        message: 'Complex error',
        code: 'ERR_001',
        details: { field: 'envelopeId' }
      };

      mockSignatureEnvelopeService.cancelEnvelope.mockRejectedValue(complexError);

      await expect(useCase.execute({
        envelopeId,
        userId,
        securityContext
      })).rejects.toThrow('Complex error');
    });
  });
});
