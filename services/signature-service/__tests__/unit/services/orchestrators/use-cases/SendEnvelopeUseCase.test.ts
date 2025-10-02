import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { SendEnvelopeUseCase } from '../../../../../src/services/orchestrators/use-cases/SendEnvelopeUseCase';
import { SendEnvelopeInput } from '../../../../../src/domain/types/usecase/orchestrator/SendEnvelopeUseCase';
import { TestUtils } from '../../../../helpers/testUtils';
import { signatureEnvelopeEntity } from '../../../../helpers/builders/signatureEnvelope';
import { createSignatureEnvelopeServiceMock } from '../../../../helpers/mocks/services/SignatureEnvelopeService.mock';
import { createInvitationTokenServiceMock } from '../../../../helpers/mocks/services/InvitationTokenService.mock';
import { createAuditEventServiceMock } from '../../../../helpers/mocks/services/AuditEventService.mock';
import { createEnvelopeNotificationServiceMock } from '../../../../helpers/mocks/services/EnvelopeNotificationService.mock';

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
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      const securityContext = {
        ipAddress: TestUtils.createTestIpAddress(),
        userAgent: TestUtils.createTestUserAgent(),
        country: 'US'
      };
      
      const input: SendEnvelopeInput = {
        envelopeId,
        userId,
        securityContext,
        options: {
          message: 'Please sign this document',
          sendToAll: true
        }
      };

      const testEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue() });
      const externalSigners = [
        { getId: () => TestUtils.generateSignerId() } as any,
        { getId: () => TestUtils.generateSignerId() } as any
      ];
      const targetSigners = [
        { getId: () => TestUtils.generateSignerId() } as any,
        { getId: () => TestUtils.generateSignerId() } as any
      ];

      const tokenResults = [
        {
          signerId: TestUtils.generateUuid(),
          email: 'signer1@example.com',
          token: 'token-123',
          expiresAt: new Date('2023-12-31T23:59:59Z')
        },
        {
          signerId: TestUtils.generateUuid(),
          email: 'signer2@example.com',
          token: 'token-456',
          expiresAt: new Date('2023-12-31T23:59:59Z')
        }
      ];

      testEnvelope.getExternalSigners = jest.fn().mockReturnValue(externalSigners) as any;
      testEnvelope.getStatus = jest.fn().mockReturnValue({ getValue: () => 'SENT' }) as any;

      const { selectTargetSigners } = require('../../../../../src/services/orchestrators/utils/signerSelection');
      selectTargetSigners.mockReturnValue(targetSigners);

      mockSignatureEnvelopeService.sendEnvelope.mockResolvedValue(testEnvelope);
      mockInvitationTokenService.generateInvitationTokensForSigners.mockResolvedValue(tokenResults);
      mockEnvelopeNotificationService.sendSignerInvitations.mockResolvedValue(undefined);
      mockAuditEventService.create.mockResolvedValue(undefined);

      const result = await useCase.execute(input);

      expect(mockSignatureEnvelopeService.sendEnvelope).toHaveBeenCalledWith(envelopeId, userId);
      expect(selectTargetSigners).toHaveBeenCalledWith(externalSigners, input.options);
      expect(mockInvitationTokenService.generateInvitationTokensForSigners).toHaveBeenCalledWith(
        targetSigners,
        envelopeId,
        {
          userId,
          ipAddress: securityContext.ipAddress,
          userAgent: securityContext.userAgent,
          country: securityContext.country
        }
      );
      expect(mockEnvelopeNotificationService.sendSignerInvitations).toHaveBeenCalledWith(
        testEnvelope,
        targetSigners,
        new Map([
          [tokenResults[0].signerId, tokenResults[0].token],
          [tokenResults[1].signerId, tokenResults[1].token]
        ]),
        'Please sign this document'
      );
      expect(mockAuditEventService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          envelopeId: envelopeId.getValue(),
          signerId: undefined,
          eventType: 'ENVELOPE_SENT',
          description: 'Envelope sent to 2 external signers',
          userId,
          userEmail: undefined,
          metadata: {
            envelopeId: envelopeId.getValue(),
            externalSignersCount: 2,
            tokensGenerated: 2,
            sendToAll: true
          }
        })
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe('Envelope sent successfully');
      expect(result.envelopeId).toBe(envelopeId.getValue());
      expect(result.status).toBe('SENT');
      expect(result.tokensGenerated).toBe(2);
      expect(result.signersNotified).toBe(2);
      expect(result.tokens).toEqual([
        {
          signerId: tokenResults[0].signerId,
          email: tokenResults[0].email,
          token: tokenResults[0].token,
          expiresAt: tokenResults[0].expiresAt
        },
        {
          signerId: tokenResults[1].signerId,
          email: tokenResults[1].email,
          token: tokenResults[1].token,
          expiresAt: tokenResults[1].expiresAt
        }
      ]);
    });

    it('should send envelope with minimal options', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      const securityContext = {
        ipAddress: TestUtils.createTestIpAddress(),
        userAgent: TestUtils.createTestUserAgent(),
        country: 'US'
      };
      
      const input: SendEnvelopeInput = {
        envelopeId,
        userId,
        securityContext
      };

      const testEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue() });
      const externalSigners = [{ getId: () => TestUtils.generateSignerId() } as any];
      const targetSigners = [{ getId: () => TestUtils.generateSignerId() } as any];

      const tokenResults = [
        {
          signerId: TestUtils.generateUuid(),
          email: 'signer@example.com',
          token: 'token-789',
          expiresAt: new Date('2023-12-31T23:59:59Z')
        }
      ];

      testEnvelope.getExternalSigners = jest.fn().mockReturnValue(externalSigners) as any;
      testEnvelope.getStatus = jest.fn().mockReturnValue({ getValue: () => 'SENT' }) as any;

      const { selectTargetSigners } = require('../../../../../src/services/orchestrators/utils/signerSelection');
      selectTargetSigners.mockReturnValue(targetSigners);

      mockSignatureEnvelopeService.sendEnvelope.mockResolvedValue(testEnvelope);
      mockInvitationTokenService.generateInvitationTokensForSigners.mockResolvedValue(tokenResults);
      mockEnvelopeNotificationService.sendSignerInvitations.mockResolvedValue(undefined);
      mockAuditEventService.create.mockResolvedValue(undefined);

      const result = await useCase.execute(input);

      expect(mockEnvelopeNotificationService.sendSignerInvitations).toHaveBeenCalledWith(
        testEnvelope,
        targetSigners,
        new Map([[tokenResults[0].signerId, tokenResults[0].token]]),
        undefined
      );
      expect(mockAuditEventService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            sendToAll: false
          })
        })
      );

      expect(result.success).toBe(true);
      expect(result.tokensGenerated).toBe(1);
      expect(result.signersNotified).toBe(1);
    });

    it('should handle empty external signers', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      const securityContext = {
        ipAddress: TestUtils.createTestIpAddress(),
        userAgent: TestUtils.createTestUserAgent(),
        country: 'US'
      };
      
      const input: SendEnvelopeInput = {
        envelopeId,
        userId,
        securityContext
      };

      const testEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue() });
      const externalSigners: any[] = [];
      const targetSigners: any[] = [];

      testEnvelope.getExternalSigners = jest.fn().mockReturnValue(externalSigners) as any;
      testEnvelope.getStatus = jest.fn().mockReturnValue({ getValue: () => 'SENT' }) as any;

      const { selectTargetSigners } = require('../../../../../src/services/orchestrators/utils/signerSelection');
      selectTargetSigners.mockReturnValue(targetSigners);

      mockSignatureEnvelopeService.sendEnvelope.mockResolvedValue(testEnvelope);
      mockInvitationTokenService.generateInvitationTokensForSigners.mockResolvedValue([]);
      mockEnvelopeNotificationService.sendSignerInvitations.mockResolvedValue(undefined);
      mockAuditEventService.create.mockResolvedValue(undefined);

      const result = await useCase.execute(input);

      expect(result.tokensGenerated).toBe(0);
      expect(result.signersNotified).toBe(0);
      expect(result.tokens).toEqual([]);
    });

    it('should handle security context with missing optional fields', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      const securityContext = {
        ipAddress: undefined,
        userAgent: undefined,
        country: 'US'
      };
      
      const input: SendEnvelopeInput = {
        envelopeId,
        userId,
        securityContext
      };

      const testEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue() });
      const externalSigners = [{ getId: () => TestUtils.generateSignerId() } as any];
      const targetSigners = [{ getId: () => TestUtils.generateSignerId() } as any];

      testEnvelope.getExternalSigners = jest.fn().mockReturnValue(externalSigners) as any;
      testEnvelope.getStatus = jest.fn().mockReturnValue({ getValue: () => 'SENT' }) as any;

      const { selectTargetSigners } = require('../../../../../src/services/orchestrators/utils/signerSelection');
      selectTargetSigners.mockReturnValue(targetSigners);

      mockSignatureEnvelopeService.sendEnvelope.mockResolvedValue(testEnvelope);
      mockInvitationTokenService.generateInvitationTokensForSigners.mockResolvedValue([]);
      mockEnvelopeNotificationService.sendSignerInvitations.mockResolvedValue(undefined);
      mockAuditEventService.create.mockResolvedValue(undefined);

      const result = await useCase.execute(input);

      expect(mockInvitationTokenService.generateInvitationTokensForSigners).toHaveBeenCalledWith(
        targetSigners,
        envelopeId,
        {
          userId,
          ipAddress: '',
          userAgent: '',
          country: 'US'
        }
      );

      expect(result.success).toBe(true);
    });

    it('should throw error when sendEnvelope fails', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      const securityContext = {
        ipAddress: TestUtils.createTestIpAddress(),
        userAgent: TestUtils.createTestUserAgent(),
        country: 'US'
      };
      
      const input: SendEnvelopeInput = {
        envelopeId,
        userId,
        securityContext
      };

      const sendError = new Error('Send envelope failed');
      mockSignatureEnvelopeService.sendEnvelope.mockRejectedValue(sendError);

      await expect(useCase.execute(input)).rejects.toThrow('Send envelope failed');
    });

    it('should throw error when token generation fails', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      const securityContext = {
        ipAddress: TestUtils.createTestIpAddress(),
        userAgent: TestUtils.createTestUserAgent(),
        country: 'US'
      };
      
      const input: SendEnvelopeInput = {
        envelopeId,
        userId,
        securityContext
      };

      const testEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue() });
      const externalSigners = [{ getId: () => TestUtils.generateSignerId() } as any];
      const targetSigners = [{ getId: () => TestUtils.generateSignerId() } as any];

      testEnvelope.getExternalSigners = jest.fn().mockReturnValue(externalSigners) as any;

      const { selectTargetSigners } = require('../../../../../src/services/orchestrators/utils/signerSelection');
      selectTargetSigners.mockReturnValue(targetSigners);

      mockSignatureEnvelopeService.sendEnvelope.mockResolvedValue(testEnvelope);
      mockInvitationTokenService.generateInvitationTokensForSigners.mockRejectedValue(new Error('Token generation failed'));

      await expect(useCase.execute(input)).rejects.toThrow('Token generation failed');
    });

    it('should throw error when notification sending fails', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      const securityContext = {
        ipAddress: TestUtils.createTestIpAddress(),
        userAgent: TestUtils.createTestUserAgent(),
        country: 'US'
      };
      
      const input: SendEnvelopeInput = {
        envelopeId,
        userId,
        securityContext
      };

      const testEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue() });
      const externalSigners = [{ getId: () => TestUtils.generateSignerId() } as any];
      const targetSigners = [{ getId: () => TestUtils.generateSignerId() } as any];

      const tokenResults = [
        {
          signerId: TestUtils.generateUuid(),
          email: 'signer@example.com',
          token: 'token-123',
          expiresAt: new Date('2023-12-31T23:59:59Z')
        }
      ];

      testEnvelope.getExternalSigners = jest.fn().mockReturnValue(externalSigners) as any;

      const { selectTargetSigners } = require('../../../../../src/services/orchestrators/utils/signerSelection');
      selectTargetSigners.mockReturnValue(targetSigners);

      mockSignatureEnvelopeService.sendEnvelope.mockResolvedValue(testEnvelope);
      mockInvitationTokenService.generateInvitationTokensForSigners.mockResolvedValue(tokenResults);
      mockEnvelopeNotificationService.sendSignerInvitations.mockRejectedValue(new Error('Notification failed'));

      await expect(useCase.execute(input)).rejects.toThrow('Notification failed');
    });

    it('should throw error when audit event creation fails', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      const securityContext = {
        ipAddress: TestUtils.createTestIpAddress(),
        userAgent: TestUtils.createTestUserAgent(),
        country: 'US'
      };
      
      const input: SendEnvelopeInput = {
        envelopeId,
        userId,
        securityContext
      };

      const testEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue() });
      const externalSigners = [{ getId: () => TestUtils.generateSignerId() } as any];
      const targetSigners = [{ getId: () => TestUtils.generateSignerId() } as any];

      const tokenResults = [
        {
          signerId: TestUtils.generateUuid(),
          email: 'signer@example.com',
          token: 'token-123',
          expiresAt: new Date('2023-12-31T23:59:59Z')
        }
      ];

      testEnvelope.getExternalSigners = jest.fn().mockReturnValue(externalSigners) as any;

      const { selectTargetSigners } = require('../../../../../src/services/orchestrators/utils/signerSelection');
      selectTargetSigners.mockReturnValue(targetSigners);

      mockSignatureEnvelopeService.sendEnvelope.mockResolvedValue(testEnvelope);
      mockInvitationTokenService.generateInvitationTokensForSigners.mockResolvedValue(tokenResults);
      mockEnvelopeNotificationService.sendSignerInvitations.mockResolvedValue(undefined);
      mockAuditEventService.create.mockRejectedValue(new Error('Audit creation failed'));

      await expect(useCase.execute(input)).rejects.toThrow('Audit creation failed');
    });
  });
});
