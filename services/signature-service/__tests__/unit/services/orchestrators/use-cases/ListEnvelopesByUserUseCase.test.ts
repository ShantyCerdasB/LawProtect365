import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { ListEnvelopesByUserUseCase } from '../../../../../src/services/orchestrators/use-cases/ListEnvelopesByUserUseCase';
import { ListEnvelopesByUserInput } from '../../../../../src/domain/types/usecase/orchestrator/ListEnvelopesByUserUseCase';
import { EnvelopeStatus } from '../../../../../src/domain/value-objects/EnvelopeStatus';
import { TestUtils } from '../../../../helpers/testUtils';
import { signatureEnvelopeEntity } from '../../../../helpers/builders/signatureEnvelope';
import { createSignatureEnvelopeServiceMock } from '../../../../helpers/mocks/services/SignatureEnvelopeService.mock';

describe('ListEnvelopesByUserUseCase', () => {
  let useCase: ListEnvelopesByUserUseCase;
  let mockSignatureEnvelopeService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSignatureEnvelopeService = createSignatureEnvelopeServiceMock();

    useCase = new ListEnvelopesByUserUseCase(mockSignatureEnvelopeService);
  });

  describe('execute', () => {
    it('should list envelopes successfully with all parameters', async () => {
      const userId = TestUtils.generateUuid();
      const status = EnvelopeStatus.fromString('DRAFT');
      const limit = 10;
      const cursor = 'cursor-123';
      
      const input: ListEnvelopesByUserInput = {
        userId,
        filters: { status, limit, cursor }
      };

      const envelope1 = signatureEnvelopeEntity({ id: TestUtils.generateUuid() });
      const envelope2 = signatureEnvelopeEntity({ id: TestUtils.generateUuid() });
      const signers1 = [{ getId: () => TestUtils.generateSignerId() } as any];
      const signers2 = [{ getId: () => TestUtils.generateSignerId() } as any];

      const listResult = {
        items: [envelope1, envelope2],
        nextCursor: 'next-cursor-456'
      };

      const envelopeWithSigners1 = signatureEnvelopeEntity({ id: envelope1.getId().getValue() });
      envelopeWithSigners1.getSigners = jest.fn().mockReturnValue(signers1) as any;
      const envelopeWithSigners2 = signatureEnvelopeEntity({ id: envelope2.getId().getValue() });
      envelopeWithSigners2.getSigners = jest.fn().mockReturnValue(signers2) as any;

      mockSignatureEnvelopeService.listEnvelopes.mockResolvedValue(listResult);
      mockSignatureEnvelopeService.getEnvelopeWithSigners
        .mockResolvedValueOnce(envelopeWithSigners1)
        .mockResolvedValueOnce(envelopeWithSigners2);

      const result = await useCase.execute(input);

      expect(mockSignatureEnvelopeService.listEnvelopes).toHaveBeenCalledWith(
        { createdBy: userId, status },
        limit,
        cursor
      );
      expect(mockSignatureEnvelopeService.getEnvelopeWithSigners).toHaveBeenCalledTimes(2);
      expect(result.envelopes).toEqual([envelope1, envelope2]);
      expect(result.signers).toEqual([signers1, signers2]);
      expect(result.nextCursor).toBe('next-cursor-456');
    });

    it('should list envelopes with minimal parameters', async () => {
      const userId = TestUtils.generateUuid();
      const limit = 5;
      
      const input: ListEnvelopesByUserInput = {
        userId,
        filters: { limit }
      };

      const envelope1 = signatureEnvelopeEntity({ id: TestUtils.generateUuid() });
      const signers1: any[] = [];

      const listResult = {
        items: [envelope1],
        nextCursor: undefined
      };

      const envelopeWithSigners1 = signatureEnvelopeEntity({ id: envelope1.getId().getValue() });
      envelopeWithSigners1.getSigners = jest.fn().mockReturnValue(signers1) as any;

      mockSignatureEnvelopeService.listEnvelopes.mockResolvedValue(listResult);
      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(envelopeWithSigners1);

      const result = await useCase.execute(input);

      expect(mockSignatureEnvelopeService.listEnvelopes).toHaveBeenCalledWith(
        { createdBy: userId, status: undefined },
        limit,
        undefined
      );
      expect(result.envelopes).toEqual([envelope1]);
      expect(result.signers).toEqual([signers1]);
      expect(result.nextCursor).toBeUndefined();
    });

    it('should handle empty envelope list', async () => {
      const userId = TestUtils.generateUuid();
      const limit = 10;
      
      const input: ListEnvelopesByUserInput = {
        userId,
        filters: { limit }
      };

      const listResult = {
        items: [],
        nextCursor: undefined
      };

      mockSignatureEnvelopeService.listEnvelopes.mockResolvedValue(listResult);

      const result = await useCase.execute(input);

      expect(mockSignatureEnvelopeService.getEnvelopeWithSigners).not.toHaveBeenCalled();
      expect(result.envelopes).toEqual([]);
      expect(result.signers).toEqual([]);
      expect(result.nextCursor).toBeUndefined();
    });

    it('should handle null envelope with signers', async () => {
      const userId = TestUtils.generateUuid();
      const limit = 10;
      
      const input: ListEnvelopesByUserInput = {
        userId,
        filters: { limit }
      };

      const envelope1 = signatureEnvelopeEntity({ id: TestUtils.generateUuid() });

      const listResult = {
        items: [envelope1],
        nextCursor: undefined
      };

      mockSignatureEnvelopeService.listEnvelopes.mockResolvedValue(listResult);
      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(null);

      const result = await useCase.execute(input);

      expect(result.envelopes).toEqual([envelope1]);
      expect(result.signers).toEqual([[]]);
    });

    it('should throw error when limit is not provided', async () => {
      const userId = TestUtils.generateUuid();
      
      const input: ListEnvelopesByUserInput = {
        userId,
        filters: {}
      };

      await expect(useCase.execute(input)).rejects.toThrow('Pagination limit is required');
    });

    it('should throw error when limit is null', async () => {
      const userId = TestUtils.generateUuid();
      
      const input: ListEnvelopesByUserInput = {
        userId,
        filters: { limit: null as any }
      };

      await expect(useCase.execute(input)).rejects.toThrow('Pagination limit is required');
    });

    it('should throw error when limit is undefined', async () => {
      const userId = TestUtils.generateUuid();
      
      const input: ListEnvelopesByUserInput = {
        userId,
        filters: { limit: undefined }
      };

      await expect(useCase.execute(input)).rejects.toThrow('Pagination limit is required');
    });

    it('should throw error when listEnvelopes fails', async () => {
      const userId = TestUtils.generateUuid();
      const limit = 10;
      
      const input: ListEnvelopesByUserInput = {
        userId,
        filters: { limit }
      };

      const listError = new Error('List envelopes failed');
      mockSignatureEnvelopeService.listEnvelopes.mockRejectedValue(listError);

      await expect(useCase.execute(input)).rejects.toThrow('List envelopes failed');
    });

    it('should throw error when getEnvelopeWithSigners fails', async () => {
      const userId = TestUtils.generateUuid();
      const limit = 10;
      
      const input: ListEnvelopesByUserInput = {
        userId,
        filters: { limit }
      };

      const envelope1 = signatureEnvelopeEntity({ id: TestUtils.generateUuid() });

      const listResult = {
        items: [envelope1],
        nextCursor: undefined
      };

      mockSignatureEnvelopeService.listEnvelopes.mockResolvedValue(listResult);
      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockRejectedValue(new Error('Get envelope failed'));

      await expect(useCase.execute(input)).rejects.toThrow('Get envelope failed');
    });

    it('should handle different status filters', async () => {
      const userId = TestUtils.generateUuid();
      const status = EnvelopeStatus.fromString('DRAFT');
      const limit = 5;
      
      const input: ListEnvelopesByUserInput = {
        userId,
        filters: { status, limit }
      };

      const envelope1 = signatureEnvelopeEntity({ id: TestUtils.generateUuid() });
      const signers1: any[] = [];

      const listResult = {
        items: [envelope1],
        nextCursor: undefined
      };

      const envelopeWithSigners1 = signatureEnvelopeEntity({ id: envelope1.getId().getValue() });
      envelopeWithSigners1.getSigners = jest.fn().mockReturnValue(signers1) as any;

      mockSignatureEnvelopeService.listEnvelopes.mockResolvedValue(listResult);
      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(envelopeWithSigners1);

      const result = await useCase.execute(input);

      expect(mockSignatureEnvelopeService.listEnvelopes).toHaveBeenCalledWith(
        { createdBy: userId, status },
        limit,
        undefined
      );
      expect(result.envelopes).toEqual([envelope1]);
    });

    it('should handle multiple envelopes with different signer counts', async () => {
      const userId = TestUtils.generateUuid();
      const limit = 3;
      
      const input: ListEnvelopesByUserInput = {
        userId,
        filters: { limit }
      };

      const envelope1 = signatureEnvelopeEntity({ id: TestUtils.generateUuid() });
      const envelope2 = signatureEnvelopeEntity({ id: TestUtils.generateUuid() });
      const envelope3 = signatureEnvelopeEntity({ id: TestUtils.generateUuid() });

      const signers1 = [{ getId: () => TestUtils.generateSignerId() } as any];
      const signers2 = [
        { getId: () => TestUtils.generateSignerId() } as any,
        { getId: () => TestUtils.generateSignerId() } as any
      ];
      const signers3: any[] = [];

      const listResult = {
        items: [envelope1, envelope2, envelope3],
        nextCursor: 'next-cursor-789'
      };

      const envelopeWithSigners1 = signatureEnvelopeEntity({ id: envelope1.getId().getValue() });
      envelopeWithSigners1.getSigners = jest.fn().mockReturnValue(signers1) as any;
      const envelopeWithSigners2 = signatureEnvelopeEntity({ id: envelope2.getId().getValue() });
      envelopeWithSigners2.getSigners = jest.fn().mockReturnValue(signers2) as any;
      const envelopeWithSigners3 = signatureEnvelopeEntity({ id: envelope3.getId().getValue() });
      envelopeWithSigners3.getSigners = jest.fn().mockReturnValue(signers3) as any;

      mockSignatureEnvelopeService.listEnvelopes.mockResolvedValue(listResult);
      mockSignatureEnvelopeService.getEnvelopeWithSigners
        .mockResolvedValueOnce(envelopeWithSigners1)
        .mockResolvedValueOnce(envelopeWithSigners2)
        .mockResolvedValueOnce(envelopeWithSigners3);

      const result = await useCase.execute(input);

      expect(result.envelopes).toEqual([envelope1, envelope2, envelope3]);
      expect(result.signers).toEqual([signers1, signers2, signers3]);
      expect(result.nextCursor).toBe('next-cursor-789');
    });
  });
});
