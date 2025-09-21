/**
 * @fileoverview SigningOrderValidationRule - Domain rule for signing order validation
 * @summary Validates signing order business rules and compliance requirements
 * @description This domain rule encapsulates all business validation logic for signing order,
 * ensuring compliance with signing workflow requirements and business constraints.
 */

import { SignatureEnvelope } from '../entities/SignatureEnvelope';
import { EnvelopeSigner } from '../entities/EnvelopeSigner';
import { SignerId } from '../value-objects/SignerId';
import { SigningOrderType } from '@prisma/client';
import { 
  signerNotFound,
  signerSigningOrderViolation
} from '../../signature-errors';

/**
 * SigningOrderValidationRule - Domain rule for signing order validation
 * 
 * Encapsulates business validation logic for signing order including:
 * - Owner-first signing order validation
 * - Invitees-first signing order validation
 * - Signing order compliance requirements
 */
export class SigningOrderValidationRule {
  /**
   * Validates signing order for a signer
   * @param envelope - The envelope containing signing order configuration
   * @param signerId - The signer attempting to sign
   * @param userId - The user ID
   * @param allSigners - All signers in the envelope
   * @throws signerSigningOrderViolation when signing order is violated
   */
  static validateSigningOrder(
    envelope: SignatureEnvelope,
    signerId: SignerId, 
    userId: string, 
    allSigners: EnvelopeSigner[]
  ): void {
    const currentSigner = allSigners.find(signer => signer.getId().equals(signerId));
    if (!currentSigner) {
      throw signerNotFound(`Signer with ID ${signerId.getValue()} not found in envelope`);
    }

    // Sort signers by order
    const sortedSigners = allSigners.sort((a, b) => a.getOrder() - b.getOrder());
    const signingOrderType = envelope.getSigningOrder().getType();

    if (signingOrderType === SigningOrderType.OWNER_FIRST) {
      SigningOrderValidationRule.validateOwnerFirstOrder(sortedSigners, currentSigner, userId);
    } else if (signingOrderType === SigningOrderType.INVITEES_FIRST) {
      SigningOrderValidationRule.validateInviteesFirstOrder(sortedSigners, currentSigner, userId);
    }
  }

  /**
   * Validates owner-first signing order
   * @param sortedSigners - Signers sorted by order
   * @param currentSigner - The signer attempting to sign
   * @param userId - The user ID
   */
  private static validateOwnerFirstOrder(
    sortedSigners: EnvelopeSigner[], 
    currentSigner: EnvelopeSigner, 
    userId: string
  ): void {
    // Find owner (signer with userId matching envelope creator)
    const owner = sortedSigners.find(signer => signer.getUserId() === userId);
    
    if (owner && owner.getId().equals(currentSigner.getId())) {
      // Owner can sign first
      return;
    }

    // Check if owner has signed
    if (owner && !owner.hasSigned()) {
      throw signerSigningOrderViolation('Owner must sign first');
    }

    // For non-owner signers, they can sign after owner
    if (!owner || owner.hasSigned()) {
      return;
    }
  }

  /**
   * Validates invitees-first signing order
   * @param sortedSigners - Signers sorted by order
   * @param currentSigner - The signer attempting to sign
   * @param userId - The user ID
   */
  private static validateInviteesFirstOrder(
    sortedSigners: EnvelopeSigner[], 
    currentSigner: EnvelopeSigner, 
    userId: string
  ): void {
    // Find owner (signer with userId matching envelope creator)
    const owner = sortedSigners.find(signer => signer.getUserId() === userId);
    
    if (owner && owner.getId().equals(currentSigner.getId())) {
      // Owner can only sign after all invitees have signed
      const invitees = sortedSigners.filter(signer => signer.getIsExternal());
      const allInviteesSigned = invitees.every(signer => signer.hasSigned());
      
      if (!allInviteesSigned) {
        throw signerSigningOrderViolation('All invitees must sign before owner');
      }
      return;
    }

    // For invitees, they can sign in any order
    return;
  }
}
