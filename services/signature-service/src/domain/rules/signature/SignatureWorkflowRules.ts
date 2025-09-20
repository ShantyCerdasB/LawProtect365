/**
 * @fileoverview SignatureWorkflowRules - Workflow validation rules for signatures
 * @summary Workflow-specific validation rules for signature operations
 * @description This module contains workflow validation rules for signature operations,
 * including state transitions, workflow timing, and workflow-specific business logic.
 */

import { Signature } from '../../entities/Signature';
import { Signer } from '../../entities/Signer';
import { SignatureEnvelope } from '../../entities/SignatureEnvelope';
import { SignerWorkflowOperation } from '../../enums/SignerOperation';
import { SignatureStatus } from '@/domain/enums/SignatureStatus';
import { SignerStatus } from '@/domain/enums/SignerStatus';
import { EnvelopeStatus } from '../../enums/EnvelopeStatus';
import { 
  workflowViolation, 
  invalidStateTransition
} from '../../../signature-errors/index';

// Use SignerWorkflowOperation from the enums

/**
 * Validates signature workflow state transition
 * @param signature - The signature to validate
 * @param operation - The workflow operation being performed
 * @param context - Additional context for validation
 * @throws Error if workflow state transition is invalid
 */
export function validateSignatureWorkflowTransition(
  signature: Signature,
  operation: SignerWorkflowOperation,
  context: {
    signer?: Signer;
    envelope?: Envelope;
    currentTime?: Date;
  } = {}
): void {
  const currentStatus = signature.getStatus();

  switch (operation) {
    case SignerWorkflowOperation.SIGN:
      if (currentStatus !== SignatureStatus.PENDING) {
        throw invalidStateTransition({ 
          operation: 'SIGN', 
          currentStatus, 
          expectedStatus: SignatureStatus.PENDING 
        });
      }
      break;

    case SignerWorkflowOperation.CONSENT:
      if (currentStatus !== SignatureStatus.PENDING) {
        throw invalidStateTransition({ 
          operation: 'CONSENT', 
          currentStatus, 
          expectedStatus: SignatureStatus.PENDING 
        });
      }
      break;

    case SignerWorkflowOperation.DECLINE:
      if (currentStatus === SignatureStatus.SIGNED || currentStatus === SignatureStatus.FAILED) {
        throw invalidStateTransition({ 
          operation: 'DECLINE', 
          currentStatus, 
          message: 'Cannot decline signature that is already signed or failed' 
        });
      }
      break;

    case SignerWorkflowOperation.INVITE:
      if (currentStatus !== SignatureStatus.PENDING) {
        throw invalidStateTransition({ 
          operation: 'INVITE', 
          currentStatus, 
          expectedStatus: SignatureStatus.PENDING 
        });
      }
      break;

    default:
      throw workflowViolation({ 
        operation, 
        message: 'Unknown signature workflow operation' 
      });
  }

  // Validate signer status if provided
  if (context.signer) {
    validateSignerWorkflowState(context.signer, operation);
  }

  // Validate envelope status if provided
  if (context.envelope) {
    validateEnvelopeWorkflowState(context.envelope, operation);
  }
}

/**
 * Validates signer workflow state for signature operations
 * @param signer - The signer to validate
 * @param operation - The workflow operation being performed
 * @throws Error if signer workflow state is invalid
 */
