import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { CreateEnvelopeUseCase } from '../../../../../src/services/orchestrators/use-cases/CreateEnvelopeUseCase';
import { CreateEnvelopeRequest } from '../../../../../src/domain/types/orchestrator/CreateEnvelopeRequest';
import { CreateEnvelopeData } from '../../../../../src/domain/types/envelope/CreateEnvelopeData';
import { EnvelopeId } from '../../../../../src/domain/value-objects/EnvelopeId';
import { DocumentOrigin } from '../../../../../src/domain/value-objects/DocumentOrigin';
import { SigningOrder } from '../../../../../src/domain/value-objects/SigningOrder';
import { TestUtils } from '../../../../helpers/testUtils';
import { signatureEnvelopeEntity } from '../../../../helpers/builders/signatureEnvelope';
import { createSignatureEnvelopeServiceMock } from '../../../../helpers/mocks/services';
import { createS3ServiceMock } from '../../../../helpers/mocks/services/S3Service.mock';

// Mock the uuid module
jest.mock('uuid', () => ({
  v4: jest.fn()
}));

// Mock EntityFactory
jest.mock('../../../../../src/infrastructure/factories/EntityFactory', () => ({
  EntityFactory: {
    createValueObjects: {
      envelopeId: jest.fn()
    }
  }
}));

