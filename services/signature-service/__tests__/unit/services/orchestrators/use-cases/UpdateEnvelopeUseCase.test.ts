import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { UpdateEnvelopeUseCase } from '../../../../../src/services/orchestrators/use-cases/UpdateEnvelopeUseCase';
import { UpdateEnvelopeUseCaseInput, UpdateEnvelopeUseCaseResult } from '../../../../../src/domain/types/usecase/orchestrator/UpdateEnvelopeUseCase';
import { EnvelopeId } from '../../../../../src/domain/value-objects/EnvelopeId';
import { TestUtils } from '../../../../helpers/testUtils';
import { createSignatureEnvelopeServiceMock } from '../../../../helpers/mocks/services/SignatureEnvelopeService.mock';
import { createEnvelopeSignerServiceMock } from '../../../../helpers/mocks/services/EnvelopeSignerService.mock';
import { createS3ServiceMock } from '../../../../helpers/mocks/services/S3Service.mock';
import { signatureEnvelopeEntity } from '../../../../helpers/builders/signatureEnvelope';
import { EnvelopeSigner } from '../../../../../src/domain/entities/EnvelopeSigner';
import { SignerId } from '../../../../../src/domain/value-objects/SignerId';

// Mock external utilities
jest.mock('../../../../../src/infrastructure/factories/EntityFactory', () => ({
  EntityFactory: {
    createValueObjects: {
      signerId: jest.fn(id => ({ getValue: () => id })),
    },
  },
}));
jest.mock('../../../../../src/services/orchestrators/utils/mapAddSigners', () => ({
  mapAddSigners: jest.fn(),
}));

