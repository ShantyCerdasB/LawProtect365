/**
 * @fileoverview SignerWorkflowRules - Workflow validation rules for signer operations
 * @summary Workflow validation rules for signer operations
 * @description The SignerWorkflowRules provides workflow validation for signer operations
 * including state transitions, event generation, and workflow timing.
 */

import { Signer } from '@/domain/entities/Signer';
import { Envelope } from '@/domain/entities/Envelope';
import { SignerStatus, isValidSignerStatusTransition, getValidNextSignerStatuses } from '@/domain/enums/SignerStatus';
import { SignerWorkflowOperation } from '@/domain/enums/SignerOperation';
import { AuditEventType } from '@/domain/enums/AuditEventType';
import { 
  invalidSignerState,
  eventGenerationFailed
} from '@/signature-errors';
import { diffMinutes } from '@lawprotect/shared-ts';
import { SignerValidator } from '@/domain/validators/SignerValidator';
import { validateInvitationToken } from './SignerSecurityRules';
import { shouldCancelEnvelopeOnDecline } from '../envelope/EnvelopeBusinessRules';


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
  const { invitationToken, maxInvitationAgeHours } = invitationData;

  if (!signer.isExternal()) {
    return; // Internal signers don't need invitation validation
  }

  // Use centralized invitation token validation from SignerSecurityRules
  try {
    validateInvitationToken(signer, invitationToken, maxInvitationAgeHours);
  } catch (error) {
    if (error instanceof Error) {
      throw eventGenerationFailed(`Invitation validation failed: ${error.message}`);
    }
    throw error;
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
  signer: Signer, 
  consentData: {
    consentGiven: boolean;
    consentTimestamp: Date;
    ipAddress: string;
    userAgent: string;
  }
): void {
  const { consentGiven, consentTimestamp } = consentData;

  if (!consentGiven) {
    throw eventGenerationFailed('Consent must be given before proceeding');
  }

  if (!consentTimestamp || consentTimestamp > new Date()) {
    throw eventGenerationFailed('Invalid consent timestamp');
  }

  // Use entity's built-in validation for consent
  try {
    signer.validateForSigning();
  } catch (error) {
    if (error instanceof Error) {
      throw eventGenerationFailed(`Consent validation failed: ${error.message}`);
    }
    throw error;
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
  // Validate signer can sign using entity's built-in validation
  try {
    signer.validateForSigning();
  } catch (error) {
    if (error instanceof Error) {
      throw eventGenerationFailed(error.message);
    }
    throw error;
  }

  // Validate signing data using centralized validator
  try {
    SignerValidator.validateSigningData(signer, signingData);
  } catch (error) {
    if (error instanceof Error) {
      throw eventGenerationFailed(error.message);
    }
    throw error;
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
  // Validate signer can decline using entity's built-in validation
  try {
    if (signer.hasSigned()) {
      throw eventGenerationFailed('Cannot decline after signing');
    }
    if (signer.hasDeclined()) {
      throw eventGenerationFailed('Signer has already declined');
    }
  } catch (error) {
    if (error instanceof Error) {
      throw eventGenerationFailed(error.message);
    }
    throw error;
  }

  // Validate decline data using centralized validator
  try {
    SignerValidator.validateDeclineData(signer, declineData);
  } catch (error) {
    if (error instanceof Error) {
      throw eventGenerationFailed(error.message);
    }
    throw error;
  }
}

/**
 * Handles the complete signer decline workflow including envelope cancellation evaluation
 * 
 * This function orchestrates the entire decline workflow:
 * 1. Validates the signer can decline
 * 2. Evaluates if the envelope should be cancelled
 * 3. Returns workflow result with cancellation recommendation
 * 
 * @param signer - The signer declining
 * @param envelope - The envelope containing the signer
 * @param declineData - Decline data for validation
 * @returns Workflow result with cancellation recommendation
 */
export function handleSignerDeclineWorkflow(
  signer: Signer,
  envelope: Envelope,
  declineData: {
    reason?: string;
    timestamp: Date;
    ipAddress: string;
    userAgent: string;
  }
): {
  shouldCancelEnvelope: boolean;
  cancellationReason?: string;
} {
  // Validate decline workflow
  validateSignerDeclineWorkflow(signer, declineData);

  // Evaluate if envelope should be cancelled
  const shouldCancel = shouldCancelEnvelopeOnDecline(envelope);
  
  return {
    shouldCancelEnvelope: shouldCancel,
    cancellationReason: shouldCancel ? 'Signer declined to sign' : undefined
  };
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
