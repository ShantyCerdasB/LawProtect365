/**
 * @fileoverview Unit tests for SignatureAuditEvent entity
 * @summary Tests for audit event management and compliance tracking
 * @description Comprehensive test suite for SignatureAuditEvent entity covering all business logic,
 * event categorization, and audit trail functionality for compliance and security.
 */

import { SignatureAuditEvent } from '../../../../src/domain/entities/SignatureAuditEvent';
import { NetworkSecurityContext } from '@lawprotect/shared-ts';
import { EnvelopeId } from '../../../../src/domain/value-objects/EnvelopeId';
import { SignerId } from '../../../../src/domain/value-objects/SignerId';
import { SignatureAuditEventId } from '../../../../src/domain/value-objects/SignatureAuditEventId';
import { AuditEventType } from '../../../../src/domain/enums/AuditEventType';
import { TestUtils, TEST_CONSTANTS } from '../../../helpers/testUtils';
import { generateTestIpAddress } from '../../../integration/helpers/testHelpers';

// Helper function to create SignatureAuditEvent with custom parameters
function createAuditEventWithParams(params: {
  id?: string;
  envelopeId?: string;
  signerId?: string;
  eventType?: AuditEventType;
  description?: string;
  userId?: string;
  userEmail?: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
} & NetworkSecurityContext): SignatureAuditEvent {
  return new SignatureAuditEvent(
    params.id ? new SignatureAuditEventId(params.id) : TestUtils.generateSignatureAuditEventId(),
    new EnvelopeId(params.envelopeId || TestUtils.generateUuid()),
    params.signerId ? new SignerId(params.signerId) : undefined,
    params.eventType || AuditEventType.ENVELOPE_CREATED,
    params.description || 'Test audit event',
    params.userId,
    params.userEmail,
    params.ipAddress,
    params.userAgent,
    params.country,
    params.metadata,
    params.createdAt || new Date('2024-01-01T00:00:00Z')
  );
}

