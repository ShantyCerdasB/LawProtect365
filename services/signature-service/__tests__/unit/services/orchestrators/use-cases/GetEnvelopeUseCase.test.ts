import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { GetEnvelopeUseCase } from '../../../../../src/services/orchestrators/use-cases/GetEnvelopeUseCase';
import { GetEnvelopeInput } from '../../../../../src/domain/types/usecase/orchestrator/GetEnvelopeUseCase';
import { AccessType } from '../../../../../src/domain/enums/AccessType';
import { TestUtils } from '../../../../helpers/testUtils';
import { signatureEnvelopeEntity } from '../../../../helpers/builders/signatureEnvelope';
import { createSignatureEnvelopeServiceMock } from '../../../../helpers/mocks/services/SignatureEnvelopeService.mock';
import { createInvitationTokenServiceMock } from '../../../../helpers/mocks/services/InvitationTokenService.mock';
import { createEnvelopeAccessServiceMock } from '../../../../helpers/mocks/services/EnvelopeAccessService.mock';

describe('GetEnvelopeUseCase', () => {
  let useCase: GetEnvelopeUseCase;
  let mockSignatureEnvelopeService: any;
  let mockInvitationTokenService: any;
  let mockEnvelopeAccessService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSignatureEnvelopeService = createSignatureEnvelopeServiceMock();
    mockInvitationTokenService = createInvitationTokenServiceMock();
    mockEnvelopeAccessService = createEnvelopeAccessServiceMock();

    useCase = new GetEnvelopeUseCase(
      mockSignatureEnvelopeService,
      mockInvitationTokenService,
      mockEnvelopeAccessService
    );
  });

  describe('execute', () => {
    it('should retrieve envelope successfully with owner access', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      
      const input: GetEnvelopeInput = {
        envelopeId,
        userId
      };

      const testEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue() });
      const testSigners = [
        { getId: () => TestUtils.generateSignerId() } as any,
        { getId: () => TestUtils.generateSignerId() } as any
      ];
      const envelopeWithSigners = signatureEnvelopeEntity({ id: envelopeId.getValue() });
      envelopeWithSigners.getSigners = jest.fn().mockReturnValue(testSigners) as any;

      mockEnvelopeAccessService.validateUserAccess.mockResolvedValue(testEnvelope);
      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(envelopeWithSigners);

      const result = await useCase.execute(input);

      expect(mockEnvelopeAccessService.validateUserAccess).toHaveBeenCalledWith(
        envelopeId,
        userId,
        undefined
      );
      expect(mockSignatureEnvelopeService.getEnvelopeWithSigners).toHaveBeenCalledWith(
        envelopeId,
        undefined,
        undefined
      );
      expect(mockInvitationTokenService.markTokenAsViewed).not.toHaveBeenCalled();
      expect(result.envelope).toBe(testEnvelope);
      expect(result.signers).toBe(testSigners);
      expect(result.accessType).toBe(AccessType.OWNER);
    });

    it('should retrieve envelope successfully with external access via invitation token', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const invitationToken = TestUtils.generateUuid();
      const securityContext = {
        ipAddress: TestUtils.createTestIpAddress(),
        userAgent: TestUtils.createTestUserAgent(),
        country: 'US'
      };
      
      const input: GetEnvelopeInput = {
        envelopeId,
        invitationToken,
        securityContext
      };

      const testEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue() });
      const testSigners = [
        { getId: () => TestUtils.generateSignerId() } as any
      ];
      const envelopeWithSigners = signatureEnvelopeEntity({ id: envelopeId.getValue() });
      envelopeWithSigners.getSigners = jest.fn().mockReturnValue(testSigners) as any;

      mockEnvelopeAccessService.validateUserAccess.mockResolvedValue(testEnvelope);
      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(envelopeWithSigners);
      mockInvitationTokenService.markTokenAsViewed.mockResolvedValue(undefined);

      const result = await useCase.execute(input);

      expect(mockEnvelopeAccessService.validateUserAccess).toHaveBeenCalledWith(
        envelopeId,
        undefined,
        invitationToken
      );
      expect(mockSignatureEnvelopeService.getEnvelopeWithSigners).toHaveBeenCalledWith(
        envelopeId,
        {
          ipAddress: securityContext.ipAddress,
          userAgent: securityContext.userAgent,
          country: securityContext.country
        },
        invitationToken
      );
      expect(mockInvitationTokenService.markTokenAsViewed).toHaveBeenCalledWith(
        invitationToken,
        {
          ipAddress: securityContext.ipAddress,
          userAgent: securityContext.userAgent,
          country: securityContext.country
        }
      );
      expect(result.envelope).toBe(testEnvelope);
      expect(result.signers).toBe(testSigners);
      expect(result.accessType).toBe(AccessType.EXTERNAL);
    });

    it('should handle invitation token marking failure gracefully (best-effort)', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const invitationToken = TestUtils.generateUuid();
      const securityContext = {
        ipAddress: TestUtils.createTestIpAddress(),
        userAgent: TestUtils.createTestUserAgent(),
        country: 'US'
      };
      
      const input: GetEnvelopeInput = {
        envelopeId,
        invitationToken,
        securityContext
      };

      const testEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue() });
      const testSigners: any[] = [];
      const envelopeWithSigners = signatureEnvelopeEntity({ id: envelopeId.getValue() });
      envelopeWithSigners.getSigners = jest.fn().mockReturnValue(testSigners) as any;

      mockEnvelopeAccessService.validateUserAccess.mockResolvedValue(testEnvelope);
      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(envelopeWithSigners);
      mockInvitationTokenService.markTokenAsViewed.mockRejectedValue(new Error('Token marking failed'));

      const result = await useCase.execute(input);

      expect(mockInvitationTokenService.markTokenAsViewed).toHaveBeenCalled();
      expect(result.envelope).toBe(testEnvelope);
      expect(result.signers).toBe(testSigners);
      expect(result.accessType).toBe(AccessType.EXTERNAL);
    });

    it('should handle missing security context with invitation token', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const invitationToken = TestUtils.generateUuid();
      
      const input: GetEnvelopeInput = {
        envelopeId,
        invitationToken
      };

      const testEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue() });
      const testSigners: any[] = [];
      const envelopeWithSigners = signatureEnvelopeEntity({ id: envelopeId.getValue() });
      envelopeWithSigners.getSigners = jest.fn().mockReturnValue(testSigners) as any;

      mockEnvelopeAccessService.validateUserAccess.mockResolvedValue(testEnvelope);
      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(envelopeWithSigners);

      const result = await useCase.execute(input);

      expect(mockInvitationTokenService.markTokenAsViewed).not.toHaveBeenCalled();
      expect(mockSignatureEnvelopeService.getEnvelopeWithSigners).toHaveBeenCalledWith(
        envelopeId,
        undefined,
        invitationToken
      );
      expect(result.accessType).toBe(AccessType.EXTERNAL);
    });

    it('should handle security context with missing optional fields', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const invitationToken = TestUtils.generateUuid();
      const securityContext = {
        ipAddress: undefined,
        userAgent: undefined,
        country: 'US'
      };
      
      const input: GetEnvelopeInput = {
        envelopeId,
        invitationToken,
        securityContext
      };

      const testEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue() });
      const testSigners: any[] = [];
      const envelopeWithSigners = signatureEnvelopeEntity({ id: envelopeId.getValue() });
      envelopeWithSigners.getSigners = jest.fn().mockReturnValue(testSigners) as any;

      mockEnvelopeAccessService.validateUserAccess.mockResolvedValue(testEnvelope);
      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(envelopeWithSigners);
      mockInvitationTokenService.markTokenAsViewed.mockResolvedValue(undefined);

      const result = await useCase.execute(input);

      expect(mockSignatureEnvelopeService.getEnvelopeWithSigners).toHaveBeenCalledWith(
        envelopeId,
        {
          ipAddress: '',
          userAgent: '',
          country: 'US'
        },
        invitationToken
      );
      expect(mockInvitationTokenService.markTokenAsViewed).toHaveBeenCalledWith(
        invitationToken,
        {
          ipAddress: undefined,
          userAgent: undefined,
          country: 'US'
        }
      );
      expect(result.accessType).toBe(AccessType.EXTERNAL);
    });

    it('should handle envelope with no signers', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      
      const input: GetEnvelopeInput = {
        envelopeId,
        userId
      };

      const testEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue() });
      const envelopeWithSigners = signatureEnvelopeEntity({ id: envelopeId.getValue() });
      envelopeWithSigners.getSigners = jest.fn().mockReturnValue([]) as any;

      mockEnvelopeAccessService.validateUserAccess.mockResolvedValue(testEnvelope);
      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(envelopeWithSigners);

      const result = await useCase.execute(input);

      expect(result.signers).toEqual([]);
      expect(result.accessType).toBe(AccessType.OWNER);
    });

    it('should handle null envelope with signers', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      
      const input: GetEnvelopeInput = {
        envelopeId,
        userId
      };

      const testEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue() });

      mockEnvelopeAccessService.validateUserAccess.mockResolvedValue(testEnvelope);
      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(null);

      const result = await useCase.execute(input);

      expect(result.signers).toEqual([]);
      expect(result.accessType).toBe(AccessType.OWNER);
    });

    it('should throw error when access validation fails', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      
      const input: GetEnvelopeInput = {
        envelopeId,
        userId
      };

      const accessError = new Error('Access denied');
      mockEnvelopeAccessService.validateUserAccess.mockRejectedValue(accessError);

      await expect(useCase.execute(input)).rejects.toThrow('Access denied');
    });

    it('should throw error when envelope retrieval fails', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      
      const input: GetEnvelopeInput = {
        envelopeId,
        userId
      };

      const testEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue() });

      mockEnvelopeAccessService.validateUserAccess.mockResolvedValue(testEnvelope);
      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockRejectedValue(new Error('Envelope retrieval failed'));

      await expect(useCase.execute(input)).rejects.toThrow('Envelope retrieval failed');
    });

    it('should handle mixed access scenarios', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      const invitationToken = TestUtils.generateUuid();
      
      const input: GetEnvelopeInput = {
        envelopeId,
        userId,
        invitationToken
      };

      const testEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue() });
      const testSigners: any[] = [];
      const envelopeWithSigners = signatureEnvelopeEntity({ id: envelopeId.getValue() });
      envelopeWithSigners.getSigners = jest.fn().mockReturnValue(testSigners) as any;

      mockEnvelopeAccessService.validateUserAccess.mockResolvedValue(testEnvelope);
      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(envelopeWithSigners);

      const result = await useCase.execute(input);

      expect(mockEnvelopeAccessService.validateUserAccess).toHaveBeenCalledWith(
        envelopeId,
        userId,
        invitationToken
      );
      expect(result.accessType).toBe(AccessType.EXTERNAL);
    });
  });
});
