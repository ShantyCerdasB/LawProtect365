/**
 * @fileoverview EnvelopeStateTransitionRules - State transition validation rules for envelope operations
 * @summary Defines workflow rules for envelope, signer, and signature state transitions
 * @description Contains validation rules for state transitions including envelope status changes,
 * signer status updates, and signature status validation with business rule enforcement.
 */

import { EnvelopeStatus, isValidEnvelopeStatusTransition, getValidNextStatuses } from '@/domain/enums/EnvelopeStatus';
import { SignerStatus, isValidSignerStatusTransition, getValidNextSignerStatuses } from '@/domain/enums/SignerStatus';
import { SignatureStatus, isValidSignatureStatusTransition, getValidNextSignatureStatuses } from '@/domain/enums/SignatureStatus';
import { Envelope } from '@/domain/entities/Envelope';
import { Signer } from '@/domain/entities/Signer';
import { Signature } from '@/domain/entities/Signature';
import { workflowViolation, invalidStateTransition } from '@/signature-errors';

/**
 * Validates envelope state transition workflow
 * @param envelope - The envelope to validate state transition for
 * @param newStatus - The new status to transition to
 * @throws {SignatureError} When state transition is invalid
 * @returns void
 */
export function validateEnvelopeStateTransition(envelope: Envelope, newStatus: EnvelopeStatus): void {
  const currentStatus = envelope.getStatus();
  
  if (!isValidEnvelopeStatusTransition(currentStatus, newStatus)) {
    const validTransitions = getValidNextStatuses(currentStatus);
    throw invalidStateTransition(
      `Invalid transition from ${currentStatus} to ${newStatus}. Valid transitions: ${validTransitions.join(', ')}`
    );
  }
  
  // Additional business logic validations
  validateStateTransitionBusinessRules(envelope, currentStatus, newStatus);
}

/**
 * Validates signer state transition workflow
 * @param signer - The signer to validate state transition for
 * @param newStatus - The new status to transition to
 * @throws {SignatureError} When signer state transition is invalid
 * @returns void
 */
export function validateSignerStateTransition(signer: Signer, newStatus: SignerStatus): void {
  const currentStatus = signer.getStatus();
  
  if (!isValidSignerStatusTransition(currentStatus, newStatus)) {
    const validTransitions = getValidNextSignerStatuses(currentStatus);
    throw invalidStateTransition(
      `Invalid signer transition from ${currentStatus} to ${newStatus}. Valid transitions: ${validTransitions.join(', ')}`
    );
  }
}

/**
 * Validates signature state transition workflow
 * @param signature - The signature to validate state transition for
 * @param newStatus - The new status to transition to
 * @throws {SignatureError} When signature state transition is invalid
 * @returns void
 */
export function validateSignatureStateTransition(signature: Signature, newStatus: SignatureStatus): void {
  const currentStatus = signature.getStatus();
  
  if (!isValidSignatureStatusTransition(currentStatus, newStatus)) {
    const validTransitions = getValidNextSignatureStatuses(currentStatus);
    throw invalidStateTransition(
      `Invalid signature transition from ${currentStatus} to ${newStatus}. Valid transitions: ${validTransitions.join(', ')}`
    );
  }
}

/**
 * Validates state transition business rules
 * @param envelope - The envelope being validated
 * @param _fromStatus - The current status
 * @param toStatus - The target status
 * @throws {SignatureError} When business rules are violated
 * @returns void
 */
export function validateStateTransitionBusinessRules(
  envelope: Envelope, 
  _fromStatus: EnvelopeStatus, 
  toStatus: EnvelopeStatus
): void {
  switch (toStatus) {
    case EnvelopeStatus.COMPLETED:
      validateCompletionRequirements(envelope);
      break;
    case EnvelopeStatus.EXPIRED:
      validateExpirationRequirements(envelope);
      break;
    case EnvelopeStatus.DECLINED:
      validateDeclineRequirements(envelope);
      break;
  }
}

/**
 * Validates completion requirements for an envelope
 * @param envelope - The envelope to validate completion for
 * @param signatures - Array of signatures to validate (optional, for external validation)
 * @throws {SignatureError} When completion requirements are not met
 * @returns void
 */
export function validateCompletionRequirements(envelope: Envelope, signatures?: any[]): void {
  const signers = envelope.getSigners();
  
  // 1. Validate all signers have signed
  const allSigned = signers.every(signer => signer.getStatus() === SignerStatus.SIGNED);
  
  if (!allSigned) {
    const pendingSigners = signers.filter(s => s.getStatus() === SignerStatus.PENDING);
    throw workflowViolation(`Cannot complete envelope: ${pendingSigners.length} signers still pending`);
  }
  
  // 2. Validate all signatures are completed (if provided)
  if (signatures && signatures.length > 0) {
    const allSignaturesComplete = signatures.every(sig => sig.getStatus() === SignatureStatus.SIGNED);
    
    if (!allSignaturesComplete) {
      const pendingSignatures = signatures.filter(sig => sig.getStatus() === SignatureStatus.PENDING);
      throw workflowViolation(`Cannot complete envelope: ${pendingSignatures.length} signatures still pending`);
    }
    
    // 3. Validate signature count matches signer count
    if (signatures.length !== signers.length) {
      throw workflowViolation(`Signature count (${signatures.length}) does not match signer count (${signers.length})`);
    }
  }
}

/**
 * Validates expiration requirements for an envelope
 * @param envelope - The envelope to validate expiration for
 * @throws {SignatureError} When expiration requirements are not met
 * @returns void
 */
export function validateExpirationRequirements(envelope: Envelope): void {
  const now = new Date();
  const metadata = envelope.getMetadata();
  const expiresAt = metadata.expiresAt;
  
  if (expiresAt && now < expiresAt) {
    throw workflowViolation('Cannot expire envelope before expiration date');
  }
}

/**
 * Validates decline requirements for an envelope
 * @param envelope - The envelope to validate decline for
 * @throws {SignatureError} When decline requirements are not met
 * @returns void
 */
export function validateDeclineRequirements(envelope: Envelope): void {
  const signers = envelope.getSigners();
  const hasDeclinedSigner = signers.some(signer => signer.getStatus() === SignerStatus.DECLINED);
  
  if (!hasDeclinedSigner) {
    throw workflowViolation('Cannot decline envelope: no signers have declined');
  }
}
