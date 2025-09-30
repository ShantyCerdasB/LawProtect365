/**
 * @fileoverview envelopeAuditHelpers.test.ts - Unit tests for envelope-specific audit helpers
 * @summary Tests for envelope audit event creation utilities
 * @description Tests all envelope-specific audit helper functions to ensure proper
 * audit event creation with domain-specific metadata and correct event types.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import {
  createEnvelopeCreatedAudit,
  createEnvelopeUpdatedAudit,
  createEnvelopeCancelledAudit,
  createDocumentAccessedAudit,
  createDocumentDownloadedAudit
} from '../../../../../../src/services/orchestrators/utils/audit/envelopeAuditHelpers';
import { AuditEventType } from '../../../../../../src/domain/enums/AuditEventType';

// Mock the createAuditEvent function
jest.mock('../../../../../../src/services/orchestrators/utils/audit/auditHelpers', () => ({
  createAuditEvent: jest.fn()
}));

describe('envelopeAuditHelpers', () => {
  let mockCreateAuditEvent: jest.MockedFunction<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateAuditEvent = require('../../../../../../src/services/orchestrators/utils/audit/auditHelpers').createAuditEvent;
  });

  describe('createEnvelopeCreatedAudit', () => {
    it('should create audit event for envelope creation', () => {
      const mockEnvelope = {
        getId: jest.fn().mockReturnValue({ getValue: () => 'test-envelope-id' }),
        getTitle: jest.fn().mockReturnValue('Test Document'),
        getSigningOrder: jest.fn().mockReturnValue({ toString: () => 'PARALLEL' }),
        getOrigin: jest.fn().mockReturnValue({ getType: () => 'UPLOAD' }),
        getExpiresAt: jest.fn().mockReturnValue(new Date('2024-12-31T23:59:59Z'))
      };
      const userId = 'test-user-id';
      const expectedResult = {
        envelopeId: 'test-envelope-id',
        eventType: AuditEventType.ENVELOPE_CREATED,
        description: 'Envelope "Test Document" created',
        userId,
        signerId: undefined,
        userEmail: undefined,
        networkContext: {},
        metadata: {
          title: 'Test Document',
          signingOrder: 'PARALLEL',
          originType: 'UPLOAD',
          expiresAt: '2024-12-31T23:59:59.000Z'
        }
      };

      mockCreateAuditEvent.mockReturnValue(expectedResult);

      const result = createEnvelopeCreatedAudit(mockEnvelope as any, userId);

      expect(mockCreateAuditEvent).toHaveBeenCalledWith(
        'test-envelope-id',
        AuditEventType.ENVELOPE_CREATED,
        'Envelope "Test Document" created',
        userId,
        undefined,
        undefined,
        {
          title: 'Test Document',
          signingOrder: 'PARALLEL',
          originType: 'UPLOAD',
          expiresAt: '2024-12-31T23:59:59.000Z'
        }
      );
      expect(result).toEqual(expectedResult);
    });

    it('should handle envelope with different title', () => {
      const mockEnvelope = {
        getId: jest.fn().mockReturnValue({ getValue: () => 'test-envelope-id' }),
        getTitle: jest.fn().mockReturnValue('Custom Document'),
        getSigningOrder: jest.fn().mockReturnValue({ toString: () => 'SEQUENTIAL' }),
        getOrigin: jest.fn().mockReturnValue({ getType: () => 'TEMPLATE' }),
        getExpiresAt: jest.fn().mockReturnValue(null)
      };
      const userId = 'test-user-id';

      createEnvelopeCreatedAudit(mockEnvelope as any, userId);

      expect(mockCreateAuditEvent).toHaveBeenCalledWith(
        'test-envelope-id',
        AuditEventType.ENVELOPE_CREATED,
        'Envelope "Custom Document" created',
        userId,
        undefined,
        undefined,
        expect.objectContaining({
          title: 'Custom Document',
          signingOrder: 'SEQUENTIAL',
          originType: 'TEMPLATE',
          expiresAt: undefined
        })
      );
    });
  });

  describe('createEnvelopeUpdatedAudit', () => {
    it('should create audit event for envelope update', () => {
      const mockEnvelope = {
        getId: jest.fn().mockReturnValue({ getValue: () => 'test-envelope-id' }),
        getTitle: jest.fn().mockReturnValue('Updated Document')
      };
      const userId = 'test-user-id';
      const updatedFields = ['title', 'description'];
      const expectedResult = {
        envelopeId: 'test-envelope-id',
        eventType: AuditEventType.ENVELOPE_UPDATED,
        description: 'Envelope "Updated Document" updated',
        userId,
        signerId: undefined,
        userEmail: undefined,
        networkContext: {},
        metadata: {
          updatedFields,
          title: 'Updated Document'
        }
      };

      mockCreateAuditEvent.mockReturnValue(expectedResult);

      const result = createEnvelopeUpdatedAudit(mockEnvelope as any, userId, updatedFields);

      expect(mockCreateAuditEvent).toHaveBeenCalledWith(
        'test-envelope-id',
        AuditEventType.ENVELOPE_UPDATED,
        'Envelope "Updated Document" updated',
        userId,
        undefined,
        undefined,
        {
          updatedFields,
          title: 'Updated Document'
        }
      );
      expect(result).toEqual(expectedResult);
    });

    it('should handle different updated fields', () => {
      const mockEnvelope = {
        getId: jest.fn().mockReturnValue({ getValue: () => 'test-envelope-id' }),
        getTitle: jest.fn().mockReturnValue('Test Document')
      };
      const userId = 'test-user-id';
      const updatedFields = ['expiresAt', 'signingOrder'];

      createEnvelopeUpdatedAudit(mockEnvelope as any, userId, updatedFields);

      expect(mockCreateAuditEvent).toHaveBeenCalledWith(
        'test-envelope-id',
        AuditEventType.ENVELOPE_UPDATED,
        'Envelope "Test Document" updated',
        userId,
        undefined,
        undefined,
        expect.objectContaining({
          updatedFields: ['expiresAt', 'signingOrder']
        })
      );
    });

    it('should handle empty updated fields array', () => {
      const mockEnvelope = {
        getId: jest.fn().mockReturnValue({ getValue: () => 'test-envelope-id' }),
        getTitle: jest.fn().mockReturnValue('Test Document')
      };
      const userId = 'test-user-id';
      const updatedFields: string[] = [];

      createEnvelopeUpdatedAudit(mockEnvelope as any, userId, updatedFields);

      expect(mockCreateAuditEvent).toHaveBeenCalledWith(
        'test-envelope-id',
        AuditEventType.ENVELOPE_UPDATED,
        'Envelope "Test Document" updated',
        userId,
        undefined,
        undefined,
        expect.objectContaining({
          updatedFields: []
        })
      );
    });
  });

  describe('createEnvelopeCancelledAudit', () => {
    it('should create audit event for envelope cancellation', () => {
      const mockEnvelope = {
        getId: jest.fn().mockReturnValue({ getValue: () => 'test-envelope-id' }),
        getTitle: jest.fn().mockReturnValue('Cancelled Document'),
        getUpdatedAt: jest.fn().mockReturnValue(new Date('2024-01-15T10:30:00Z'))
      };
      const userId = 'test-user-id';
      const expectedResult = {
        envelopeId: 'test-envelope-id',
        eventType: AuditEventType.ENVELOPE_CANCELLED,
        description: 'Envelope "Cancelled Document" cancelled',
        userId,
        signerId: undefined,
        userEmail: undefined,
        networkContext: {},
        metadata: {
          title: 'Cancelled Document',
          cancelledAt: '2024-01-15T10:30:00.000Z'
        }
      };

      mockCreateAuditEvent.mockReturnValue(expectedResult);

      const result = createEnvelopeCancelledAudit(mockEnvelope as any, userId);

      expect(mockCreateAuditEvent).toHaveBeenCalledWith(
        'test-envelope-id',
        AuditEventType.ENVELOPE_CANCELLED,
        'Envelope "Cancelled Document" cancelled',
        userId,
        undefined,
        undefined,
        {
          title: 'Cancelled Document',
          cancelledAt: '2024-01-15T10:30:00.000Z'
        }
      );
      expect(result).toEqual(expectedResult);
    });

    it('should handle envelope with different title for cancellation', () => {
      const mockEnvelope = {
        getId: jest.fn().mockReturnValue({ getValue: () => 'test-envelope-id' }),
        getTitle: jest.fn().mockReturnValue('Important Document'),
        getUpdatedAt: jest.fn().mockReturnValue(new Date('2024-02-01T15:45:00Z'))
      };
      const userId = 'test-user-id';

      createEnvelopeCancelledAudit(mockEnvelope as any, userId);

      expect(mockCreateAuditEvent).toHaveBeenCalledWith(
        'test-envelope-id',
        AuditEventType.ENVELOPE_CANCELLED,
        'Envelope "Important Document" cancelled',
        userId,
        undefined,
        undefined,
        expect.objectContaining({
          title: 'Important Document'
        })
      );
    });
  });

  describe('createDocumentAccessedAudit', () => {
    it('should create audit event for document access with all parameters', () => {
      const envelopeId = 'test-envelope-id';
      const signerId = 'test-signer-id';
      const userId = 'test-user-id';
      const userEmail = { getValue: () => 'external@example.com' } as any;
      const securityContext = {
        ipAddress: '192.168.1.100',
        userAgent: 'ExternalAgent/1.0',
        country: 'CA'
      };
      const expectedResult = {
        envelopeId,
        eventType: AuditEventType.DOCUMENT_ACCESSED,
        description: 'External user accessed envelope document via invitation token',
        userId,
        signerId,
        userEmail: 'external@example.com',
        networkContext: {},
        metadata: {
          signerId,
          externalUserIdentifier: 'external@example.com_test-user-id',
          ipAddress: '192.168.1.100',
          userAgent: 'ExternalAgent/1.0',
          country: 'CA'
        }
      };

      mockCreateAuditEvent.mockReturnValue(expectedResult);

      const result = createDocumentAccessedAudit(
        envelopeId,
        signerId,
        userId,
        userEmail,
        securityContext
      );

      expect(mockCreateAuditEvent).toHaveBeenCalledWith(
        envelopeId,
        AuditEventType.DOCUMENT_ACCESSED,
        'External user accessed envelope document via invitation token',
        userId,
        signerId,
        userEmail,
        {
          signerId,
          externalUserIdentifier: 'external@example.com_test-user-id',
          ipAddress: '192.168.1.100',
          userAgent: 'ExternalAgent/1.0',
          country: 'CA'
        }
      );
      expect(result).toEqual(expectedResult);
    });

    it('should create audit event for document access without userEmail', () => {
      const envelopeId = 'test-envelope-id';
      const signerId = 'test-signer-id';
      const userId = 'test-user-id';
      const securityContext = {
        ipAddress: '192.168.1.1',
        userAgent: 'TestAgent/1.0',
        country: 'US'
      };

      createDocumentAccessedAudit(envelopeId, signerId, userId, undefined, securityContext);

      expect(mockCreateAuditEvent).toHaveBeenCalledWith(
        envelopeId,
        AuditEventType.DOCUMENT_ACCESSED,
        'External user accessed envelope document via invitation token',
        userId,
        signerId,
        undefined,
        expect.objectContaining({
          signerId,
          externalUserIdentifier: userId
        })
      );
    });

    it('should create audit event for document access without security context', () => {
      const envelopeId = 'test-envelope-id';
      const signerId = 'test-signer-id';
      const userId = 'test-user-id';
      const userEmail = { getValue: () => 'external@example.com' } as any;

      createDocumentAccessedAudit(envelopeId, signerId, userId, userEmail, undefined);

      expect(mockCreateAuditEvent).toHaveBeenCalledWith(
        envelopeId,
        AuditEventType.DOCUMENT_ACCESSED,
        'External user accessed envelope document via invitation token',
        userId,
        signerId,
        userEmail,
        expect.objectContaining({
          signerId,
          externalUserIdentifier: 'external@example.com_test-user-id',
          ipAddress: undefined,
          userAgent: undefined,
          country: undefined
        })
      );
    });

    it('should create audit event for document access with minimal parameters', () => {
      const envelopeId = 'test-envelope-id';
      const signerId = 'test-signer-id';
      const userId = 'test-user-id';

      createDocumentAccessedAudit(envelopeId, signerId, userId);

      expect(mockCreateAuditEvent).toHaveBeenCalledWith(
        envelopeId,
        AuditEventType.DOCUMENT_ACCESSED,
        'External user accessed envelope document via invitation token',
        userId,
        signerId,
        undefined,
        expect.objectContaining({
          signerId,
          externalUserIdentifier: userId
        })
      );
    });
  });

  describe('createDocumentDownloadedAudit', () => {
    it('should create audit event for document download with all parameters', () => {
      const envelopeId = 'test-envelope-id';
      const userId = 'test-user-id';
      const userEmail = { getValue: () => 'user@example.com' } as any;
      const securityContext = {
        ipAddress: '10.0.0.1',
        userAgent: 'DownloadAgent/2.0',
        country: 'US'
      };
      const expectedResult = {
        envelopeId,
        eventType: AuditEventType.DOCUMENT_DOWNLOADED,
        description: 'Document downloaded',
        userId,
        signerId: undefined,
        userEmail: 'user@example.com',
        networkContext: {},
        metadata: {
          ipAddress: '10.0.0.1',
          userAgent: 'DownloadAgent/2.0',
          country: 'US'
        }
      };

      mockCreateAuditEvent.mockReturnValue(expectedResult);

      const result = createDocumentDownloadedAudit(
        envelopeId,
        userId,
        userEmail,
        securityContext
      );

      expect(mockCreateAuditEvent).toHaveBeenCalledWith(
        envelopeId,
        AuditEventType.DOCUMENT_DOWNLOADED,
        'Document downloaded',
        userId,
        undefined,
        userEmail,
        {
          ipAddress: '10.0.0.1',
          userAgent: 'DownloadAgent/2.0',
          country: 'US'
        }
      );
      expect(result).toEqual(expectedResult);
    });

    it('should create audit event for document download without userEmail', () => {
      const envelopeId = 'test-envelope-id';
      const userId = 'test-user-id';
      const securityContext = {
        ipAddress: '192.168.1.1',
        userAgent: 'TestAgent/1.0',
        country: 'US'
      };

      createDocumentDownloadedAudit(envelopeId, userId, undefined, securityContext);

      expect(mockCreateAuditEvent).toHaveBeenCalledWith(
        envelopeId,
        AuditEventType.DOCUMENT_DOWNLOADED,
        'Document downloaded',
        userId,
        undefined,
        undefined,
        expect.objectContaining({
          ipAddress: '192.168.1.1',
          userAgent: 'TestAgent/1.0',
          country: 'US'
        })
      );
    });

    it('should create audit event for document download without security context', () => {
      const envelopeId = 'test-envelope-id';
      const userId = 'test-user-id';
      const userEmail = { getValue: () => 'user@example.com' } as any;

      createDocumentDownloadedAudit(envelopeId, userId, userEmail, undefined);

      expect(mockCreateAuditEvent).toHaveBeenCalledWith(
        envelopeId,
        AuditEventType.DOCUMENT_DOWNLOADED,
        'Document downloaded',
        userId,
        undefined,
        userEmail,
        {
          ipAddress: undefined,
          userAgent: undefined,
          country: undefined
        }
      );
    });

    it('should create audit event for document download with minimal parameters', () => {
      const envelopeId = 'test-envelope-id';
      const userId = 'test-user-id';

      createDocumentDownloadedAudit(envelopeId, userId);

      expect(mockCreateAuditEvent).toHaveBeenCalledWith(
        envelopeId,
        AuditEventType.DOCUMENT_DOWNLOADED,
        'Document downloaded',
        userId,
        undefined,
        undefined,
        {
          ipAddress: undefined,
          userAgent: undefined,
          country: undefined
        }
      );
    });

    it('should handle different security context values', () => {
      const envelopeId = 'test-envelope-id';
      const userId = 'test-user-id';
      const securityContext = {
        ipAddress: '203.0.113.1',
        userAgent: 'CustomAgent/3.0',
        country: 'GB'
      };

      createDocumentDownloadedAudit(envelopeId, userId, undefined, securityContext);

      expect(mockCreateAuditEvent).toHaveBeenCalledWith(
        envelopeId,
        AuditEventType.DOCUMENT_DOWNLOADED,
        'Document downloaded',
        userId,
        undefined,
        undefined,
        {
          ipAddress: '203.0.113.1',
          userAgent: 'CustomAgent/3.0',
          country: 'GB'
        }
      );
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle envelope with undefined expiresAt in created audit', () => {
      const mockEnvelope = {
        getId: jest.fn().mockReturnValue({ getValue: () => 'test-envelope-id' }),
        getTitle: jest.fn().mockReturnValue('Test Document'),
        getSigningOrder: jest.fn().mockReturnValue({ toString: () => 'PARALLEL' }),
        getOrigin: jest.fn().mockReturnValue({ getType: () => 'UPLOAD' }),
        getExpiresAt: jest.fn().mockReturnValue(undefined)
      };
      const userId = 'test-user-id';

      createEnvelopeCreatedAudit(mockEnvelope as any, userId);

      expect(mockCreateAuditEvent).toHaveBeenCalledWith(
        'test-envelope-id',
        AuditEventType.ENVELOPE_CREATED,
        'Envelope "Test Document" created',
        userId,
        undefined,
        undefined,
        expect.objectContaining({
          expiresAt: undefined
        })
      );
    });

    it('should handle empty updated fields array', () => {
      const mockEnvelope = {
        getId: jest.fn().mockReturnValue({ getValue: () => 'test-envelope-id' }),
        getTitle: jest.fn().mockReturnValue('Test Document')
      };
      const userId = 'test-user-id';
      const updatedFields: string[] = [];

      createEnvelopeUpdatedAudit(mockEnvelope as any, userId, updatedFields);

      expect(mockCreateAuditEvent).toHaveBeenCalledWith(
        'test-envelope-id',
        AuditEventType.ENVELOPE_UPDATED,
        'Envelope "Test Document" updated',
        userId,
        undefined,
        undefined,
        expect.objectContaining({
          updatedFields: []
        })
      );
    });

    it('should handle Email object with different values', () => {
      const envelopeId = 'test-envelope-id';
      const signerId = 'test-signer-id';
      const userId = 'test-user-id';
      const userEmail = { getValue: () => 'different@example.com' } as any;

      createDocumentAccessedAudit(envelopeId, signerId, userId, userEmail);

      expect(mockCreateAuditEvent).toHaveBeenCalledWith(
        envelopeId,
        AuditEventType.DOCUMENT_ACCESSED,
        'External user accessed envelope document via invitation token',
        userId,
        signerId,
        userEmail,
        expect.objectContaining({
          externalUserIdentifier: 'different@example.com_test-user-id'
        })
      );
    });
  });
});