describe('UpdateEnvelopeUseCase', () => {
  let useCase: UpdateEnvelopeUseCase;
  let mockSignatureEnvelopeService: any;
  let mockEnvelopeSignerService: any;
  let mockS3Service: any;
  let mockEntityFactory: any;
  let mockMapAddSigners: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSignatureEnvelopeService = createSignatureEnvelopeServiceMock();
    mockEnvelopeSignerService = createEnvelopeSignerServiceMock();
    mockS3Service = createS3ServiceMock();

    // Get references to mocked functions
    mockEntityFactory = require('../../../../../src/infrastructure/factories/EntityFactory').EntityFactory;
    mockMapAddSigners = require('../../../../../src/services/orchestrators/utils/mapAddSigners').mapAddSigners as jest.Mock;

    useCase = new UpdateEnvelopeUseCase(
      mockSignatureEnvelopeService,
      mockEnvelopeSignerService,
      mockS3Service
    );
  });

  describe('execute', () => {
    it('should update envelope successfully without S3 validation', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      const updateData = {
        title: 'Updated Title',
        description: 'Updated Description'
      };

      const input: UpdateEnvelopeUseCaseInput = {
        envelopeId,
        updateData,
        userId
      };

      const updatedEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue(), title: 'Updated Title' });

      mockSignatureEnvelopeService.updateEnvelope.mockResolvedValue(updatedEnvelope);

      const result = await useCase.execute(input);

      expect(mockS3Service.assertExists).not.toHaveBeenCalled();
      expect(mockSignatureEnvelopeService.updateEnvelope).toHaveBeenCalledWith(envelopeId, updateData, userId);
      expect(mockEnvelopeSignerService.createSignersForEnvelope).not.toHaveBeenCalled();
      expect(mockEnvelopeSignerService.deleteSigner).not.toHaveBeenCalled();
      expect(mockSignatureEnvelopeService.getEnvelopeWithSigners).not.toHaveBeenCalled();
      expect(result).toEqual({ envelope: updatedEnvelope });
    });

    it('should update envelope with S3 validation', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      const updateData = {
        title: 'Updated Title',
        sourceKey: 's3-source-key',
        metaKey: 's3-meta-key'
      };

      const input: UpdateEnvelopeUseCaseInput = {
        envelopeId,
        updateData,
        userId
      };

      const updatedEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue(), title: 'Updated Title' });

      mockS3Service.assertExists.mockResolvedValue(undefined);
      mockSignatureEnvelopeService.updateEnvelope.mockResolvedValue(updatedEnvelope);

      const result = await useCase.execute(input);

      expect(mockS3Service.assertExists).toHaveBeenCalledWith({
        sourceKey: updateData.sourceKey,
        metaKey: updateData.metaKey
      });
      expect(mockSignatureEnvelopeService.updateEnvelope).toHaveBeenCalledWith(envelopeId, updateData, userId);
      expect(result).toEqual({ envelope: updatedEnvelope });
    });

    it('should update envelope with signer additions', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      const addSigners = [
        { email: 'signer1@example.com', fullName: 'Signer 1', isExternal: true },
        { email: 'signer2@example.com', fullName: 'Signer 2', isExternal: true }
      ];
      const updateData = {
        title: 'Updated Title',
        addSigners
      };

      const input: UpdateEnvelopeUseCaseInput = {
        envelopeId,
        updateData,
        userId
      };

      const updatedEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue(), title: 'Updated Title' });
      const mappedSigners = [
        { envelopeId, signerId: 'signer-1', email: 'signer1@example.com', fullName: 'Signer 1', userId },
        { envelopeId, signerId: 'signer-2', email: 'signer2@example.com', fullName: 'Signer 2', userId }
      ];
      const testSigners = [
        { getId: () => SignerId.fromString('signer-1') } as EnvelopeSigner,
        { getId: () => SignerId.fromString('signer-2') } as EnvelopeSigner
      ];

      mockSignatureEnvelopeService.updateEnvelope.mockResolvedValue(updatedEnvelope);
      mockMapAddSigners.mockReturnValue(mappedSigners);
      mockEnvelopeSignerService.createSignersForEnvelope.mockResolvedValue(undefined);
      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue({
        ...updatedEnvelope,
        getSigners: jest.fn().mockReturnValue(testSigners)
      });

      const result = await useCase.execute(input);

      expect(mockMapAddSigners).toHaveBeenCalledWith(addSigners, envelopeId, userId);
      expect(mockEnvelopeSignerService.createSignersForEnvelope).toHaveBeenCalledWith(envelopeId, mappedSigners);
      expect(mockSignatureEnvelopeService.getEnvelopeWithSigners).toHaveBeenCalledWith(envelopeId);
      expect(result).toEqual({
        envelope: updatedEnvelope,
        signers: testSigners
      });
    });

    it('should update envelope with signer removals', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      const removeSignerIds = ['signer-1', 'signer-2'];
      const updateData = {
        title: 'Updated Title',
        removeSignerIds
      };

      const input: UpdateEnvelopeUseCaseInput = {
        envelopeId,
        updateData,
        userId
      };

      const updatedEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue(), title: 'Updated Title' });
      const testSigners = [
        { getId: () => SignerId.fromString('signer-3') } as EnvelopeSigner
      ];

      mockSignatureEnvelopeService.updateEnvelope.mockResolvedValue(updatedEnvelope);
      mockEnvelopeSignerService.deleteSigner.mockResolvedValue(undefined);
      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue({
        ...updatedEnvelope,
        getSigners: jest.fn().mockReturnValue(testSigners)
      });

      const result = await useCase.execute(input);

      expect(mockEntityFactory.createValueObjects.signerId).toHaveBeenCalledWith('signer-1');
      expect(mockEntityFactory.createValueObjects.signerId).toHaveBeenCalledWith('signer-2');
      expect(mockEnvelopeSignerService.deleteSigner).toHaveBeenCalledTimes(2);
      expect(mockSignatureEnvelopeService.getEnvelopeWithSigners).toHaveBeenCalledWith(envelopeId);
      expect(result).toEqual({
        envelope: updatedEnvelope,
        signers: testSigners
      });
    });

    it('should update envelope with both signer additions and removals', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      const addSigners = [{ email: 'new@example.com', fullName: 'New Signer', isExternal: true }];
      const removeSignerIds = ['signer-1'];
      const updateData = {
        title: 'Updated Title',
        addSigners,
        removeSignerIds
      };

      const input: UpdateEnvelopeUseCaseInput = {
        envelopeId,
        updateData,
        userId
      };

      const updatedEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue(), title: 'Updated Title' });
      const mappedSigners = [{ envelopeId, signerId: 'new-signer', email: 'new@example.com', fullName: 'New Signer', userId }];
      const testSigners = [
        { getId: () => SignerId.fromString('new-signer') } as EnvelopeSigner
      ];

      mockSignatureEnvelopeService.updateEnvelope.mockResolvedValue(updatedEnvelope);
      mockMapAddSigners.mockReturnValue(mappedSigners);
      mockEnvelopeSignerService.createSignersForEnvelope.mockResolvedValue(undefined);
      mockEnvelopeSignerService.deleteSigner.mockResolvedValue(undefined);
      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue({
        ...updatedEnvelope,
        getSigners: jest.fn().mockReturnValue(testSigners)
      });

      const result = await useCase.execute(input);

      expect(mockMapAddSigners).toHaveBeenCalledWith(addSigners, envelopeId, userId);
      expect(mockEnvelopeSignerService.createSignersForEnvelope).toHaveBeenCalledWith(envelopeId, mappedSigners);
      expect(mockEntityFactory.createValueObjects.signerId).toHaveBeenCalledWith('signer-1');
      expect(mockEnvelopeSignerService.deleteSigner).toHaveBeenCalledTimes(1);
      expect(mockSignatureEnvelopeService.getEnvelopeWithSigners).toHaveBeenCalledWith(envelopeId);
      expect(result).toEqual({
        envelope: updatedEnvelope,
        signers: testSigners
      });
    });

    it('should throw error when S3 validation fails', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      const updateData = {
        title: 'Updated Title',
        sourceKey: 'invalid-s3-key'
      };

      const input: UpdateEnvelopeUseCaseInput = {
        envelopeId,
        updateData,
        userId
      };

      mockS3Service.assertExists.mockRejectedValue(new Error('S3 file not found'));

      await expect(useCase.execute(input)).rejects.toThrow('S3 file not found');
    });

    it('should throw error when envelope update fails', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      const updateData = {
        title: 'Updated Title'
      };

      const input: UpdateEnvelopeUseCaseInput = {
        envelopeId,
        updateData,
        userId
      };

      mockSignatureEnvelopeService.updateEnvelope.mockRejectedValue(new Error('Update failed'));

      await expect(useCase.execute(input)).rejects.toThrow('Update failed');
    });

    it('should throw error when signer creation fails', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      const addSigners = [{ email: 'signer@example.com', fullName: 'Signer', isExternal: true }];
      const updateData = {
        title: 'Updated Title',
        addSigners
      };

      const input: UpdateEnvelopeUseCaseInput = {
        envelopeId,
        updateData,
        userId
      };

      const updatedEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue(), title: 'Updated Title' });
      const mappedSigners = [{ envelopeId, signerId: 'signer-1', email: 'signer@example.com', fullName: 'Signer', userId }];

      mockSignatureEnvelopeService.updateEnvelope.mockResolvedValue(updatedEnvelope);
      mockMapAddSigners.mockReturnValue(mappedSigners);
      mockEnvelopeSignerService.createSignersForEnvelope.mockRejectedValue(new Error('Signer creation failed'));

      await expect(useCase.execute(input)).rejects.toThrow('Signer creation failed');
    });

    it('should throw error when signer deletion fails', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      const removeSignerIds = ['signer-1'];
      const updateData = {
        title: 'Updated Title',
        removeSignerIds
      };

      const input: UpdateEnvelopeUseCaseInput = {
        envelopeId,
        updateData,
        userId
      };

      const updatedEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue(), title: 'Updated Title' });

      mockSignatureEnvelopeService.updateEnvelope.mockResolvedValue(updatedEnvelope);
      mockEnvelopeSignerService.deleteSigner.mockRejectedValue(new Error('Signer deletion failed'));

      await expect(useCase.execute(input)).rejects.toThrow('Signer deletion failed');
    });

    it('should throw error when envelope not found after update', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      const addSigners = [{ email: 'signer@example.com', fullName: 'Signer', isExternal: true }];
      const updateData = {
        title: 'Updated Title',
        addSigners
      };

      const input: UpdateEnvelopeUseCaseInput = {
        envelopeId,
        updateData,
        userId
      };

      const updatedEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue(), title: 'Updated Title' });
      const mappedSigners = [{ envelopeId, signerId: 'signer-1', email: 'signer@example.com', fullName: 'Signer', userId }];

      mockSignatureEnvelopeService.updateEnvelope.mockResolvedValue(updatedEnvelope);
      mockMapAddSigners.mockReturnValue(mappedSigners);
      mockEnvelopeSignerService.createSignersForEnvelope.mockResolvedValue(undefined);
      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(null);

      await expect(useCase.execute(input)).rejects.toThrow('Envelope not found');
    });

    it('should handle empty signer arrays', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      const updateData = {
        title: 'Updated Title',
        addSigners: [],
        removeSignerIds: []
      };

      const input: UpdateEnvelopeUseCaseInput = {
        envelopeId,
        updateData,
        userId
      };

      const updatedEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue(), title: 'Updated Title' });

      mockSignatureEnvelopeService.updateEnvelope.mockResolvedValue(updatedEnvelope);

      const result = await useCase.execute(input);

      expect(mockMapAddSigners).not.toHaveBeenCalled();
      expect(mockEnvelopeSignerService.createSignersForEnvelope).not.toHaveBeenCalled();
      expect(mockEnvelopeSignerService.deleteSigner).not.toHaveBeenCalled();
      expect(mockSignatureEnvelopeService.getEnvelopeWithSigners).not.toHaveBeenCalled();
      expect(result).toEqual({ envelope: updatedEnvelope });
    });
  });
});
