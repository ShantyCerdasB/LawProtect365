import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { IntegrationEventFactory } from '../../../../../src/infrastructure/factories/events/IntegrationEventFactory';
import { EventNames } from '../../../../../src/domain/enums/EventNames';
import { ParticipantRole } from '@prisma/client';

// Mock the shared-ts makeEvent function
jest.mock('@lawprotect/shared-ts', () => ({
  makeEvent: jest.fn((eventName, payload) => ({
    name: eventName,
    payload
  })),
  NetworkSecurityContext: {}
}));

describe('IntegrationEventFactory', () => {
  let factory: IntegrationEventFactory;

  beforeEach(() => {
    jest.clearAllMocks();
    factory = new IntegrationEventFactory();
  });

  describe('envelopeInvitation', () => {
    it('should create ENVELOPE_INVITATION event with all required fields', () => {
      const envelopeId = 'envelope-123';
      const signerId = 'signer-456';
      const userId = 'user-789';
      
      const envelope = {
        getId: () => ({ getValue: () => envelopeId }),
        getTitle: () => 'Test Document',
        getCreatedBy: () => userId
      };
      const signer = {
        getId: () => ({ getValue: () => signerId }),
        getEmail: () => ({ getValue: () => 'signer@example.com' }),
        getFullName: () => 'John Signer'
      };
      
      const args = {
        envelope,
        signer,
        message: 'Please sign this document',
        invitationToken: 'token-123',
        sentAtISO: '2024-01-01T10:00:00Z'
      };

      const result = factory.envelopeInvitation(args as any);

      expect(result.name).toBe(EventNames.ENVELOPE_INVITATION);
      expect(result.payload).toEqual({
        envelopeId,
        signerId,
        signerEmail: 'signer@example.com',
        signerName: 'John Signer',
        message: 'Please sign this document',
        invitationToken: 'token-123',
        metadata: {
          envelopeTitle: 'Test Document',
          envelopeId,
          sentBy: userId,
          sentAt: '2024-01-01T10:00:00Z'
        }
      });
    });

    it('should create ENVELOPE_INVITATION event without optional invitationToken', () => {
      const envelopeId = 'envelope-123';
      const signerId = 'signer-456';
      const userId = 'user-789';
      
      const envelope = {
        getId: () => ({ getValue: () => envelopeId }),
        getTitle: () => 'Test Document',
        getCreatedBy: () => userId
      };
      const signer = {
        getId: () => ({ getValue: () => signerId }),
        getEmail: () => ({ getValue: () => 'signer@example.com' }),
        getFullName: () => 'John Signer'
      };
      
      const args = {
        envelope,
        signer,
        message: 'Please sign this document',
        sentAtISO: '2024-01-01T10:00:00Z'
      };

      const result = factory.envelopeInvitation(args as any);

      expect(result.name).toBe(EventNames.ENVELOPE_INVITATION);
      expect(result.payload.invitationToken).toBeUndefined();
    });

    it('should handle signer with missing email', () => {
      const envelopeId = 'envelope-123';
      const signerId = 'signer-456';
      const userId = 'user-789';
      
      const envelope = {
        getId: () => ({ getValue: () => envelopeId }),
        getTitle: () => 'Test Document',
        getCreatedBy: () => userId
      };
      const signer = {
        getId: () => ({ getValue: () => signerId }),
        getEmail: () => undefined,
        getFullName: () => 'John Signer'
      };
      
      const args = {
        envelope,
        signer,
        message: 'Please sign this document',
        sentAtISO: '2024-01-01T10:00:00Z'
      };

      const result = factory.envelopeInvitation(args as any);

      expect(result.payload.signerEmail).toBeUndefined();
    });
  });

  describe('viewerInvitation', () => {
    it('should create DOCUMENT_VIEW_INVITATION event with all required fields', () => {
      const envelopeId = 'envelope-123';
      const userId = 'user-789';
      
      const envelope = {
        getId: () => ({ getValue: () => envelopeId }),
        getTitle: () => 'Test Document',
        getCreatedBy: () => userId
      };
      
      const args = {
        envelope,
        email: 'viewer@example.com',
        fullName: 'Jane Viewer',
        message: 'You can view this document',
        token: 'viewer-token-123',
        expiresAtISO: '2024-01-02T10:00:00Z',
        sentAtISO: '2024-01-01T10:00:00Z'
      };

      const result = factory.viewerInvitation(args as any);

      expect(result.name).toBe(EventNames.DOCUMENT_VIEW_INVITATION);
      expect(result.payload).toEqual({
        envelopeId,
        viewerEmail: 'viewer@example.com',
        viewerName: 'Jane Viewer',
        message: 'You can view this document',
        invitationToken: 'viewer-token-123',
        expiresAt: '2024-01-02T10:00:00Z',
        metadata: {
          envelopeTitle: 'Test Document',
          envelopeId,
          sentBy: userId,
          sentAt: '2024-01-01T10:00:00Z',
          participantRole: ParticipantRole.VIEWER
        }
      });
    });
  });

  describe('signerDeclined', () => {
    it('should create SIGNER_DECLINED event with all required fields', () => {
      const envelopeId = 'envelope-123';
      const signerId = 'signer-456';
      const userId = 'user-789';
      
      const envelope = {
        getId: () => ({ getValue: () => envelopeId }),
        getTitle: () => 'Test Document',
        getCreatedBy: () => userId
      };
      const signer = {
        getId: () => ({ getValue: () => signerId }),
        getEmail: () => ({ getValue: () => 'signer@example.com' }),
        getFullName: () => 'John Signer'
      };
      
      const args = {
        envelope,
        signer,
        reason: 'I cannot sign this document',
        whenISO: '2024-01-01T10:00:00Z',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        country: 'US'
      };

      const result = factory.signerDeclined(args as any);

      expect(result.name).toBe(EventNames.SIGNER_DECLINED);
      expect(result.payload).toEqual({
        envelopeId,
        signerId,
        signerEmail: 'signer@example.com',
        signerName: 'John Signer',
        declineReason: 'I cannot sign this document',
        metadata: {
          envelopeTitle: 'Test Document',
          envelopeId,
          declinedAt: '2024-01-01T10:00:00Z',
          declinedBy: 'John Signer',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          country: 'US'
        }
      });
    });

    it('should handle signer with missing fullName and email in declinedBy', () => {
      const envelopeId = 'envelope-123';
      const signerId = 'signer-456';
      const userId = 'user-789';
      
      const envelope = {
        getId: () => ({ getValue: () => envelopeId }),
        getTitle: () => 'Test Document',
        getCreatedBy: () => userId
      };
      const signer = {
        getId: () => ({ getValue: () => signerId }),
        getEmail: () => undefined,
        getFullName: () => undefined
      };
      
      const args = {
        envelope,
        signer,
        reason: 'I cannot sign this document',
        whenISO: '2024-01-01T10:00:00Z',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        country: 'US'
      };

      const result = factory.signerDeclined(args as any);

      expect(result.payload.metadata.declinedBy).toBe('Unknown');
    });

    it('should use email as fallback for declinedBy when fullName is missing', () => {
      const envelopeId = 'envelope-123';
      const signerId = 'signer-456';
      const userId = 'user-789';
      
      const envelope = {
        getId: () => ({ getValue: () => envelopeId }),
        getTitle: () => 'Test Document',
        getCreatedBy: () => userId
      };
      const signer = {
        getId: () => ({ getValue: () => signerId }),
        getEmail: () => ({ getValue: () => 'signer@example.com' }),
        getFullName: () => undefined
      };
      
      const args = {
        envelope,
        signer,
        reason: 'I cannot sign this document',
        whenISO: '2024-01-01T10:00:00Z',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        country: 'US'
      };

      const result = factory.signerDeclined(args as any);

      expect(result.payload.metadata.declinedBy).toBe('signer@example.com');
    });
  });

  describe('envelopeCancelled', () => {
    it('should create ENVELOPE_CANCELLED event with all required fields', () => {
      const envelopeId = 'envelope-123';
      const userId = 'user-789';
      const cancelledByUserId = 'canceller-456';
      
      const envelope = {
        getId: () => ({ getValue: () => envelopeId }),
        getTitle: () => 'Test Document',
        getCreatedBy: () => userId,
        getStatus: () => ({ getValue: () => 'IN_PROGRESS' })
      };
      
      const args = {
        envelope,
        cancelledByUserId,
        whenISO: '2024-01-01T10:00:00Z',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        country: 'US'
      };

      const result = factory.envelopeCancelled(args as any);

      expect(result.name).toBe(EventNames.ENVELOPE_CANCELLED);
      expect(result.payload).toEqual({
        envelopeId,
        cancelledByUserId,
        envelopeTitle: 'Test Document',
        envelopeStatus: 'IN_PROGRESS',
        metadata: {
          envelopeId,
          cancelledAt: '2024-01-01T10:00:00Z',
          cancelledBy: cancelledByUserId,
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          country: 'US'
        }
      });
    });
  });

  describe('reminderNotification', () => {
    it('should create REMINDER_NOTIFICATION event with all required fields', () => {
      const envelopeId = 'envelope-123';
      const signerId = 'signer-456';
      
      const args = {
        envelopeId,
        signerId,
        message: 'Please remember to sign this document',
        reminderCount: 2,
        whenISO: '2024-01-01T10:00:00Z'
      };

      const result = factory.reminderNotification(args);

      expect(result.name).toBe(EventNames.REMINDER_NOTIFICATION);
      expect(result.payload).toEqual({
        envelopeId,
        signerId,
        message: 'Please remember to sign this document',
        reminderCount: 2,
        timestamp: '2024-01-01T10:00:00Z',
        source: 'signature-service',
        version: '1.0'
      });
    });

    it('should handle reminder count of 0', () => {
      const envelopeId = 'envelope-123';
      const signerId = 'signer-456';
      
      const args = {
        envelopeId,
        signerId,
        message: 'First reminder to sign this document',
        reminderCount: 0,
        whenISO: '2024-01-01T10:00:00Z'
      };

      const result = factory.reminderNotification(args);

      expect(result.payload.reminderCount).toBe(0);
    });

    it('should handle high reminder count', () => {
      const envelopeId = 'envelope-123';
      const signerId = 'signer-456';
      
      const args = {
        envelopeId,
        signerId,
        message: 'Final reminder to sign this document',
        reminderCount: 10,
        whenISO: '2024-01-01T10:00:00Z'
      };

      const result = factory.reminderNotification(args);

      expect(result.payload.reminderCount).toBe(10);
    });
  });
});