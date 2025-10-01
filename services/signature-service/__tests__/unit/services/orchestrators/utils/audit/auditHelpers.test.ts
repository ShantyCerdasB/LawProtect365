/**
 * @fileoverview auditHelpers.test.ts - Unit tests for audit helper utilities
 * @summary Tests for generic audit event creation utilities
 * @description Tests the createAuditEvent function and AuditEventData interface
 * to ensure proper audit event creation with consistent patterns.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { generateTestIpAddress } from '../../../../../integration/helpers/testHelpers';
import { createAuditEvent, AuditEventData } from '../../../../../../src/services/orchestrators/utils/audit/auditHelpers';
import { AuditEventType } from '../../../../../../src/domain/enums/AuditEventType';

// Mock the createNetworkSecurityContext function
jest.mock('@lawprotect/shared-ts', () => ({
  createNetworkSecurityContext: jest.fn(() => ({
    ipAddress: generateTestIpAddress(),
    userAgent: 'TestAgent/1.0',
    country: 'US'
  })),
  Email: jest.fn().mockImplementation((value: any) => ({
    getValue: () => value,
    domain: value.split('@')[1],
    getDomain: () => value.split('@')[1],
    extractDomain: () => value.split('@')[1],
    equals: jest.fn(),
    toString: () => value,
    toJSON: () => value
  }))
}));

describe('auditHelpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createAuditEvent', () => {
    it('should create audit event with all required parameters', () => {
      const envelopeId = 'test-envelope-id';
      const userId = 'test-user-id';
      const eventType = AuditEventType.ENVELOPE_CREATED;
      const description = 'Test audit event';
      const signerId = 'test-signer-id';
      const userEmail = { getValue: () => 'test@example.com' } as any;
      const metadata = { testData: 'value' };

      const result = createAuditEvent(
        envelopeId,
        eventType,
        description,
        userId,
        signerId,
        userEmail,
        metadata
      );

      expect(result).toEqual({
        envelopeId,
        signerId,
        eventType,
        description,
        userId,
        userEmail: 'test@example.com',
        networkContext: {
          ipAddress: expect.any(String),
          userAgent: 'TestAgent/1.0',
          country: 'US'
        },
        metadata: {
          envelopeId,
          testData: 'value'
        }
      });
    });

    it('should create audit event with minimal parameters', () => {
      const envelopeId = 'test-envelope-id';
      const userId = 'test-user-id';
      const eventType = AuditEventType.ENVELOPE_CREATED;
      const description = 'Test audit event';

      const result = createAuditEvent(
        envelopeId,
        eventType,
        description,
        userId
      );

      expect(result).toEqual({
        envelopeId,
        signerId: undefined,
        eventType,
        description,
        userId,
        userEmail: undefined,
        networkContext: {
          ipAddress: expect.any(String),
          userAgent: 'TestAgent/1.0',
          country: 'US'
        },
        metadata: {
          envelopeId
        }
      });
    });

    it('should create audit event with signerId but no userEmail', () => {
      const envelopeId = 'test-envelope-id';
      const userId = 'test-user-id';
      const signerId = 'test-signer-id';

      const result = createAuditEvent(
        envelopeId,
        AuditEventType.SIGNER_ADDED,
        'Signer added',
        userId,
        signerId
      );

      expect(result.signerId).toBe(signerId);
      expect(result.userEmail).toBeUndefined();
    });

    it('should create audit event with userEmail but no signerId', () => {
      const envelopeId = 'test-envelope-id';
      const userId = 'test-user-id';
      const userEmail = { getValue: () => 'user@example.com' } as any;

      const result = createAuditEvent(
        envelopeId,
        AuditEventType.ENVELOPE_CREATED,
        'Envelope created',
        userId,
        undefined,
        userEmail
      );

      expect(result.signerId).toBeUndefined();
      expect(result.userEmail).toBe('user@example.com');
    });

    it('should create audit event with custom metadata', () => {
      const envelopeId = 'test-envelope-id';
      const userId = 'test-user-id';
      const customMetadata = {
        customField: 'customValue',
        anotherField: 123
      };

      const result = createAuditEvent(
        envelopeId,
        AuditEventType.ENVELOPE_UPDATED,
        'Envelope updated',
        userId,
        undefined,
        undefined,
        customMetadata
      );

      expect(result.metadata).toEqual({
        envelopeId,
        customField: 'customValue',
        anotherField: 123
      });
    });

    it('should create audit event with empty metadata', () => {
      const envelopeId = 'test-envelope-id';
      const userId = 'test-user-id';

      const result = createAuditEvent(
        envelopeId,
        AuditEventType.ENVELOPE_CREATED,
        'Envelope created',
        userId,
        undefined,
        undefined,
        {}
      );

      expect(result.metadata).toEqual({
        envelopeId
      });
    });

    it('should handle Email object correctly', () => {
      const envelopeId = 'test-envelope-id';
      const userId = 'test-user-id';
      const userEmail = { getValue: () => 'test@example.com' } as any;

      const result = createAuditEvent(
        envelopeId,
        AuditEventType.ENVELOPE_CREATED,
        'Envelope created',
        userId,
        undefined,
        userEmail
      );

      expect(result.userEmail).toBe('test@example.com');
    });

    it('should handle different AuditEventType values', () => {
      const envelopeId = 'test-envelope-id';
      const userId = 'test-user-id';

      const eventTypes = [
        AuditEventType.ENVELOPE_CREATED,
        AuditEventType.ENVELOPE_UPDATED,
        AuditEventType.ENVELOPE_CANCELLED,
        AuditEventType.SIGNER_ADDED,
        AuditEventType.SIGNER_REMOVED,
        AuditEventType.SIGNER_SIGNED,
        AuditEventType.SIGNER_DECLINED,
        AuditEventType.DOCUMENT_ACCESSED,
        AuditEventType.DOCUMENT_DOWNLOADED
      ];

      eventTypes.forEach(eventType => {
        const result = createAuditEvent(
          envelopeId,
          eventType,
          `Test ${eventType}`,
          userId
        );

        expect(result.eventType).toBe(eventType);
      });
    });

    it('should preserve all parameters in result object', () => {
      const envelopeId = 'test-envelope-id';
      const userId = 'test-user-id';
      const signerId = 'test-signer-id';
      const userEmail = { getValue: () => 'test@example.com' } as any;
      const metadata = { test: 'data' };

      const result = createAuditEvent(
        envelopeId,
        AuditEventType.ENVELOPE_CREATED,
        'Test description',
        userId,
        signerId,
        userEmail,
        metadata
      );

      expect(result.envelopeId).toBe(envelopeId);
      expect(result.signerId).toBe(signerId);
      expect(result.eventType).toBe(AuditEventType.ENVELOPE_CREATED);
      expect(result.description).toBe('Test description');
      expect(result.userId).toBe(userId);
      expect(result.userEmail).toBe('test@example.com');
      expect(result.networkContext).toBeDefined();
      expect(result.metadata).toEqual({
        envelopeId,
        test: 'data'
      });
    });
  });

  describe('AuditEventData interface', () => {
    it('should accept valid AuditEventData structure', () => {
      const validAuditData: AuditEventData = {
        envelopeId: 'test-envelope-id',
        eventType: AuditEventType.ENVELOPE_CREATED,
        description: 'Test audit event',
        userId: 'test-user-id',
        networkContext: {
          ipAddress: generateTestIpAddress(),
          userAgent: 'TestAgent/1.0',
          country: 'US'
        },
        metadata: {
          testData: 'value'
        }
      };

      expect(validAuditData.envelopeId).toBeDefined();
      expect(validAuditData.eventType).toBeDefined();
      expect(validAuditData.description).toBeDefined();
      expect(validAuditData.userId).toBeDefined();
      expect(validAuditData.networkContext).toBeDefined();
      expect(validAuditData.metadata).toBeDefined();
    });

    it('should handle optional signerId field', () => {
      const auditDataWithSigner: AuditEventData = {
        envelopeId: 'test-envelope-id',
        eventType: AuditEventType.SIGNER_ADDED,
        description: 'Signer added',
        userId: 'test-user-id',
        signerId: 'test-signer-id',
        networkContext: {
          ipAddress: generateTestIpAddress(),
          userAgent: 'TestAgent/1.0',
          country: 'US'
        },
        metadata: {}
      };
      
      const auditDataWithoutSigner: AuditEventData = {
        envelopeId: 'test-envelope-id',
        eventType: AuditEventType.ENVELOPE_CREATED,
        description: 'Envelope created',
        userId: 'test-user-id',
        signerId: undefined,
        networkContext: {
          ipAddress: generateTestIpAddress(),
          userAgent: 'TestAgent/1.0',
          country: 'US'
        },
        metadata: {}
      };

      expect(auditDataWithSigner.signerId).toBeDefined();
      expect(auditDataWithoutSigner.signerId).toBeUndefined();
    });

    it('should handle optional userEmail field', () => {
      const auditDataWithEmail: AuditEventData = {
        envelopeId: 'test-envelope-id',
        eventType: AuditEventType.ENVELOPE_CREATED,
        description: 'Envelope created',
        userId: 'test-user-id',
        userEmail: 'test@example.com',
        networkContext: {
          ipAddress: generateTestIpAddress(),
          userAgent: 'TestAgent/1.0',
          country: 'US'
        },
        metadata: {}
      };
      
      const auditDataWithoutEmail: AuditEventData = {
        envelopeId: 'test-envelope-id',
        eventType: AuditEventType.ENVELOPE_CREATED,
        description: 'Envelope created',
        userId: 'test-user-id',
        userEmail: undefined,
        networkContext: {
          ipAddress: generateTestIpAddress(),
          userAgent: 'TestAgent/1.0',
          country: 'US'
        },
        metadata: {}
      };

      expect(auditDataWithEmail.userEmail).toBeDefined();
      expect(auditDataWithoutEmail.userEmail).toBeUndefined();
    });
  });
});