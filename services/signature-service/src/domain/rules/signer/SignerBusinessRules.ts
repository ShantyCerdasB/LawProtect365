/**
 * @fileoverview SignerBusinessRules - Business rules for signer operations
 * @summary Core business logic and validation rules for signer management
 * @description The SignerBusinessRules provides centralized business logic
 * for signer operations including limits, validations, and business constraints.
 * These rules complement the entity validations and provide higher-level business constraints.
 */

import { 
  SignerStatus, 
  isValidSignerStatusTransition, 
  getValidNextSignerStatuses, 
  SignerOperation,
  validateStringField
} from '@lawprotect/shared-ts';
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
import { SignerValidator } from '@/domain/validators/SignerValidator';

/**
 * Validates the maximum number of signers per envelope
 * @param signerCount - The number of signers to validate
 * @param config - The signature service configuration
 * @throws {SignatureError} When signer count exceeds maximum limit
 * @returns void
 */
export function validateMaxSignersPerEnvelope(signerCount: number, config: SignatureServiceConfig): void {
  if (signerCount > config.envelopeRules.maxSignersPerEnvelope) {
    throw envelopeLimitExceeded(
      `Envelope cannot have more than ${config.envelopeRules.maxSignersPerEnvelope} signers`
    );
  }
}


/**
 * Validates signer email uniqueness per envelope
 * @param email - The email to validate for uniqueness
 * @param _envelopeId - The envelope ID (unused parameter)
 * @param existingEmails - Array of existing emails in the envelope
 * @param config - The signature service configuration
 * @throws {SignatureError} When email already exists in envelope
 * @returns void
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
 * @param fullName - The full name to validate
 * @param _config - The signature service configuration (unused parameter)
 * @throws {SignatureError} When full name is invalid
 * @returns void
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
 * @param order - The signer order to validate
 * @param totalSigners - The total number of signers in the envelope
 * @param config - The signature service configuration
 * @throws {SignatureError} When signer order is invalid
 * @returns void
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
 * @param currentStatus - The current signer status
 * @param targetStatus - The target signer status
 * @throws {SignatureError} When status transition is invalid
 * @returns void
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
 * @param signer - The signer to validate for addition
 * @param envelopeId - The envelope ID
 * @param existingSigners - Array of existing signers in the envelope
 * @param config - The signature service configuration
 * @throws {SignatureError} When signer cannot be added
 * @returns void
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
 * @param signer - The signer to validate for removal
 * @throws {SignatureError} When signer cannot be removed
 * @returns void
 */
export function validateSignerCanBeRemoved(signer: Signer): void {
  SignerValidator.validateCanBeRemoved(signer);
}

/**
 * Validates signer can sign at this moment
 * @param signer - The signer to validate for signing
 * @throws {SignatureError} When signer cannot sign
 * @returns void
 */
export function validateSignerCanSign(signer: Signer): void {
  // Use entity's built-in validation
  signer.validateForSigning();
}

/**
 * Validates signer can decline
 * @param signer - The signer to validate for declining
 * @throws {SignatureError} When signer cannot decline
 * @returns void
 */
export function validateSignerCanDecline(signer: Signer): void {
  // Use entity's built-in validation
  if (signer.hasSigned()) {
    throw signerAlreadySigned('Cannot decline after signing');
  }

  if (signer.hasDeclined()) {
    throw signerAlreadyDeclined('Signer has already declined');
  }
}

/**
 * Comprehensive signer validation combining all business rules
 * @param signerData - The signer data containing signer, envelope ID, existing signers, and operation
 * @param config - The signature service configuration
 * @throws {SignatureError} When any validation fails
 * @returns void
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
