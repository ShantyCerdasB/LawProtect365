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
const invitationHistory = new Map<string, Set<string>>();

/**
 * Track all events published to outbox for verification
 * Structure: Map<envelopeId, Array<event>>
 */
const publishedEvents = new Map<string, any[]>();

/**
 * Mock OutboxRepository with duplicate prevention
 * 
 * @description Provides comprehensive outbox mocking that simulates real outbox behavior
 * with duplicate invitation prevention. The mock tracks invitation history per envelope
 * and prevents duplicate invitations to the same signer.
 */
jest.mock('@lawprotect/shared-ts', () => ({
  ...jest.requireActual('@lawprotect/shared-ts'),
  OutboxRepository: jest.fn().mockImplementation(() => ({
    save: jest.fn().mockImplementation((event: any, id: string) => {
      const envelopeId = event.detail?.envelopeId;
      const signerId = event.detail?.signerId;
      const eventType = event.detail?.eventType;
      
      if (!envelopeId || !signerId) {
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
        throw new Error(`Duplicate invitation for signer ${signerId} in envelope ${envelopeId}`);
      }
      
      // Track invitation
      if (eventType === 'ENVELOPE_INVITATION') {
        invitationHistory.get(envelopeId)!.add(signerId);
      }
      
      // Track all events
      publishedEvents.get(envelopeId)!.push({
        ...event,
        id,
        timestamp: new Date().toISOString()
      });
      
      return Promise.resolve();
    }),
    
    markAsDispatched: jest.fn().mockResolvedValue(undefined),
    markAsFailed: jest.fn().mockResolvedValue(undefined),
    getPendingEvents: jest.fn().mockResolvedValue([]),
    deleteEvent: jest.fn().mockResolvedValue(undefined)
  }))
}));

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
