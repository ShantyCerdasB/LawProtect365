/**
 * @fileoverview auditHelper - Audit event verification for integration tests
 * @summary Provides audit event verification and validation methods
 * @description This module contains helper methods for verifying audit events
 * in integration tests, including external user access tracking and event validation.
 */

import { DatabaseHelper } from './databaseHelper';

/**
 * Audit helper for integration tests
 */
export class AuditHelper {
  private databaseHelper: DatabaseHelper;

  constructor() {
    this.databaseHelper = new DatabaseHelper();
  }

  /**
   * Verify audit event was created for external user access
   * @param envelopeId - The envelope ID
   * @param eventType - The expected event type
   * @param signerId - The signer ID
   * @returns Promise that resolves when verification is complete
   */
  async verifyAuditEvent(envelopeId: string, eventType: string, signerId?: string): Promise<void> {
    const auditEvents = await this.databaseHelper.getAuditEventsFromDatabase(envelopeId);
    
    const matchingEvent = auditEvents.find(event => 
      event.eventType === eventType && 
      (!signerId || event.signerId === signerId)
    );
    
    if (!matchingEvent) {
      throw new Error(`Audit event not found: ${eventType} for envelope ${envelopeId}`);
    }
    
    // Verify audit event has required fields for external user access
    if (eventType === 'DOCUMENT_ACCESSED') {
      expect(matchingEvent.userId).toBeDefined(); // Should be email for external users
      expect(matchingEvent.userEmail).toBeDefined();
      expect(matchingEvent.ipAddress).toBeDefined();
      expect(matchingEvent.userAgent).toBeDefined();
      expect(matchingEvent.metadata).toBeDefined();
      
      const metadata = matchingEvent.metadata as any;
      expect(metadata.accessType).toBe('EXTERNAL');
      expect(metadata.invitationTokenId).toBeDefined();
      expect(metadata.externalUserIdentifier).toBeDefined(); // email_fullName format
    }
  }
}
