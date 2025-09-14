/**
 * @fileoverview EnvelopeEventRules - Event generation and validation rules for envelope operations
 * @summary Defines workflow rules for event generation, timing, and data validation for notification service
 * @description Contains validation rules for envelope event generation including event type validation,
 * timing validation, and data validation for the notification service integration.
 */

import { EnvelopeStatus } from '@/domain/enums/EnvelopeStatus';
import { EnvelopeOperation } from '@/domain/enums/EnvelopeOperation';
import { AuditEventType } from '@/domain/enums/AuditEventType';
import { SigningOrder } from '@/domain/value-objects/SigningOrder';
import { Envelope } from '@/domain/entities/Envelope';
import { WorkflowTimingConfig, WorkflowEventData } from '@/domain/types/WorkflowTypes';
import { diffMinutes } from '@lawprotect/shared-ts';
import { eventGenerationFailed } from '@/signature-errors';
import { validateSigningOrderWorkflow } from './EnvelopeSigningOrderRules';
import { validateWorkflowTiming, validateExpirationWorkflow } from './EnvelopeTimingRules';

/**
 * Validates workflow event generation for notification service
 * @param envelope - The envelope for which to generate event
 * @param eventType - The type of event to generate
 * @param metadata - Additional metadata for the event
 * @throws {SignatureError} When event generation is invalid
 * @returns WorkflowEventData
 */
export function validateEventGeneration(
  envelope: Envelope, 
  eventType: AuditEventType, 
  metadata?: Record<string, any>
): WorkflowEventData {
  try {
    const eventData: WorkflowEventData = {
      envelopeId: envelope.getId().toString(),
      eventType,
      timestamp: new Date(),
      metadata: {
        envelopeStatus: envelope.getStatus(),
        signerCount: envelope.getSigners().length,
        ...metadata
      }
    };
    
    // Validate event type is appropriate for current envelope state
    validateEventTypeForState(envelope, eventType);
    
    return eventData;
  } catch (error) {
    throw eventGenerationFailed(`Failed to generate workflow event: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validates that an event type is appropriate for the current envelope state
 * @param envelope - The envelope to validate event type for
 * @param eventType - The event type to validate
 * @throws {SignatureError} When event type is inappropriate for current state
 * @returns void
 */
export function validateEventTypeForState(envelope: Envelope, eventType: AuditEventType): void {
  const currentStatus = envelope.getStatus();
  
  const validEventTypes: Record<EnvelopeStatus, AuditEventType[]> = {
    [EnvelopeStatus.DRAFT]: [
      AuditEventType.ENVELOPE_CREATED,
      AuditEventType.SIGNER_ADDED,
      AuditEventType.SIGNER_REMOVED
    ],
    [EnvelopeStatus.SENT]: [
      AuditEventType.ENVELOPE_SENT,
      AuditEventType.SIGNER_INVITED,
      AuditEventType.DOCUMENT_ACCESSED
    ],
    [EnvelopeStatus.IN_PROGRESS]: [
      AuditEventType.SIGNER_SIGNED,
      AuditEventType.SIGNATURE_CREATED,
      AuditEventType.CONSENT_GIVEN,
      AuditEventType.DOCUMENT_ACCESSED,
      AuditEventType.DOCUMENT_DOWNLOADED
    ],
    [EnvelopeStatus.READY_FOR_SIGNATURE]: [
      AuditEventType.SIGNER_SIGNED,
      AuditEventType.SIGNATURE_CREATED,
      AuditEventType.CONSENT_GIVEN
    ],
    [EnvelopeStatus.COMPLETED]: [
      AuditEventType.ENVELOPE_COMPLETED,
      AuditEventType.DOCUMENT_DOWNLOADED
    ],
    [EnvelopeStatus.EXPIRED]: [
      AuditEventType.ENVELOPE_EXPIRED
    ],
    [EnvelopeStatus.DECLINED]: [
      AuditEventType.ENVELOPE_DECLINED,
      AuditEventType.SIGNER_DECLINED
    ]
  };
  
  const allowedEvents = validEventTypes[currentStatus] || [];
  
  if (!allowedEvents.includes(eventType)) {
    throw eventGenerationFailed(
      `Event type ${eventType} is not valid for envelope status ${currentStatus}. Valid events: ${allowedEvents.join(', ')}`
    );
  }
}

/**
 * Validates event timing for workflow operations
 * @param _envelope - The envelope for which to validate event timing
 * @param _eventType - The type of event
 * @param lastEventSent - The timestamp of the last event of this type
 * @throws {SignatureError} When event timing is invalid
 * @returns void
 */
export function validateEventTiming(
  _envelope: Envelope, 
  _eventType: AuditEventType, 
  lastEventSent?: Date
): void {
  if (!lastEventSent) {
    return; // First event - always valid
  }
  
  const now = new Date();
  const minutesSinceLastEvent = diffMinutes(now, lastEventSent);
  
  // Prevent spam events (minimum 1 minute between same event types)
  if (minutesSinceLastEvent < 1) {
    throw eventGenerationFailed('Event sent too recently. Minimum 1 minute between same event types');
  }
}

/**
 * Validates event data for workflow operations
 * @param eventData - The event data to validate
 * @throws {SignatureError} When event data is invalid
 * @returns void
 */
export function validateEventData(eventData: WorkflowEventData): void {
  if (!eventData.envelopeId) {
    throw eventGenerationFailed('Event data must include envelopeId');
  }
  
  if (!eventData.eventType) {
    throw eventGenerationFailed('Event data must include eventType');
  }
  
  if (!eventData.timestamp) {
    throw eventGenerationFailed('Event data must include timestamp');
  }
  
  // Validate timestamp is not in the future
  const now = new Date();
  if (eventData.timestamp > now) {
    throw eventGenerationFailed('Event timestamp cannot be in the future');
  }
}

/**
 * Main workflow validation orchestrator
 * @param envelope - The envelope to validate workflow for
 * @param operation - The operation being performed
 * @param signingOrder - The signing order configuration
 * @param timingConfig - The timing configuration
 * @throws {SignatureError} When workflow validation fails
 * @returns void
 */
export function validateEnvelopeWorkflow(
  envelope: Envelope,
  operation: EnvelopeOperation,
  signingOrder: SigningOrder,
  timingConfig: WorkflowTimingConfig
): void {
  // Validate signing order workflow
  validateSigningOrderWorkflow(envelope, signingOrder);
  
  // Validate workflow timing
  validateWorkflowTiming(envelope, operation, timingConfig);
  
  // Validate expiration workflow
  validateExpirationWorkflow(envelope, timingConfig);
}
