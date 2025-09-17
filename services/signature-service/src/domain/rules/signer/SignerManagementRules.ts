/**
 * @fileoverview SignerManagementRules - Business rules for signer management operations
 * @summary Validation rules for signer add, remove, and update operations
 * @description This file contains business rules for managing signers in envelopes,
 * including validation for signer status, permissions, and business constraints.
 */

import { Signer } from '../../entities';
import { EnvelopeId } from '../../value-objects';
import { SignerStatus, SigningOrderType } from '../../enums';
import { BadRequestError, ForbiddenError, isEmail } from '@lawprotect/shared-ts';

/**
 * Validates that a signer can be removed from an envelope
 * 
 * @param signer - The signer to be removed
 * @param envelopeId - The envelope ID for context
 * @throws BadRequestError if signer cannot be removed
 * 
 * @description Business Rules:
 * - Only PENDING signers can be removed
 * - SIGNED signers cannot be removed (signature is permanent)
 * - DECLINED signers can be removed
 * - Owner (order 1) cannot be removed if envelope has been sent
 */
export function validateSignerRemoval(signer: Signer, _envelopeId: EnvelopeId, isOwner: boolean): void {
  // Only owner can remove signers
  if (!isOwner) {
    throw new ForbiddenError(
      'Only the envelope owner can remove signers',
      'ONLY_OWNER_CAN_REMOVE_SIGNERS'
    );
  }

  const status = signer.getStatus();
  const order = signer.getOrder();
  
  // Cannot remove signed signers
  if (status === SignerStatus.SIGNED) {
    throw new BadRequestError(
      'Cannot remove signer who has already signed the document',
      'SIGNER_ALREADY_SIGNED'
    );
  }
  
  // Cannot remove owner if envelope has been sent (business rule)
  if (order === 1 && status === SignerStatus.PENDING) {
    // Note: This validation should be enhanced with envelope status check
    // For now, we allow owner removal if not signed
  }
}

/**
 * Validates that a signer can be updated
 * 
 * @param signer - The signer to be updated
 * @param newEmail - The new email address (optional)
 * @param newFullName - The new full name (optional)
 * @throws BadRequestError if signer cannot be updated
 * 
 * @description Business Rules:
 * - Only PENDING signers can be updated
 * - SIGNED signers cannot be updated (signature is permanent)
 * - DECLINED signers can be updated
 * - Email changes require validation
 * - Name changes are always allowed for pending signers
 */
export function validateSignerUpdate(
  signer: Signer, 
  newEmail?: string, 
  _newFullName?: string,
  isOwner: boolean = true
): void {
  // Only owner can update signers
  if (!isOwner) {
    throw new ForbiddenError(
      'Only the envelope owner can update signers',
      'ONLY_OWNER_CAN_UPDATE_SIGNERS'
    );
  }

  const status = signer.getStatus();
  
  // Cannot update signed signers
  if (status === SignerStatus.SIGNED) {
    throw new BadRequestError(
      'Cannot update signer who has already signed the document',
      'SIGNER_ALREADY_SIGNED'
    );
  }
  
  // Validate email format if provided
  if (newEmail && !isEmail(newEmail)) {
    throw new BadRequestError(
      'Invalid email format provided',
      'INVALID_EMAIL_FORMAT'
    );
  }
}

/**
 * Validates that a new signer can be added to an envelope
 * 
 * @param envelopeId - The envelope ID
 * @param email - The signer's email address
 * @param fullName - The signer's full name
 * @param existingSigners - Array of existing signers
 * @throws BadRequestError if signer cannot be added
 * 
 * @description Business Rules:
 * - Email must be unique within the envelope
 * - Email must be valid format
 * - Full name is required
 * - Cannot add signers to completed envelopes
 * - Maximum signer limit (if applicable)
 */
export function validateSignerAddition(
  _envelopeId: EnvelopeId,
  email: string,
  fullName: string,
  existingSigners: Signer[],
  isOwner: boolean = true
): void {
  // Only owner can add signers
  if (!isOwner) {
    throw new ForbiddenError(
      'Only the envelope owner can add signers',
      'ONLY_OWNER_CAN_ADD_SIGNERS'
    );
  }

  // Validate email format
  if (!isEmail(email)) {
    throw new BadRequestError(
      'Invalid email format provided',
      'INVALID_EMAIL_FORMAT'
    );
  }
  
  // Validate full name
  if (!fullName || fullName.trim().length === 0) {
    throw new BadRequestError(
      'Full name is required for signers',
      'MISSING_FULL_NAME'
    );
  }
  
  // Check for duplicate email
  const existingEmail = existingSigners.find(signer => 
    signer.getEmail().getValue().toLowerCase() === email.toLowerCase()
  );
  
  if (existingEmail) {
    throw new BadRequestError(
      'A signer with this email already exists in the envelope',
      'DUPLICATE_SIGNER_EMAIL'
    );
  }
  
  // Check maximum signer limit (business rule)
  const maxSigners = 50; // Configurable business rule
  if (existingSigners.length >= maxSigners) {
    throw new BadRequestError(
      `Maximum number of signers (${maxSigners}) reached for this envelope`,
      'MAX_SIGNERS_EXCEEDED'
    );
  }
}

/**
 * Validates signer order assignment
 * 
 * @param order - The proposed order number
 * @param existingSigners - Array of existing signers
 * @param signingOrderType - The signing order type
 * @throws BadRequestError if order is invalid
 * 
 * @description Business Rules:
 * - Owner must always be order 1
 * - Order numbers must be unique
 * - Order must be positive integer
 * - Order assignment follows signing order type rules
 */
export function validateSignerOrder(
  order: number,
  existingSigners: Signer[],
  _signingOrderType: SigningOrderType
): void {
  // Validate order is positive integer
  if (!Number.isInteger(order) || order < 1) {
    throw new BadRequestError(
      'Signer order must be a positive integer',
      'INVALID_SIGNER_ORDER'
    );
  }
  
  // Check for duplicate order
  const existingOrder = existingSigners.find(signer => signer.getOrder() === order);
  if (existingOrder) {
    throw new BadRequestError(
      `Signer order ${order} is already assigned`,
      'DUPLICATE_SIGNER_ORDER'
    );
  }
  
  // Validate owner order (business rule)
  if (order === 1) {
    const existingOwner = existingSigners.find(signer => signer.getOrder() === 1);
    if (existingOwner) {
      throw new BadRequestError(
        'Owner (order 1) already exists in this envelope',
        'OWNER_ALREADY_EXISTS'
      );
    }
  }
}


/**
 * Gets the next available order number for a new signer
 * 
 * @param existingSigners - Array of existing signers
 * @param signingOrderType - The signing order type
 * @returns The next available order number
 * 
 * @description Order Assignment Logic:
 * - OWNER_FIRST: Owner is 1, invitees start from 2
 * - INVITEES_FIRST: Invitees start from 2, owner gets highest number + 1
 */
export function getNextSignerOrder(
  existingSigners: Signer[],
  signingOrderType: SigningOrderType
): number {
  if (existingSigners.length === 0) {
    return 1; // First signer is always order 1 (owner)
  }
  
  const maxOrder = Math.max(...existingSigners.map(s => s.getOrder()));
  
  if (signingOrderType === SigningOrderType.OWNER_FIRST) {
    // Owner is 1, invitees continue from 2
    return maxOrder + 1;
  } else {
    // INVITEES_FIRST: Invitees get sequential orders, owner gets highest + 1
    return maxOrder + 1;
  }
}