describe('SignatureAuditEvent', () => {
  describe('Constructor and Getters', () => {
    it('should create audit event with all properties', () => {
      const id = TestUtils.generateUuid();
      const envelopeId = TestUtils.generateUuid();
      const signerId = TestUtils.generateUuid();
      const userId = TestUtils.generateUuid();
      const createdAt = new Date('2024-01-01T10:00:00Z');
      const metadata = { action: 'sign', documentId: 'doc-123' };
      const ipAddress = generateTestIpAddress();

      const event = createAuditEventWithParams({
        id,
        envelopeId,
        signerId,
        eventType: AuditEventType.SIGNATURE_CREATED,
        description: 'Document signed successfully',
        userId,
        userEmail: 'signer@example.com',
        ipAddress: ipAddress,
        userAgent: 'Chrome/91.0.4472.124',
        country: 'CA',
        metadata,
        createdAt
      });

      expect(event.getId().getValue()).toBe(id);
      expect(event.getEnvelopeId().getValue()).toBe(envelopeId);
      expect(event.getSignerId()?.getValue()).toBe(signerId);
      expect(event.getEventType()).toBe(AuditEventType.SIGNATURE_CREATED);
      expect(event.getDescription()).toBe('Document signed successfully');
      expect(event.getUserId()).toBe(userId);
      expect(event.getUserEmail()).toBe('signer@example.com');
      expect(event.getIpAddress()).toBe(ipAddress);
      expect(event.getUserAgent()).toBe('Chrome/91.0.4472.124');
      expect(event.getCountry()).toBe('CA');
      expect(event.getMetadata()).toEqual(metadata);
      expect(event.getCreatedAt()).toEqual(createdAt);
    });

    it('should create audit event with minimal properties', () => {
      const event = createAuditEventWithParams({
        eventType: AuditEventType.DOCUMENT_ACCESSED,
        description: 'Envelope accessed',
        signerId: undefined,
        userId: undefined,
        userEmail: undefined,
        ipAddress: undefined,
        userAgent: undefined,
        country: undefined,
        metadata: undefined
      });

      expect(event.getEventType()).toBe(AuditEventType.DOCUMENT_ACCESSED);
      expect(event.getDescription()).toBe('Envelope accessed');
      expect(event.getSignerId()).toBeUndefined();
      expect(event.getUserId()).toBeUndefined();
      expect(event.getUserEmail()).toBeUndefined();
      expect(event.getIpAddress()).toBeUndefined();
      expect(event.getUserAgent()).toBeUndefined();
      expect(event.getCountry()).toBeUndefined();
      expect(event.getMetadata()).toBeUndefined();
    });

    it('should create audit event without signer ID', () => {
      const event = createAuditEventWithParams({
        signerId: undefined,
        eventType: AuditEventType.ENVELOPE_CREATED,
        description: 'New envelope created'
      });

      expect(event.getSignerId()).toBeUndefined();
      expect(event.getEventType()).toBe('ENVELOPE_CREATED');
      expect(event.getDescription()).toBe('New envelope created');
    });
  });

  describe('Event Type Classification', () => {
    it('should identify signer events correctly', () => {
      const signerEvent = createAuditEventWithParams({
        signerId: TestUtils.generateUuid(),
        eventType: AuditEventType.SIGNATURE_CREATED,
        description: 'Signer started signing process'
      });

      expect(signerEvent.isSignerEvent()).toBe(true);
      expect(signerEvent.isEnvelopeEvent()).toBe(false);
    });

    it('should identify envelope events correctly', () => {
      const envelopeEvent = createAuditEventWithParams({
        signerId: undefined,
        eventType: AuditEventType.ENVELOPE_SENT,
        description: 'Envelope sent to signers'
      });

      expect(envelopeEvent.isSignerEvent()).toBe(false);
      expect(envelopeEvent.isEnvelopeEvent()).toBe(true);
    });

    it('should handle various signer event types', () => {
      const signerEventTypes = [
        AuditEventType.SIGNATURE_CREATED,
        AuditEventType.SIGNATURE_CREATED,
        AuditEventType.SIGNER_DECLINED,
        AuditEventType.DOCUMENT_ACCESSED,
        AuditEventType.CONSENT_GIVEN
      ];

      signerEventTypes.forEach(eventType => {
        const event = createAuditEventWithParams({
          signerId: TestUtils.generateUuid(),
          eventType,
          description: `Signer event: ${eventType}`
        });

        expect(event.isSignerEvent()).toBe(true);
        expect(event.getEventType()).toBe(eventType);
      });
    });

    it('should handle various envelope event types', () => {
      const envelopeEventTypes = [
        AuditEventType.ENVELOPE_CREATED,
        AuditEventType.ENVELOPE_SENT,
        AuditEventType.ENVELOPE_COMPLETED,
        AuditEventType.ENVELOPE_CANCELLED,
        AuditEventType.ENVELOPE_EXPIRED
      ];

      envelopeEventTypes.forEach(eventType => {
        const event = createAuditEventWithParams({
          signerId: undefined,
          eventType,
          description: `Envelope event: ${eventType}`
        });

        expect(event.isEnvelopeEvent()).toBe(true);
        expect(event.getEventType()).toBe(eventType);
      });
    });
  });

  describe('Event Age and Timing', () => {
    it('should calculate event age correctly', () => {
      const oneHourAgo = new Date(Date.now() - 3600000); // 1 hour ago
      const event = createAuditEventWithParams({
        createdAt: oneHourAgo
      });

      const age = event.getAge();
      expect(age).toBeGreaterThan(3599000); // Should be close to 1 hour in ms
      expect(age).toBeLessThan(3601000);
    });

    it('should identify recent events correctly', () => {
      const recentEvent = createAuditEventWithParams({
        createdAt: new Date(Date.now() - 300000) // 5 minutes ago
      });

      const oldEvent = createAuditEventWithParams({
        createdAt: new Date(Date.now() - 3600000) // 1 hour ago
      });

      expect(recentEvent.isRecent(600000)).toBe(true); // Within 10 minutes
      expect(recentEvent.isRecent(300001)).toBe(true); // Within 5 minutes + 1ms
      expect(recentEvent.isRecent(60000)).toBe(false); // Within 1 minute

      expect(oldEvent.isRecent(3600001)).toBe(true); // Within 1 hour + 1ms
      expect(oldEvent.isRecent(1800000)).toBe(false); // Within 30 minutes
    });

    it('should handle events created at exact time boundary', () => {
      const now = new Date();
      const event = createAuditEventWithParams({
        createdAt: now
      });

      expect(event.isRecent(1)).toBe(true); // 1ms margin for timing precision
      expect(event.isRecent(1)).toBe(true); // 1ms after
    });
  });

  describe('Event Summary', () => {
    it('should generate complete event summary', () => {
      const id = TestUtils.generateUuid();
      const envelopeId = TestUtils.generateUuid();
      const signerId = TestUtils.generateUuid();
      const userId = TestUtils.generateUuid();
      const createdAt = new Date('2024-01-01T10:00:00Z');
      const metadata = { 
        documentHash: 'abc123',
        signatureMethod: 'digital',
        location: 'New York'
      };

      const ipAddress = generateTestIpAddress();
      
      const event = createAuditEventWithParams({
        id,
        envelopeId,
        signerId,
        eventType: AuditEventType.SIGNATURE_CREATED,
        description: 'Document signed with digital signature',
        userId,
        userEmail: 'signer@example.com',
        ipAddress,
        userAgent: 'Firefox/89.0',
        country: 'US',
        metadata,
        createdAt
      });

      const summary = event.getSummary();

      expect(summary).toEqual({
        id,
        envelopeId,
        signerId,
        eventType: AuditEventType.SIGNATURE_CREATED,
        description: 'Document signed with digital signature',
        userId,
        userEmail: 'signer@example.com',
        ipAddress,
        userAgent: 'Firefox/89.0',
        country: 'US',
        createdAt,
        metadata
      });
    });

    it('should generate summary without optional fields', () => {
      const event = createAuditEventWithParams({
        signerId: undefined,
        userId: undefined,
        userEmail: undefined,
        ipAddress: undefined,
        userAgent: undefined,
        country: undefined,
        metadata: undefined
      });

      const summary = event.getSummary();

      expect(summary.signerId).toBeUndefined();
      expect(summary.userId).toBeUndefined();
      expect(summary.userEmail).toBeUndefined();
      expect(summary.ipAddress).toBeUndefined();
      expect(summary.userAgent).toBeUndefined();
      expect(summary.country).toBeUndefined();
      expect(summary.metadata).toBeUndefined();
    });

    it('should include all required fields in summary', () => {
      const event = createAuditEventWithParams({
        eventType: AuditEventType.ENVELOPE_CREATED,
        description: 'New envelope created by user'
      });

      const summary = event.getSummary();

      expect(summary.id).toBeDefined();
      expect(summary.envelopeId).toBeDefined();
      expect(summary.eventType).toBe('ENVELOPE_CREATED');
      expect(summary.description).toBe('New envelope created by user');
      expect(summary.createdAt).toBeDefined();
    });
  });

  describe('Equality', () => {
    it('should return true for equal audit events', () => {
      const id = TestUtils.generateUuid();
      const event1 = createAuditEventWithParams({ id });
      const event2 = createAuditEventWithParams({ id });

      expect(event1.equals(event2)).toBe(true);
    });

    it('should return false for different audit events', () => {
      const event1 = createAuditEventWithParams({ id: TestUtils.generateUuid() });
      const event2 = createAuditEventWithParams({ id: TestUtils.generateUuid() });

      expect(event1.equals(event2)).toBe(false);
    });

    it('should return false when comparing with different object types', () => {
      const event = createAuditEventWithParams({});
      const otherObject = { id: 'different-id', differentProperty: 'value' };

      expect(event.equals(otherObject as any)).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle events with very long descriptions', () => {
      const longDescription = 'This is a very long description that contains detailed information about the audit event. It includes multiple sentences and provides comprehensive context about what happened during the signature process. The description may contain technical details, user actions, system responses, and other relevant information for audit purposes.';
      
      const event = createAuditEventWithParams({
        description: longDescription
      });

      expect(event.getDescription()).toBe(longDescription);
      expect(event.getDescription().length).toBeGreaterThan(200);
    });

    it('should handle events with complex metadata', () => {
      const complexMetadata = {
        documentInfo: {
          name: 'Contract.pdf',
          size: 1024000,
          hash: 'sha256:abc123def456'
        },
        userInfo: {
          role: 'signer',
          permissions: ['read', 'sign'],
          sessionId: 'sess-123'
        },
        systemInfo: {
          version: '1.2.3',
          environment: 'production',
          serverId: 'server-001'
        },
        customFields: {
          department: 'Legal',
          project: 'Q1-Contracts',
          priority: 'high'
        }
      };

      const event = createAuditEventWithParams({
        metadata: complexMetadata
      });

      expect(event.getMetadata()).toEqual(complexMetadata);
      expect((event.getMetadata() as any)?.documentInfo?.name).toBe('Contract.pdf');
      expect((event.getMetadata() as any)?.userInfo?.role).toBe('signer');
    });

    it('should handle events with special characters in text fields', () => {
      const specialDescription = 'Event with special chars: @#$%^&*()_+-=[]{}|;:,.<>? and unicode: 中文 العربية';
      const specialUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
      
      const event = createAuditEventWithParams({
        description: specialDescription,
        userAgent: specialUserAgent
      });

      expect(event.getDescription()).toBe(specialDescription);
      expect(event.getUserAgent()).toBe(specialUserAgent);
    });

    it('should handle events with IPv6 addresses', () => {
      const ipv6Address = TEST_CONSTANTS.IPV6_TEST_ADDRESS;
      
      const event = createAuditEventWithParams({
        ipAddress: ipv6Address
      });

      expect(event.getIpAddress()).toBe(ipv6Address);
    });

    it('should handle events with future timestamps', () => {
      const futureTimestamp = new Date(Date.now() + 86400000); // 1 day in the future
      
      const event = createAuditEventWithParams({
        createdAt: futureTimestamp
      });

      expect(event.getCreatedAt()).toEqual(futureTimestamp);
      expect(event.getAge()).toBeLessThan(0); // Negative age for future timestamps
    });

    it('should handle events with very old timestamps', () => {
      const oldTimestamp = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // 1 year ago
      
      const event = createAuditEventWithParams({
        createdAt: oldTimestamp
      });

      expect(event.getCreatedAt()).toEqual(oldTimestamp);
      expect(event.getAge()).toBeGreaterThan(365 * 24 * 60 * 60 * 1000 - 1000); // Close to 1 year
    });

    it('should handle events with empty metadata object', () => {
      const event = createAuditEventWithParams({
        metadata: {}
      });

      expect(event.getMetadata()).toEqual({});
      expect(event.getMetadata()).not.toBeUndefined();
    });

    it('should handle events with null-like metadata values', () => {
      const metadataWithNulls = {
        field1: null,
        field2: undefined,
        field3: '',
        field4: 0,
        field5: false
      };

      const event = createAuditEventWithParams({
        metadata: metadataWithNulls
      });

      expect(event.getMetadata()).toEqual(metadataWithNulls);
    });
  });

  describe('JSON Serialization', () => {
    it('should serialize to JSON with all fields', () => {
      const event = createAuditEventWithParams({
        description: 'Test event',
        userId: 'user-123',
        userEmail: 'user@example.com',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        country: 'US',
        metadata: { key: 'value' }
      });

      const json = event.toJSON();

      expect(json.id).toBe(event.getId().getValue());
      expect(json.envelopeId).toBe(event.getEnvelopeId().getValue());
      expect(json.signerId).toBe(event.getSignerId()?.getValue());
      expect(json.eventType).toBe(event.getEventType());
      expect(json.description).toBe('Test event');
      expect(json.userId).toBe('user-123');
      expect(json.userEmail).toBe('user@example.com');
      expect(json.ipAddress).toBe('192.168.1.100');
      expect(json.userAgent).toBe('Mozilla/5.0');
      expect(json.country).toBe('US');
      expect(json.metadata).toEqual({ key: 'value' });
      expect(json.createdAt).toBe(event.getCreatedAt().toISOString());
    });

    it('should serialize to JSON with minimal fields', () => {
      const event = createAuditEventWithParams({
        description: 'Minimal event'
      });

      const json = event.toJSON();

      expect(json.id).toBe(event.getId().getValue());
      expect(json.envelopeId).toBe(event.getEnvelopeId().getValue());
      expect(json.signerId).toBeUndefined();
      expect(json.eventType).toBe(event.getEventType());
      expect(json.description).toBe('Minimal event');
      expect(json.userId).toBeUndefined();
      expect(json.userEmail).toBeUndefined();
      expect(json.ipAddress).toBeUndefined();
      expect(json.userAgent).toBeUndefined();
      expect(json.country).toBeUndefined();
      expect(json.metadata).toBeUndefined();
      expect(json.createdAt).toBe(event.getCreatedAt().toISOString());
    });
  });

  describe('Static Methods', () => {
    describe('create', () => {
      it('should create event with trimmed description', () => {
        const event = SignatureAuditEvent.create({
          envelopeId: new EnvelopeId(TestUtils.generateUuid()),
          eventType: AuditEventType.ENVELOPE_CREATED,
          description: '  Test description  ',
          userId: 'user-123'
        });

        expect(event.getDescription()).toBe('Test description');
        expect(event.getUserId()).toBe('user-123');
        expect(event.getCreatedAt()).toBeInstanceOf(Date);
      });

      it('should create event with empty description after trimming', () => {
        const event = SignatureAuditEvent.create({
          envelopeId: new EnvelopeId(TestUtils.generateUuid()),
          eventType: AuditEventType.ENVELOPE_CREATED,
          description: '   ',
          userId: 'user-123'
        });

        expect(event.getDescription()).toBe('');
        expect(event.getUserId()).toBe('user-123');
      });

      it('should create event with undefined description', () => {
        const event = SignatureAuditEvent.create({
          envelopeId: new EnvelopeId(TestUtils.generateUuid()),
          eventType: AuditEventType.ENVELOPE_CREATED,
          description: undefined as any,
          userId: 'user-123'
        });

        expect(event.getDescription()).toBe('');
        expect(event.getUserId()).toBe('user-123');
      });
    });

    describe('fromPersistence', () => {
      it('should create event from persistence data with all fields', () => {
        const data = {
          id: TestUtils.generateUuid(),
          envelopeId: TestUtils.generateUuid(),
          signerId: TestUtils.generateUuid(),
          eventType: 'ENVELOPE_CREATED',
          description: 'Test event',
          userId: 'user-123',
          userEmail: 'user@example.com',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0',
          country: 'US',
          metadata: { key: 'value' },
          createdAt: new Date('2024-01-01T12:00:00.000Z')
        };

        const event = SignatureAuditEvent.fromPersistence(data);

        expect(event.getId().getValue()).toBe(data.id);
        expect(event.getEnvelopeId().getValue()).toBe(data.envelopeId);
        expect(event.getSignerId()?.getValue()).toBe(data.signerId);
        expect(event.getEventType()).toBe(data.eventType);
        expect(event.getDescription()).toBe(data.description);
        expect(event.getUserId()).toBe(data.userId);
        expect(event.getUserEmail()).toBe(data.userEmail);
        expect(event.getIpAddress()).toBe(data.ipAddress);
        expect(event.getUserAgent()).toBe(data.userAgent);
        expect(event.getCountry()).toBe(data.country);
        expect(event.getMetadata()).toEqual(data.metadata);
        expect(event.getCreatedAt()).toEqual(data.createdAt);
      });

      it('should handle null values in persistence data', () => {
        const data = {
          id: TestUtils.generateUuid(),
          envelopeId: TestUtils.generateUuid(),
          signerId: null,
          eventType: 'ENVELOPE_CREATED',
          description: 'Test event',
          userId: null,
          userEmail: null,
          ipAddress: null,
          userAgent: null,
          country: null,
          metadata: null,
          createdAt: '2024-01-01T12:00:00.000Z'
        };

        const event = SignatureAuditEvent.fromPersistence(data);

        expect(event.getSignerId()).toBeUndefined();
        expect(event.getUserId()).toBeUndefined();
        expect(event.getUserEmail()).toBeUndefined();
        expect(event.getIpAddress()).toBeUndefined();
        expect(event.getUserAgent()).toBeUndefined();
        expect(event.getCountry()).toBeUndefined();
        expect(event.getMetadata()).toBeUndefined();
        expect(event.getCreatedAt()).toEqual(new Date('2024-01-01T12:00:00.000Z'));
      });

      it('should handle string dates in persistence data', () => {
        const data = {
          id: TestUtils.generateUuid(),
          envelopeId: TestUtils.generateUuid(),
          signerId: undefined,
          eventType: 'ENVELOPE_CREATED',
          description: 'Test event',
          userId: undefined,
          userEmail: undefined,
          ipAddress: undefined,
          userAgent: undefined,
          country: undefined,
          metadata: undefined,
          createdAt: '2024-01-01T12:00:00.000Z'
        };

        const event = SignatureAuditEvent.fromPersistence(data);

        expect(event.getCreatedAt()).toEqual(new Date('2024-01-01T12:00:00.000Z'));
      });

      it('should handle undefined description in persistence data', () => {
        const data = {
          id: TestUtils.generateUuid(),
          envelopeId: TestUtils.generateUuid(),
          signerId: undefined,
          eventType: 'ENVELOPE_CREATED',
          description: undefined as any,
          userId: undefined,
          userEmail: undefined,
          ipAddress: undefined,
          userAgent: undefined,
          country: undefined,
          metadata: undefined,
          createdAt: '2024-01-01T12:00:00.000Z'
        };

        const event = SignatureAuditEvent.fromPersistence(data);

        expect(event.getDescription()).toBe('');
        expect(event.getCreatedAt()).toEqual(new Date('2024-01-01T12:00:00.000Z'));
      });
    });
  });
});
