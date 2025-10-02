import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { GetAuditTrailUseCase } from '../../../../../src/services/orchestrators/use-cases/GetAuditTrailUseCase';
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

// Helper functions to reduce nesting
function createTestInput() {
  return {
    envelopeId: TestUtils.generateEnvelopeId(),
    userId: TestUtils.generateUuid()
  };
}

function createMockAuditEvent(id: string, eventType: AuditEventType, description: string, userEmail: string, createdAt: Date, metadata?: any) {
  return {
    getId: () => ({ getValue: () => id }),
    getEventType: () => eventType,
    getDescription: () => description,
    getUserEmail: () => userEmail,
    getCreatedAt: () => createdAt,
    getMetadata: () => metadata
  };
}

function createMockAuditEvents() {
  return [
    createMockAuditEvent(
      'event-1',
      AuditEventType.ENVELOPE_CREATED,
      'Envelope created',
      'user@example.com',
      new Date('2023-01-01T00:00:00Z'),
      { source: 'web' }
    ),
    createMockAuditEvent(
      'event-2',
      AuditEventType.ENVELOPE_SENT,
      'Envelope sent',
      'admin@example.com',
      new Date('2023-01-02T00:00:00Z'),
      { recipients: 2 }
    )
  ];
}

function setupSuccessfulMocks(mockSignatureEnvelopeService: any, mockAuditEventService: any, envelopeId: any, auditEvents: any[]) {
  const testEnvelope = signatureEnvelopeEntity({ id: envelopeId.getValue() });
  mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(testEnvelope);
  mockAuditEventService.getByEnvelope.mockResolvedValue(auditEvents);
  return testEnvelope;
}

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
      const input = createTestInput();
      const mockAuditEvents = createMockAuditEvents();
      
      setupSuccessfulMocks(mockSignatureEnvelopeService, mockAuditEventService, input.envelopeId, mockAuditEvents);

      const result = await useCase.execute(input);

      expect(mockSignatureEnvelopeService.getEnvelopeWithSigners).toHaveBeenCalledWith(input.envelopeId);
      expect(mockAuditEventService.getByEnvelope).toHaveBeenCalledWith(input.envelopeId.getValue());

      expect(result).toEqual({
        envelopeId: input.envelopeId.getValue(),
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
      const input = createTestInput();
      
      setupSuccessfulMocks(mockSignatureEnvelopeService, mockAuditEventService, input.envelopeId, []);

      const result = await useCase.execute(input);

      expect(result).toEqual({
        envelopeId: input.envelopeId.getValue(),
        events: []
      });
    });

    it('should throw error when envelope is not found', async () => {
      const input = createTestInput();
      
      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(null);

      await expect(useCase.execute(input)).rejects.toThrow('Envelope not found');
    });

    it('should throw error when access validation fails', async () => {
      const input = createTestInput();
      const testEnvelope = signatureEnvelopeEntity({ id: input.envelopeId.getValue() });

      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(testEnvelope);
      
      const { EnvelopeAccessValidationRule } = require('../../../../../src/domain/rules/EnvelopeAccessValidationRule');
      EnvelopeAccessValidationRule.validateEnvelopeModificationAccess.mockImplementation(() => {
        throw new Error('Access denied');
      });

      await expect(useCase.execute(input)).rejects.toThrow('Access denied');
    });

    it('should throw error when audit events retrieval fails', async () => {
      const input = createTestInput();
      const testEnvelope = signatureEnvelopeEntity({ id: input.envelopeId.getValue() });

      mockSignatureEnvelopeService.getEnvelopeWithSigners.mockResolvedValue(testEnvelope);
      mockAuditEventService.getByEnvelope.mockRejectedValue(new Error('Audit events retrieval failed'));

      await expect(useCase.execute(input)).rejects.toThrow('Audit events retrieval failed');
    });

    it('should handle audit events with optional fields', async () => {
      const input = createTestInput();
      const mockAuditEvents = [
        createMockAuditEvent(
          'event-1',
          AuditEventType.ENVELOPE_CREATED,
          'Envelope created',
          undefined as any,
          new Date('2023-01-01T00:00:00Z'),
          undefined
        )
      ];

      setupSuccessfulMocks(mockSignatureEnvelopeService, mockAuditEventService, input.envelopeId, mockAuditEvents);

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
      const input = createTestInput();
      const mockAuditEvents = [
        createMockAuditEvent(
          'event-1',
          AuditEventType.ENVELOPE_CREATED,
          'Envelope created',
          'creator@example.com',
          new Date('2023-01-01T00:00:00Z'),
          { source: 'web' }
        ),
        createMockAuditEvent(
          'event-2',
          AuditEventType.ENVELOPE_SENT,
          'Envelope sent',
          'sender@example.com',
          new Date('2023-01-02T00:00:00Z'),
          { recipients: 3 }
        ),
        createMockAuditEvent(
          'event-3',
          AuditEventType.SIGNER_SIGNED,
          'Signer signed',
          'signer@example.com',
          new Date('2023-01-03T00:00:00Z'),
          { signerId: 'signer-123' }
        )
      ];

      setupSuccessfulMocks(mockSignatureEnvelopeService, mockAuditEventService, input.envelopeId, mockAuditEvents);

      const result = await useCase.execute(input);

      expect(result.events).toHaveLength(3);
      expect(result.events[0].eventType).toBe(AuditEventType.ENVELOPE_CREATED);
      expect(result.events[1].eventType).toBe(AuditEventType.ENVELOPE_SENT);
      expect(result.events[2].eventType).toBe(AuditEventType.SIGNER_SIGNED);
    });
  });
});
