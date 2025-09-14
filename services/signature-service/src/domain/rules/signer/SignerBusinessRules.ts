/**
 * @fileoverview SignerBusinessRules - Business rules for signer operations
 * @summary Core business logic and validation rules for signer management
 * @description The SignerBusinessRules provides centralized business logic
 * for signer operations including limits, validations, and business constraints.
 * These rules complement the entity validations and provide higher-level business constraints.
 */

import { SignerStatus, isValidSignerStatusTransition, getValidNextSignerStatuses } from '@/domain/enums/SignerStatus';
import { Signer } from '@/domain/entities/Signer';
import { Email } from '@/domain/value-objects/Email';
import { 
  invalidSignerState, 
  envelopeLimitExceeded,
  signerEmailDuplicate,
  signerAlreadySigned,
  signerAlreadyDeclined
} from '@/signature-errors';
import type { SignatureServiceConfig } from '@/config';
import { 
  validateStringField
} from '@lawprotect/shared-ts';

/**
 * Signer operation types for business validation
 */
export enum SignerOperation {
  ADD = 'ADD',
  REMOVE = 'REMOVE', 
  SIGN = 'SIGN',
  DECLINE = 'DECLINE'
}

/**
 * Validates the maximum number of signers per envelope
 */
export function validateMaxSignersPerEnvelope(signerCount: number, config: SignatureServiceConfig): void {
  if (signerCount > config.envelopeRules.maxSignersPerEnvelope) {
    throw envelopeLimitExceeded(
      `Envelope cannot have more than ${config.envelopeRules.maxSignersPerEnvelope} signers`
    );
  }
}

/**
 * Validates the maximum number of envelopes per signer
 */
export function validateMaxEnvelopesPerSigner(envelopeCount: number, config: SignatureServiceConfig): void {
  if (envelopeCount > config.envelopeRules.maxEnvelopesPerOwner) {
    throw envelopeLimitExceeded(
      `Signer cannot participate in more than ${config.envelopeRules.maxEnvelopesPerOwner} envelopes`
    );
  }
}

/**
 * Validates signer email uniqueness per envelope
 */
export function validateUniqueEmailPerEnvelope(
  email: Email, 
  _envelopeId: string, 
  existingEmails: Email[],
  config: SignatureServiceConfig
): void {
  if (!config.envelopeRules.requireUniqueTitlesPerOwner) {
    return;
  }

  const normalizedEmail = email.getValue().toLowerCase();
  const normalizedExistingEmails = existingEmails.map(e => e.getValue().toLowerCase());
  
  if (normalizedExistingEmails.includes(normalizedEmail)) {
    throw signerEmailDuplicate(
      `Signer email "${email.getValue()}" already exists in this envelope`
    );
  }
}

/**
 * Validates signer full name using shared validation utilities
 */
export function validateSignerFullName(fullName: string, _config: SignatureServiceConfig): void {
  if (!fullName || fullName.trim().length === 0) {
    throw invalidSignerState('Signer full name is required');
  }

  try {
    validateStringField(fullName, 100, "Signer full name", false);
  } catch (error) {
    if (error instanceof Error) {
      throw invalidSignerState(error.message);
    }
    throw error;
  }
}

/**
 * Validates signer order within envelope
 */
export function validateSignerOrder(order: number, totalSigners: number, config: SignatureServiceConfig): void {
  if (order < 1 || order > totalSigners) {
    throw invalidSignerState(`Signer order must be between 1 and ${totalSigners}`);
  }

  if (order > config.envelopeRules.maxSignersPerEnvelope) {
    throw envelopeLimitExceeded(
      `Signer order cannot exceed ${config.envelopeRules.maxSignersPerEnvelope}`
    );
  }
}

/**
 * Validates signer status transitions for business operations
 */
export function validateSignerStatusForOperation(
  currentStatus: SignerStatus,
  targetStatus: SignerStatus
): void {
  if (!isValidSignerStatusTransition(currentStatus, targetStatus)) {
    const validNextStatuses = getValidNextSignerStatuses(currentStatus);
    throw invalidSignerState(
      `Invalid status transition from ${currentStatus} to ${targetStatus}. Valid next statuses: ${validNextStatuses.join(', ')}`
    );
  }
}

/**
 * Validates signer can be added to envelope
 */
export function validateSignerCanBeAdded(
  signer: Signer,
  envelopeId: string,
  existingSigners: Signer[],
  config: SignatureServiceConfig
): void {
  // Validate email uniqueness
  const existingEmails = existingSigners.map(s => s.getEmail());
  validateUniqueEmailPerEnvelope(signer.getEmail(), envelopeId, existingEmails, config);

  // Validate signer count limit
  validateMaxSignersPerEnvelope(existingSigners.length + 1, config);

  // Validate signer order
  validateSignerOrder(signer.getOrder(), existingSigners.length + 1, config);
}

/**
 * Validates signer can be removed from envelope
 */
export function validateSignerCanBeRemoved(signer: Signer): void {
  if (signer.hasSigned()) {
    throw signerAlreadySigned('Cannot remove signer who has already signed');
  }

  if (signer.hasDeclined()) {
    throw signerAlreadyDeclined('Cannot remove signer who has already declined');
  }
}

/**
 * Validates signer can sign at this moment
 */
export function validateSignerCanSign(signer: Signer): void {
  if (!signer.canSign()) {
    throw invalidSignerState('Signer cannot sign at this moment');
  }

  if (!signer.hasConsent()) {
    throw invalidSignerState('Signer must give consent before signing');
  }
}

/**
 * Validates signer can decline
 */
export function validateSignerCanDecline(signer: Signer): void {
  if (signer.hasSigned()) {
    throw signerAlreadySigned('Cannot decline after signing');
  }

  if (signer.hasDeclined()) {
    throw signerAlreadyDeclined('Signer has already declined');
  }
}

/**
 * Comprehensive signer validation combining all business rules
 */
export function validateSignerBusinessRules(
  signerData: {
    signer: Signer;
    envelopeId: string;
    existingSigners: Signer[];
    operation: SignerOperation;
  },
  config: SignatureServiceConfig
): void {
  const { signer, envelopeId, existingSigners, operation } = signerData;

  switch (operation) {
    case SignerOperation.ADD:
      validateSignerCanBeAdded(signer, envelopeId, existingSigners, config);
      break;

    case SignerOperation.REMOVE:
      validateSignerCanBeRemoved(signer);
      break;

    case SignerOperation.SIGN:
      validateSignerCanSign(signer);
      break;

    case SignerOperation.DECLINE:
      validateSignerCanDecline(signer);
      break;

    default:
      throw invalidSignerState(`Unknown operation: ${operation}`);
  }
}
