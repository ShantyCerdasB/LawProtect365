/**
 * @fileoverview SignerWorkflowRules - Workflow validation rules for signer operations
 * @summary Workflow validation rules for signer operations
 * @description The SignerWorkflowRules provides workflow validation for signer operations
 * including state transitions, event generation, and workflow timing.
 */

import { Signer } from '@/domain/entities/Signer';
import { SignerStatus, isValidSignerStatusTransition, getValidNextSignerStatuses } from '@/domain/enums/SignerStatus';
import { AuditEventType } from '@/domain/enums/AuditEventType';
import { 
  invalidSignerState,
  eventGenerationFailed,
  signerAlreadySigned,
  signerAlreadyDeclined
} from '@/signature-errors';
import { diffMinutes } from '@lawprotect/shared-ts';

/**
 * Signer workflow operation types
 */
export enum SignerWorkflowOperation {
  INVITE = 'INVITE',
  CONSENT = 'CONSENT',
  SIGN = 'SIGN',
  DECLINE = 'DECLINE'
}

/**
 * Validates signer status transition for workflow operations
 * 
 * Ensures signer status transitions are valid according to workflow rules.
 * This is important for maintaining workflow integrity.
 * 
 * @param signer - The signer to validate status transition for
 * @param targetStatus - The target status for the transition
 * @throws {SignatureError} When status transition is invalid
 * @returns void
 */
export function validateSignerStatusTransition(signer: Signer, targetStatus: SignerStatus): void {
  const currentStatus = signer.getStatus();
  
  if (!isValidSignerStatusTransition(currentStatus, targetStatus)) {
    const validNextStatuses = getValidNextSignerStatuses(currentStatus);
    throw invalidSignerState(
      `Invalid status transition from ${currentStatus} to ${targetStatus}. Valid next statuses: ${validNextStatuses.join(', ')}`
    );
  }
}

/**
 * Validates signer workflow event generation
 * 
 * Ensures signer workflow events are valid and appropriate.
 * This is important for audit trails and workflow tracking.
 * 
 * @param signer - The signer for which to generate event
 * @param eventType - The type of event to generate
 * @param metadata - Additional metadata for the event
 * @throws {SignatureError} When event generation is invalid
 * @returns WorkflowEventData
 */
