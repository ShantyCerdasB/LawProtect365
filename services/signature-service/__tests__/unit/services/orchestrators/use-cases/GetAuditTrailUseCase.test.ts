import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { GetAuditTrailUseCase } from '../../../../../src/services/orchestrators/use-cases/GetAuditTrailUseCase';
import { GetAuditTrailInput } from '../../../../../src/domain/types/usecase/orchestrator/GetAuditTrailUseCase';
import { EnvelopeId } from '../../../../../src/domain/value-objects/EnvelopeId';
import { AuditEventType } from '../../../../../src/domain/enums/AuditEventType';
import { TestUtils } from '../../../../helpers/testUtils';
import { signatureEnvelopeEntity } from '../../../../helpers/builders/signatureEnvelope';
import { createSignatureEnvelopeServiceMock } from '../../../../helpers/mocks/services/SignatureEnvelopeService.mock';
import { createAuditEventServiceMock } from '../../../../helpers/mocks/services/AuditEventService.mock';

// Mock EnvelopeAccessValidationRule
jest.mock('../../../../../src/domain/rules/EnvelopeAccessValidationRule', () => ({
  EnvelopeAccessValidationRule: {
    validateEnvelopeModificationAccess: jest.fn()
  }
}));

describe('GetAuditTrailUseCase', () => {
  let useCase: GetAuditTrailUseCase;
  let mockSignatureEnvelopeService: any;
  let mockAuditEventService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSignatureEnvelopeService = createSignatureEnvelopeServiceMock();
    mockAuditEventService = createAuditEventServiceMock();

    // Reset the mock implementation for each test
    const { EnvelopeAccessValidationRule } = require('../../../../../src/domain/rules/EnvelopeAccessValidationRule');
    EnvelopeAccessValidationRule.validateEnvelopeModificationAccess.mockImplementation(() => {
      // Default: no error (success)
    });

    useCase = new GetAuditTrailUseCase(
      mockSignatureEnvelopeService,
      mockAuditEventService
    );
  });

  describe('execute', () => {
    it('should retrieve audit trail successfully with events', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      
      const input: GetAuditTrailInput = {
        envelopeId,
        userId
      };

      const testEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue() });
      const mockAuditEvents = [
        {
          getId: () => ({ getValue: () => 'event-1' }),
          getEventType: () => AuditEventType.ENVELOPE_CREATED,
          getDescription: () => 'Envelope created',
          getUserEmail: () => 'user@example.com',
          getCreatedAt: () => new Date('2023-01-01T00:00:00Z'),
          getMetadata: () => ({ source: 'web' })
        },
        {
          getId: () => ({ getValue: () => 'event-2' }),
          getEventType: () => AuditEventType.ENVELOPE_SENT,
          getDescription: () => 'Envelope sent',
          getUserEmail: () => 'admin@example.com',
          getCreatedAt: () => new Date('2023-01-02T00:00:00Z'),
          getMetadata: () => ({ recipients: 2 })
        }
      ];

      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(testEnvelope);
      mockAuditEventService.getByEnvelope.mockResolvedValue(mockAuditEvents);

      const result = await useCase.execute(input);

      expect(mockSignatureEnvelopeService.getEnvelopeWithSigners).toHaveBeenCalledWith(envelopeId);
      expect(mockAuditEventService.getByEnvelope).toHaveBeenCalledWith(envelopeId.getValue());

      expect(result).toEqual({
        envelopeId: envelopeId.getValue(),
        events: [
          {
            id: 'event-1',
            eventType: AuditEventType.ENVELOPE_CREATED,
            description: 'Envelope created',
            userEmail: 'user@example.com',
            userName: 'user@example.com',
            createdAt: new Date('2023-01-01T00:00:00Z'),
            metadata: { source: 'web' }
          },
          {
            id: 'event-2',
            eventType: AuditEventType.ENVELOPE_SENT,
            description: 'Envelope sent',
            userEmail: 'admin@example.com',
            userName: 'admin@example.com',
            createdAt: new Date('2023-01-02T00:00:00Z'),
            metadata: { recipients: 2 }
          }
        ]
      });
    });

    it('should retrieve audit trail with empty events array', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      
      const input: GetAuditTrailInput = {
        envelopeId,
        userId
      };

      const testEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue() });

      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(testEnvelope);
      mockAuditEventService.getByEnvelope.mockResolvedValue([]);

      const result = await useCase.execute(input);

      expect(result).toEqual({
        envelopeId: envelopeId.getValue(),
        events: []
      });
    });

    it('should throw error when envelope is not found', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      
      const input: GetAuditTrailInput = {
        envelopeId,
        userId
      };

      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(null);

      await expect(useCase.execute(input)).rejects.toThrow('Envelope not found');
    });

    it('should throw error when access validation fails', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      
      const input: GetAuditTrailInput = {
        envelopeId,
        userId
      };

      const testEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue() });

      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(testEnvelope);
      
      const { EnvelopeAccessValidationRule } = require('../../../../../src/domain/rules/EnvelopeAccessValidationRule');
      EnvelopeAccessValidationRule.validateEnvelopeModificationAccess.mockImplementation(() => {
        throw new Error('Access denied');
      });

      await expect(useCase.execute(input)).rejects.toThrow('Access denied');
    });

    it('should throw error when audit events retrieval fails', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      
      const input: GetAuditTrailInput = {
        envelopeId,
        userId
      };

      const testEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue() });

      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(testEnvelope);
      mockAuditEventService.getByEnvelope.mockRejectedValue(new Error('Audit events retrieval failed'));

      await expect(useCase.execute(input)).rejects.toThrow('Audit events retrieval failed');
    });

    it('should handle audit events with optional fields', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      
      const input: GetAuditTrailInput = {
        envelopeId,
        userId
      };

      const testEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue() });
      const mockAuditEvents = [
        {
          getId: () => ({ getValue: () => 'event-1' }),
          getEventType: () => AuditEventType.ENVELOPE_CREATED,
          getDescription: () => 'Envelope created',
          getUserEmail: () => undefined,
          getCreatedAt: () => new Date('2023-01-01T00:00:00Z'),
          getMetadata: () => undefined
        }
      ];

      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(testEnvelope);
      mockAuditEventService.getByEnvelope.mockResolvedValue(mockAuditEvents);

      const result = await useCase.execute(input);

      expect(result.events[0]).toEqual({
        id: 'event-1',
        eventType: AuditEventType.ENVELOPE_CREATED,
        description: 'Envelope created',
        userEmail: undefined,
        userName: undefined,
        createdAt: new Date('2023-01-01T00:00:00Z'),
        metadata: undefined
      });
    });

    it('should handle multiple audit events with different types', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      
      const input: GetAuditTrailInput = {
        envelopeId,
        userId
      };

      const testEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue() });
      const mockAuditEvents = [
        {
          getId: () => ({ getValue: () => 'event-1' }),
          getEventType: () => AuditEventType.ENVELOPE_CREATED,
          getDescription: () => 'Envelope created',
          getUserEmail: () => 'creator@example.com',
          getCreatedAt: () => new Date('2023-01-01T00:00:00Z'),
          getMetadata: () => ({ source: 'web' })
        },
        {
          getId: () => ({ getValue: () => 'event-2' }),
          getEventType: () => AuditEventType.ENVELOPE_SENT,
          getDescription: () => 'Envelope sent',
          getUserEmail: () => 'sender@example.com',
          getCreatedAt: () => new Date('2023-01-02T00:00:00Z'),
          getMetadata: () => ({ recipients: 3 })
        },
        {
          getId: () => ({ getValue: () => 'event-3' }),
          getEventType: () => AuditEventType.SIGNER_SIGNED,
          getDescription: () => 'Signer signed',
          getUserEmail: () => 'signer@example.com',
          getCreatedAt: () => new Date('2023-01-03T00:00:00Z'),
          getMetadata: () => ({ signerId: 'signer-123' })
        }
      ];

      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(testEnvelope);
      mockAuditEventService.getByEnvelope.mockResolvedValue(mockAuditEvents);

      const result = await useCase.execute(input);

      expect(result.events).toHaveLength(3);
      expect(result.events[0].eventType).toBe(AuditEventType.ENVELOPE_CREATED);
      expect(result.events[1].eventType).toBe(AuditEventType.ENVELOPE_SENT);
      expect(result.events[2].eventType).toBe(AuditEventType.SIGNER_SIGNED);
    });
  });
});