describe('CreateEnvelopeUseCase', () => {
  let useCase: CreateEnvelopeUseCase;
  let mockSignatureEnvelopeService: any;
  let mockS3Service: any;
  let mockUuid: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSignatureEnvelopeService = createSignatureEnvelopeServiceMock();
    mockS3Service = createS3ServiceMock();
    mockS3Service.getDocumentContent.mockResolvedValue(Buffer.from('test document content'));
    
    // Get the mocked uuid function
    const { v4 } = require('uuid');
    mockUuid = v4;
    mockUuid.mockReturnValue('test-uuid-12345');
    
    // Get the mocked EntityFactory
    const { EntityFactory } = require('../../../../../src/infrastructure/factories/EntityFactory');
    EntityFactory.createValueObjects.envelopeId.mockReturnValue(EnvelopeId.fromString(TestUtils.generateUuid()));

    useCase = new CreateEnvelopeUseCase(
      mockSignatureEnvelopeService,
      mockSignatureEnvelopeService, // envelopeHashService
      mockS3Service, // s3Service
      mockSignatureEnvelopeService  // auditEventService
    );
  });

  describe('execute', () => {
    it('should create envelope successfully with generated ID', async () => {
      const userId = TestUtils.generateUuid();
      const envelopeData: CreateEnvelopeData = {
        id: EnvelopeId.generate(), // This will be overridden
        createdBy: userId,
        title: 'Test Document',
        description: 'Test document description',
        origin: DocumentOrigin.fromString('USER_UPLOAD'),
        signingOrder: SigningOrder.fromString('OWNER_FIRST'),
        sourceKey: 'test/source/document.pdf',
        metaKey: 'test/meta/document.pdf'
      };

      const request: CreateEnvelopeRequest = {
        envelopeData,
        userId,
        securityContext: {}
      };

      const testEnvelopeId = EnvelopeId.fromString(TestUtils.generateUuid());
      const testEnvelope = signatureEnvelopeEntity();

      const { EntityFactory } = require('../../../../../src/infrastructure/factories/EntityFactory');
      EntityFactory.createValueObjects.envelopeId.mockReturnValue(testEnvelopeId);
      mockSignatureEnvelopeService.createEnvelope.mockResolvedValue(testEnvelope);

      const result = await useCase.execute(request);

      expect(mockUuid).toHaveBeenCalledTimes(1);
      expect(EntityFactory.createValueObjects.envelopeId).toHaveBeenCalledWith('test-uuid-12345');
      expect(mockSignatureEnvelopeService.createEnvelope).toHaveBeenCalledWith(
        expect.objectContaining({
          id: testEnvelopeId,
          createdBy: userId,
          title: 'Test Document',
          description: 'Test document description'
        })
      );
      expect(result).toEqual({
        envelope: testEnvelope,
        signers: []
      });
    });

    it('should inject envelopeId into envelope data', async () => {
      const userId = TestUtils.generateUuid();
      const envelopeData: CreateEnvelopeData = {
        id: EnvelopeId.generate(),
        createdBy: userId,
        title: 'Test Document',
        origin: DocumentOrigin.fromString('USER_UPLOAD'),
        signingOrder: SigningOrder.fromString('OWNER_FIRST'),
        sourceKey: 'test/source/document.pdf',
        metaKey: 'test/meta/document.pdf'
      };

      const request: CreateEnvelopeRequest = {
        envelopeData,
        userId,
        securityContext: {}
      };

      const testEnvelopeId = EnvelopeId.fromString(TestUtils.generateUuid());
      const testEnvelope = signatureEnvelopeEntity();

      const { EntityFactory } = require('../../../../../src/infrastructure/factories/EntityFactory');
      EntityFactory.createValueObjects.envelopeId.mockReturnValue(testEnvelopeId);
      mockSignatureEnvelopeService.createEnvelope.mockResolvedValue(testEnvelope);

      await useCase.execute(request);

      const serviceCall = mockSignatureEnvelopeService.createEnvelope.mock.calls[0];
      const envelopeDataWithId = serviceCall[0];
      
      expect(envelopeDataWithId.id).toBe(testEnvelopeId);
      expect(envelopeDataWithId.createdBy).toBe(userId);
      expect(envelopeDataWithId.title).toBe('Test Document');
    });

    it('should return envelope with empty signers array', async () => {
      const userId = TestUtils.generateUuid();
      const envelopeData: CreateEnvelopeData = {
        id: EnvelopeId.generate(),
        createdBy: userId,
        title: 'Empty Signers Test',
        origin: DocumentOrigin.fromString('USER_UPLOAD'),
        signingOrder: SigningOrder.fromString('OWNER_FIRST'),
        sourceKey: 'test/source.pdf',
        metaKey: 'test/meta.pdf'
      };

      const request: CreateEnvelopeRequest = {
        envelopeData,
        userId,
        securityContext: {}
      };

      const testEnvelope = signatureEnvelopeEntity();
      const { EntityFactory } = require('../../../../../src/infrastructure/factories/EntityFactory');
      EntityFactory.createValueObjects.envelopeId.mockReturnValue(EnvelopeId.generate());
      mockSignatureEnvelopeService.createEnvelope.mockResolvedValue(testEnvelope);

      const result = await useCase.execute(request);

      expect(result.envelope).toBe(testEnvelope);
      expect(result.signers).toEqual([]);
      expect(Array.isArray(result.signers)).toBe(true);
      expect(result.signers.length).toBe(0);
    });

    it('should handle service errors and rethrow', async () => {
      const userId = TestUtils.generateUuid();
      const envelopeData: CreateEnvelopeData = {
        id: EnvelopeId.generate(),
        createdBy: userId,
        title: 'Error Test Document',
        origin: DocumentOrigin.fromString('USER_UPLOAD'),
        signingOrder: SigningOrder.fromString('OWNER_FIRST'),
        sourceKey: 'test/source.pdf',
        metaKey: 'test/meta.pdf'
      };

      const request: CreateEnvelopeRequest = {
        envelopeData,
        userId,
        securityContext: {}
      };

      const serviceError = new Error('Service creation failed');
      const { EntityFactory } = require('../../../../../src/infrastructure/factories/EntityFactory');
      EntityFactory.createValueObjects.envelopeId.mockReturnValue(EnvelopeId.generate());
      mockSignatureEnvelopeService.createEnvelope.mockRejectedValue(serviceError);

      await expect(useCase.execute(request)).rejects.toThrow('Service creation failed');
    });
  });
});
