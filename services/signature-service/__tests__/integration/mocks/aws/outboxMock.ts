/**
 * @fileoverview OutboxMock - Enhanced outbox mock with duplicate invitation prevention
 * @summary Provides comprehensive outbox mocking that tracks invitation history
 * @description Mock implementation of OutboxRepository that provides realistic behavior
 * for event publishing with duplicate invitation prevention. The mock tracks
 * invitation history per envelope to prevent duplicate invitations to the same signer.
 */

// Using global jest - no import needed in setupFiles

/**
 * Track invitation history to prevent duplicates
 * Structure: Map<envelopeId, Set<signerId>>
 */
export const invitationHistory = new Map<string, Set<string>>();

/**
 * Track all events published to outbox for verification
 * Structure: Map<envelopeId, Array<event>>
 */
export const publishedEvents = new Map<string, any[]>();

/**
 * Mock OutboxRepository with duplicate prevention
 * 
 * @description Provides comprehensive outbox mocking that simulates real outbox behavior
 * with duplicate invitation prevention. The mock tracks invitation history per envelope
 * and prevents duplicate invitations to the same signer.
 */
console.log('🔧 Loading OutboxRepository mock...');
jest.mock('@lawprotect/shared-ts', () => {
  console.log('🔧 OutboxRepository mock being applied...');
  const actual = jest.requireActual('@lawprotect/shared-ts');
  console.log('🔧 Actual shared-ts modules:', Object.keys(actual));
  
  return {
    ...actual,
    OutboxRepository: jest.fn().mockImplementation(() => {
      console.log('🔧 OutboxRepository mock instance created');
      return {
    save: jest.fn().mockImplementation((record: any, id: string) => {
      console.log('🔍 OutboxRepository.save called with:', {
        recordType: typeof record,
        recordKeys: record ? Object.keys(record) : 'null',
        id,
        hasPayload: !!record?.payload,
        hasDetail: !!record?.detail,
        recordStringified: JSON.stringify(record, null, 2)
      });

      // Handle OutboxRecord structure (from makeEvent)
      let envelopeId: string | undefined;
      let signerId: string | undefined;
      let eventType: string | undefined;

      if (record?.payload) {
        // New structure: data is in record.payload
        envelopeId = record.payload.envelopeId;
        signerId = record.payload.signerId;
        eventType = record.type; // Event type is in record.type
        console.log('🔍 Extracted from payload:', { envelopeId, signerId, eventType });
      } else if (record?.detail) {
        // Old structure: data is in record.detail (fallback)
        envelopeId = record.detail.envelopeId;
        signerId = record.detail.signerId;
        eventType = record.detail.eventType;
        console.log('🔍 Extracted from detail (fallback):', { envelopeId, signerId, eventType });
      } else {
        console.log('⚠️ No payload or detail found in record, skipping');
        console.log('⚠️ Full record structure:', record);
        return Promise.resolve();
      }
      
      if (!envelopeId || !signerId) {
        console.log('⚠️ Missing envelopeId or signerId, skipping');
        console.log('⚠️ envelopeId:', envelopeId, 'signerId:', signerId);
        return Promise.resolve();
      }
      
      // Initialize tracking for this envelope if not exists
      if (!invitationHistory.has(envelopeId)) {
        invitationHistory.set(envelopeId, new Set());
      }
      
      if (!publishedEvents.has(envelopeId)) {
        publishedEvents.set(envelopeId, []);
      }
      
      // Check for duplicate invitation
      if (eventType === 'ENVELOPE_INVITATION' && invitationHistory.get(envelopeId)!.has(signerId)) {
        console.log('❌ Duplicate invitation detected:', { envelopeId, signerId });
        throw new Error(`Duplicate invitation for signer ${signerId} in envelope ${envelopeId}`);
      }
      
      // Track invitation
      if (eventType === 'ENVELOPE_INVITATION') {
        invitationHistory.get(envelopeId)!.add(signerId);
        console.log('✅ Invitation tracked:', { envelopeId, signerId });
      }
      
      // Track all events
      publishedEvents.get(envelopeId)!.push({
        ...record,
        id,
        timestamp: new Date().toISOString()
      });
      
      console.log('✅ OutboxRepository.save completed successfully');
      return Promise.resolve();
    }),
    
    markAsDispatched: jest.fn().mockResolvedValue(undefined),
    markAsFailed: jest.fn().mockResolvedValue(undefined),
    getPendingEvents: jest.fn().mockResolvedValue([]),
    deleteEvent: jest.fn().mockResolvedValue(undefined)
      };
    })
  };
});

/**
 * Helper functions for test verification
 */
export const outboxMockHelpers = {
  /**
   * Get invitation history for an envelope
   * @param envelopeId - The envelope ID
   * @returns Set of signer IDs who received invitations
   */
  getInvitationHistory: (envelopeId: string): Set<string> => {
    return invitationHistory.get(envelopeId) || new Set();
  },
  
  /**
   * Get all events published for an envelope
   * @param envelopeId - The envelope ID
   * @returns Array of published events
   */
  getPublishedEvents: (envelopeId: string): any[] => {
    return publishedEvents.get(envelopeId) || [];
  },
  
  /**
   * Get invitation events for an envelope
   * @param envelopeId - The envelope ID
   * @returns Array of invitation events
   */
  getInvitationEvents: (envelopeId: string): any[] => {
    const events = publishedEvents.get(envelopeId) || [];
    return events.filter(event => event.detail?.eventType === 'ENVELOPE_INVITATION');
  },
  
  /**
   * Check if signer received invitation
   * @param envelopeId - The envelope ID
   * @param signerId - The signer ID
   * @returns True if signer received invitation
   */
  hasReceivedInvitation: (envelopeId: string, signerId: string): boolean => {
    return invitationHistory.get(envelopeId)?.has(signerId) || false;
  },
  
  /**
   * Clear all tracking data (for test cleanup)
   */
  clearAll: (): void => {
    invitationHistory.clear();
    publishedEvents.clear();
  },
  
  /**
   * Clear tracking data for specific envelope
   * @param envelopeId - The envelope ID
   */
  clearEnvelope: (envelopeId: string): void => {
    invitationHistory.delete(envelopeId);
    publishedEvents.delete(envelopeId);
  }
};

console.log('🔧 Outbox mock loaded - duplicate invitation prevention enabled');
