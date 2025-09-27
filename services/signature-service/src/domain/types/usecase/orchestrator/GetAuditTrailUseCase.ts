/**
 * @fileoverview GetAuditTrailUseCase Types - Input and result types for GetAuditTrailUseCase
 * @summary Type definitions for audit trail retrieval operations
 * @description This module contains the input and result type definitions for the
 * GetAuditTrailUseCase, including request parameters, response structure, and
 * audit event information for audit trail retrieval operations in signature envelopes.
 */

import { EnvelopeId } from '../../../value-objects/EnvelopeId';
import { AuditEventType } from '../../../enums/AuditEventType';

/**
 * Input parameters for retrieving audit trail from an envelope
 * @param envelopeId - The unique identifier of the envelope
 * @param userId - The user identifier requesting the audit trail
 */
export interface GetAuditTrailInput {
  envelopeId: EnvelopeId;
  userId: string;
}

/**
 * Result structure for successful audit trail retrieval operation
 * @param envelopeId - The envelope identifier
 * @param events - Array of audit events with complete information
 */
export interface GetAuditTrailResult {
  envelopeId: string;
  events: Array<{
    id: string;
    eventType: AuditEventType;
    description: string;
    userEmail?: string;
    userName?: string;
    createdAt: Date;
    metadata?: Record<string, any>;
  }>;
}