export function validateSignerEventGeneration(
  signer: Signer, 
  eventType: AuditEventType, 
  metadata?: Record<string, any>
): any {
  try {
    const eventData = {
      signerId: signer.getId().toString(),
      envelopeId: signer.getEnvelopeId(),
      eventType,
      timestamp: new Date(),
      metadata: {
        signerStatus: signer.getStatus(),
        signerEmail: signer.getEmail().getValue(),
        signerOrder: signer.getOrder(),
        ...metadata
      }
    };
    
    // Validate event type is appropriate for current signer state
    validateSignerEventTypeForState(signer, eventType);
    
    return eventData;
  } catch (error) {
    throw eventGenerationFailed(`Failed to generate signer workflow event: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validates that an event type is appropriate for the current signer state
 * 
 * Ensures signer events are valid for the current signer status.
 * This is important for maintaining workflow integrity.
 * 
 * @param signer - The signer to validate event type for
 * @param eventType - The event type to validate
 * @throws {SignatureError} When event type is inappropriate for current state
 * @returns void
 */
export function validateSignerEventTypeForState(signer: Signer, eventType: AuditEventType): void {
  const currentStatus = signer.getStatus();
  
  const validEventTypes: Record<SignerStatus, AuditEventType[]> = {
    [SignerStatus.PENDING]: [
      AuditEventType.SIGNER_INVITED,
      AuditEventType.CONSENT_GIVEN,
      AuditEventType.SIGNER_SIGNED,
      AuditEventType.SIGNER_DECLINED
    ],
    [SignerStatus.SIGNED]: [
      AuditEventType.SIGNER_SIGNED,
      AuditEventType.SIGNATURE_CREATED
    ],
    [SignerStatus.DECLINED]: [
      AuditEventType.SIGNER_DECLINED
    ]
  };
  
  const allowedEvents = validEventTypes[currentStatus] || [];
  
  if (!allowedEvents.includes(eventType)) {
    throw eventGenerationFailed(
      `Event type ${eventType} is not valid for signer status ${currentStatus}. Valid events: ${allowedEvents.join(', ')}`
    );
  }
}

/**
 * Validates signer workflow timing
 * 
 * Ensures signer workflow operations occur within appropriate time frames.
 * This is important for workflow efficiency and user experience.
 * 
 * @param signer - The signer to validate timing for
 * @param operation - The operation being performed
 * @param lastOperationTime - The timestamp of the last operation
 * @param minIntervalMinutes - Minimum interval between operations in minutes
 * @throws {SignatureError} When timing is invalid
 * @returns void
 */
export function validateSignerWorkflowTiming(
  _signer: Signer, 
  operation: SignerWorkflowOperation, 
  lastOperationTime?: Date,
  minIntervalMinutes: number = 1
): void {
  if (!lastOperationTime) {
    return; // First operation - always valid
  }
  
  const now = new Date();
  const minutesSinceLastOperation = diffMinutes(now, lastOperationTime);
  
  // Prevent rapid operations (minimum interval between operations)
  if (minutesSinceLastOperation < minIntervalMinutes) {
    throw eventGenerationFailed(
      `Operation ${operation} performed too recently. Minimum ${minIntervalMinutes} minute(s) between operations`
    );
  }
}

/**
 * Validates signer invitation workflow
 * 
 * Ensures signer invitation workflow is valid and complete.
 * This is important for external signer onboarding.
 * 
 * @param signer - The signer to validate invitation for
 * @param invitationData - Invitation data for validation
 * @throws {SignatureError} When invitation workflow is invalid
 * @returns void
 */
export function validateSignerInvitationWorkflow(
  signer: Signer, 
  invitationData: {
    invitationToken: string;
    invitationSentAt: Date;
    maxInvitationAgeHours: number;
  }
): void {
  const { invitationToken, invitationSentAt, maxInvitationAgeHours } = invitationData;

  if (!signer.isExternal()) {
    return; // Internal signers don't need invitation validation
  }

  if (!invitationToken || typeof invitationToken !== 'string') {
    throw eventGenerationFailed('Invitation token is required for external signers');
  }

  if (signer.getInvitationToken() !== invitationToken) {
    throw eventGenerationFailed('Invalid invitation token');
  }

  // Check invitation age
  const now = new Date();
  const invitationAge = now.getTime() - invitationSentAt.getTime();
  const maxAgeMs = maxInvitationAgeHours * 60 * 60 * 1000;

  if (invitationAge > maxAgeMs) {
    throw eventGenerationFailed('Invitation has expired');
  }
}

/**
 * Validates signer consent workflow
 * 
 * Ensures signer consent workflow is valid and complete.
 * This is important for legal compliance and workflow integrity.
 * 
 * @param signer - The signer to validate consent for
 * @param consentData - Consent data for validation
 * @throws {SignatureError} When consent workflow is invalid
 * @returns void
 */
export function validateSignerConsentWorkflow(
  _signer: Signer, 
  consentData: {
    consentGiven: boolean;
    consentTimestamp: Date;
    ipAddress: string;
    userAgent: string;
  }
): void {
  const { consentGiven, consentTimestamp, ipAddress, userAgent } = consentData;

  if (!consentGiven) {
    throw eventGenerationFailed('Consent must be given before proceeding');
  }

  if (!consentTimestamp || consentTimestamp > new Date()) {
    throw eventGenerationFailed('Invalid consent timestamp');
  }

  if (!ipAddress || typeof ipAddress !== 'string') {
    throw eventGenerationFailed('IP address is required for consent');
  }

  if (!userAgent || typeof userAgent !== 'string') {
    throw eventGenerationFailed('User agent is required for consent');
  }
}

/**
 * Validates signer signing workflow
 * 
 * Ensures signer signing workflow is valid and complete.
 * This is important for maintaining signing integrity.
 * 
 * @param signer - The signer to validate signing for
 * @param signingData - Signing data for validation
 * @throws {SignatureError} When signing workflow is invalid
 * @returns void
 */
export function validateSignerSigningWorkflow(
  signer: Signer, 
  signingData: {
    signatureHash: string;
    documentHash: string;
    algorithm: string;
    timestamp: Date;
  }
): void {
  const { signatureHash, documentHash, algorithm, timestamp } = signingData;

  if (signer.hasSigned()) {
    throw signerAlreadySigned('Signer has already signed');
  }

  if (signer.hasDeclined()) {
    throw signerAlreadyDeclined('Signer has already declined');
  }

  if (!signer.hasConsent()) {
    throw eventGenerationFailed('Signer must give consent before signing');
  }

  if (!signatureHash || typeof signatureHash !== 'string') {
    throw eventGenerationFailed('Signature hash is required');
  }

  if (!documentHash || typeof documentHash !== 'string') {
    throw eventGenerationFailed('Document hash is required');
  }

  if (!algorithm || typeof algorithm !== 'string') {
    throw eventGenerationFailed('Signing algorithm is required');
  }

  if (!timestamp || timestamp > new Date()) {
    throw eventGenerationFailed('Invalid signing timestamp');
  }
}

/**
 * Validates signer decline workflow
 * 
 * Ensures signer decline workflow is valid and complete.
 * This is important for maintaining workflow integrity.
 * 
 * @param signer - The signer to validate decline for
 * @param declineData - Decline data for validation
 * @throws {SignatureError} When decline workflow is invalid
 * @returns void
 */
export function validateSignerDeclineWorkflow(
  signer: Signer, 
  declineData: {
    reason?: string;
    timestamp: Date;
    ipAddress: string;
    userAgent: string;
  }
): void {
  const { reason: _reason, timestamp, ipAddress, userAgent } = declineData;

  if (signer.hasSigned()) {
    throw signerAlreadySigned('Signer has already signed');
  }

  if (signer.hasDeclined()) {
    throw signerAlreadyDeclined('Signer has already declined');
  }

  if (!timestamp || timestamp > new Date()) {
    throw eventGenerationFailed('Invalid decline timestamp');
  }

  if (!ipAddress || typeof ipAddress !== 'string') {
    throw eventGenerationFailed('IP address is required for decline');
  }

  if (!userAgent || typeof userAgent !== 'string') {
    throw eventGenerationFailed('User agent is required for decline');
  }
}

/**
 * Comprehensive signer workflow validation
 * 
 * Validates all workflow requirements for a signer operation.
 * This function orchestrates all signer workflow validations.
 * 
 * @param signer - The signer to validate workflow for
 * @param workflowData - Workflow data for validation
 * @throws {SignatureError} When any workflow validation fails
 * @returns void
 */
export function validateSignerWorkflow(
  signer: Signer,
  workflowData: {
    operation: SignerWorkflowOperation;
    targetStatus?: SignerStatus;
    eventType?: AuditEventType;
    lastOperationTime?: Date;
    invitationData?: {
      invitationToken: string;
      invitationSentAt: Date;
      maxInvitationAgeHours: number;
    };
    consentData?: {
      consentGiven: boolean;
      consentTimestamp: Date;
      ipAddress: string;
      userAgent: string;
    };
    signingData?: {
      signatureHash: string;
      documentHash: string;
      algorithm: string;
      timestamp: Date;
    };
    declineData?: {
      reason?: string;
      timestamp: Date;
      ipAddress: string;
      userAgent: string;
    };
  }
): void {
  const { operation, targetStatus, eventType, lastOperationTime, invitationData, consentData, signingData, declineData } = workflowData;

  // Validate status transition (if target status provided)
  if (targetStatus) {
    validateSignerStatusTransition(signer, targetStatus);
  }

  // Validate event generation (if event type provided)
  if (eventType) {
    validateSignerEventGeneration(signer, eventType);
  }

  // Validate workflow timing
  validateSignerWorkflowTiming(signer, operation, lastOperationTime);

  // Validate specific workflow operations
  switch (operation) {
    case SignerWorkflowOperation.INVITE:
      if (invitationData) {
        validateSignerInvitationWorkflow(signer, invitationData);
      }
      break;

    case SignerWorkflowOperation.CONSENT:
      if (consentData) {
        validateSignerConsentWorkflow(signer, consentData);
      }
      break;

    case SignerWorkflowOperation.SIGN:
      if (signingData) {
        validateSignerSigningWorkflow(signer, signingData);
      }
      break;

    case SignerWorkflowOperation.DECLINE:
      if (declineData) {
        validateSignerDeclineWorkflow(signer, declineData);
      }
      break;

    default:
      // Other operations don't require specific workflow validation
      break;
  }
}
