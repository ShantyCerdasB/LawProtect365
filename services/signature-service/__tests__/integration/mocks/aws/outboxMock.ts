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
// ✅ MOCK DEL OUTBOX REPOSITORY (PATRÓN SIMPLIFICADO)
// Nota: Este mock se aplicará solo cuando se use localmente en los tests

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
  },

  /**
   * Clear all mock data to prevent test interference
   */
  clearAllMockData: (): void => {
    invitationHistory.clear();
    publishedEvents.clear();
  }
};
