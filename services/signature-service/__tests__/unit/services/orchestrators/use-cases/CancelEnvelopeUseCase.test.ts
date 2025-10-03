import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { CancelEnvelopeUseCase } from '../../../../../src/services/orchestrators/use-cases/CancelEnvelopeUseCase';
import {
  createSignatureEnvelopeServiceMock,
  createEnvelopeNotificationServiceMock
} from '../../../../helpers/mocks/services';
import { 
  createCancelEnvelopeTestData, 
  setupCancelEnvelopeMocks,
  executeCancelEnvelopeTest,
  createCancelEnvelopeErrorScenarioData
} from '../../../../helpers/CancelEnvelopeTestHelpers';

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
      const testData = createCancelEnvelopeTestData();
      setupCancelEnvelopeMocks({
        signatureEnvelopeService: mockSignatureEnvelopeService,
        envelopeNotificationService: mockEnvelopeNotificationService
      }, testData);

      await executeCancelEnvelopeTest(
        testData,
        {
          signatureEnvelopeService: mockSignatureEnvelopeService,
          envelopeNotificationService: mockEnvelopeNotificationService
        },
        useCase,
        { envelope: testData.testEnvelope }
      );
    });

    it('should handle cancellation failure and rethrow error', async () => {
      const testData = createCancelEnvelopeTestData();
      const error = new Error('Cancellation failed');
      mockSignatureEnvelopeService.cancelEnvelope.mockRejectedValue(error);

      await expect(useCase.execute({
        envelopeId: testData.envelopeId,
        userId: testData.userId,
        securityContext: testData.securityContext
      })).rejects.toThrow('Cancellation failed');

      expect(mockSignatureEnvelopeService.cancelEnvelope).toHaveBeenCalledWith(testData.envelopeId, testData.userId);
      expect(mockEnvelopeNotificationService.publishEnvelopeCancelled).not.toHaveBeenCalled();
    });

    it('should handle getEnvelopeWithSigners failure in notification without affecting result', async () => {
      const errorData = createCancelEnvelopeErrorScenarioData('getEnvelope');
      setupCancelEnvelopeMocks({
        signatureEnvelopeService: mockSignatureEnvelopeService,
        envelopeNotificationService: mockEnvelopeNotificationService
      }, errorData, errorData.mockOverrides);

      await executeCancelEnvelopeTest(
        errorData,
        {
          signatureEnvelopeService: mockSignatureEnvelopeService,
          envelopeNotificationService: mockEnvelopeNotificationService
        },
        useCase,
        { envelope: errorData.testEnvelope }
      );
    });

    it('should handle publishEnvelopeCancelled failure in notification without affecting result', async () => {
      const errorData = createCancelEnvelopeErrorScenarioData('notification');
      setupCancelEnvelopeMocks({
        signatureEnvelopeService: mockSignatureEnvelopeService,
        envelopeNotificationService: mockEnvelopeNotificationService
      }, errorData, errorData.mockOverrides);

      await executeCancelEnvelopeTest(
        errorData,
        {
          signatureEnvelopeService: mockSignatureEnvelopeService,
          envelopeNotificationService: mockEnvelopeNotificationService
        },
        useCase,
        { envelope: errorData.testEnvelope }
      );
    });

    it('should handle null envelope in notification flow', async () => {
      const errorData = createCancelEnvelopeErrorScenarioData('nullEnvelope');
      setupCancelEnvelopeMocks({
        signatureEnvelopeService: mockSignatureEnvelopeService,
        envelopeNotificationService: mockEnvelopeNotificationService
      }, errorData, errorData.mockOverrides);

      await executeCancelEnvelopeTest(
        errorData,
        {
          signatureEnvelopeService: mockSignatureEnvelopeService,
          envelopeNotificationService: mockEnvelopeNotificationService
        },
        useCase,
        { envelope: errorData.testEnvelope },
        [
          () => expect(mockEnvelopeNotificationService.publishEnvelopeCancelled).not.toHaveBeenCalled()
        ]
      );
    });

    it('should return cancelled envelope on success', async () => {
      const testData = createCancelEnvelopeTestData();
      setupCancelEnvelopeMocks({
        signatureEnvelopeService: mockSignatureEnvelopeService,
        envelopeNotificationService: mockEnvelopeNotificationService
      }, testData);

      await executeCancelEnvelopeTest(
        testData,
        {
          signatureEnvelopeService: mockSignatureEnvelopeService,
          envelopeNotificationService: mockEnvelopeNotificationService
        },
        useCase,
        { envelope: testData.testEnvelope },
        [
          () => expect(testData.testEnvelope).toBe(testData.testEnvelope),
          () => expect({ envelope: testData.testEnvelope }).toHaveProperty('envelope')
        ]
      );
    });

    it('should not affect result when notification fails', async () => {
      const testData = createCancelEnvelopeTestData();
      setupCancelEnvelopeMocks({
        signatureEnvelopeService: mockSignatureEnvelopeService,
        envelopeNotificationService: mockEnvelopeNotificationService
      }, testData, {
        publishEnvelopeCancelled: Promise.reject(new Error('Notification service down'))
      });

      await executeCancelEnvelopeTest(
        testData,
        {
          signatureEnvelopeService: mockSignatureEnvelopeService,
          envelopeNotificationService: mockEnvelopeNotificationService
        },
        useCase,
        { envelope: testData.testEnvelope }
      );
    });

    it('should handle non-Error objects in catch blocks', async () => {
      const testData = createCancelEnvelopeTestData();
      mockSignatureEnvelopeService.cancelEnvelope.mockRejectedValue('String error');

      await expect(useCase.execute({
        envelopeId: testData.envelopeId,
        userId: testData.userId,
        securityContext: testData.securityContext
      })).rejects.toThrow('String error');
    });

    it('should handle complex error objects', async () => {
      const testData = createCancelEnvelopeTestData();
      const complexError = {
        message: 'Complex error',
        code: 'ERR_001',
        details: { field: 'envelopeId' }
      };

      mockSignatureEnvelopeService.cancelEnvelope.mockRejectedValue(complexError);

      await expect(useCase.execute({
        envelopeId: testData.envelopeId,
        userId: testData.userId,
        securityContext: testData.securityContext
      })).rejects.toThrow('Complex error');
    });
  });
});