function validateSignerWorkflowState(signer: Signer, operation: SignerWorkflowOperation): void {
  const signerStatus = signer.getStatus();

  switch (operation) {
    case SignerWorkflowOperation.SIGN:
    case SignerWorkflowOperation.CONSENT:
      if (signerStatus !== SignerStatus.PENDING) {
        throw invalidStateTransition({ 
          operation, 
          signerStatus, 
          expectedStatus: SignerStatus.PENDING,
          entity: 'signer'
        });
      }
      break;

    case SignerWorkflowOperation.DECLINE:
      if (signerStatus === SignerStatus.SIGNED || signerStatus === SignerStatus.DECLINED) {
        throw invalidStateTransition({ 
          operation: 'DECLINE', 
          signerStatus, 
          message: 'Cannot decline signature for signer that is already signed or declined',
          entity: 'signer'
        });
      }
      break;

    case SignerWorkflowOperation.INVITE:
      if (signerStatus !== SignerStatus.PENDING) {
        throw invalidStateTransition({ 
          operation: 'INVITE', 
          signerStatus, 
          expectedStatus: SignerStatus.PENDING,
          entity: 'signer'
        });
      }
      break;
  }
}

/**
 * Validates envelope workflow state for signature operations
 * @param envelope - The envelope to validate
 * @param operation - The workflow operation being performed
 * @throws Error if envelope workflow state is invalid
 */
function validateEnvelopeWorkflowState(envelope: Envelope, operation: SignerWorkflowOperation): void {
  const envelopeStatus = envelope.getStatus();

  switch (operation) {
    case SignerWorkflowOperation.SIGN:
    case SignerWorkflowOperation.CONSENT:
      if (envelopeStatus !== EnvelopeStatus.SENT && envelopeStatus !== EnvelopeStatus.IN_PROGRESS) {
        throw invalidStateTransition({ 
          operation, 
          envelopeStatus, 
          expectedStatuses: [EnvelopeStatus.SENT, EnvelopeStatus.IN_PROGRESS],
          entity: 'envelope'
        });
      }
      break;

    case SignerWorkflowOperation.DECLINE:
      if (envelopeStatus === EnvelopeStatus.COMPLETED || envelopeStatus === EnvelopeStatus.CANCELLED) {
        throw invalidStateTransition({ 
          operation: 'DECLINE', 
          envelopeStatus, 
          message: 'Cannot decline signature on envelope that is already completed or cancelled',
          entity: 'envelope'
        });
      }
      break;

    case SignerWorkflowOperation.INVITE:
      if (envelopeStatus !== EnvelopeStatus.SENT && envelopeStatus !== EnvelopeStatus.IN_PROGRESS) {
        throw invalidStateTransition({ 
          operation: 'INVITE', 
          envelopeStatus, 
          expectedStatuses: [EnvelopeStatus.SENT, EnvelopeStatus.IN_PROGRESS],
          entity: 'envelope'
        });
      }
      break;
  }
}

/**
 * Validates signature workflow timing
 * @param signature - The signature to validate
 * @param operation - The workflow operation being performed
 * @param config - Timing configuration
 * @throws Error if timing validation fails
 */
export function validateSignatureWorkflowTiming(
  signature: Signature,
  operation: SignerWorkflowOperation,
  config: {
    maxProcessingTimeMs?: number;
    maxRetryAttempts?: number;
    retryDelayMs?: number;
  } = {}
): void {
  const currentTime = new Date();
  const createdAt = signature.getTimestamp();
  const maxProcessingTimeMs = config.maxProcessingTimeMs || 300000; // 5 minutes default

  // Check if signature has been processing too long for decline operation
  if (operation === SignerWorkflowOperation.DECLINE) {
    const processingTime = currentTime.getTime() - createdAt.getTime();
    if (processingTime < maxProcessingTimeMs) {
      throw workflowViolation({ 
        operation: 'DECLINE', 
        processingTime, 
        maxProcessingTimeMs,
        message: 'Signature has not been processing long enough to decline'
      });
    }
  }

  // Validate timing constraints for sign operation
  if (operation === SignerWorkflowOperation.SIGN) {
    const processingTime = currentTime.getTime() - createdAt.getTime();
    if (processingTime > maxProcessingTimeMs) {
      throw workflowViolation({ 
        operation: 'SIGN', 
        processingTime, 
        maxProcessingTimeMs,
        message: 'Signature processing timeout exceeded'
      });
    }
  }
}
