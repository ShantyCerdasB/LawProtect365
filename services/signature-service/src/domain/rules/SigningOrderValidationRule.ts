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
  signerSigningOrderViolation,
  invalidEnvelopeState
} from '../../signature-errors';
import { CreateSignerData } from '../types/signer/CreateSignerData';

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

    // For invitees (external signers), they can sign in any order
    // If no owner is present as a signer, all signers are invitees and can sign freely
    if (currentSigner.getIsExternal()) {
      return; // Invitees can sign in any order
    }

    // If we reach here, it's an internal signer but not the owner
    // This shouldn't happen in INVITEES_FIRST, but if it does, allow it
    return;
  }

  /**
   * Validates signing order consistency during envelope creation
   * @param signingOrderType - The signing order type
   * @param signersData - Array of signer data
   * @param creatorUserId - The user ID who created the envelope
   * @throws invalidEnvelopeState when signing order is inconsistent
   */
  static validateSigningOrderConsistency(
    signingOrderType: SigningOrderType,
    signersData: CreateSignerData[],
    creatorUserId: string
  ): void {
    // Validate INVITEES_FIRST without invitees
    if (signingOrderType === SigningOrderType.INVITEES_FIRST) {
      const hasInvitees = signersData.some(signer => signer.isExternal);
      if (!hasInvitees) {
        throw invalidEnvelopeState('INVITEES_FIRST signing order requires at least one external signer');
      }
    }

    // Validate signer order consistency (only if creator is present as signer)
    SigningOrderValidationRule.validateSignerOrderConsistency(signingOrderType, signersData, creatorUserId);
  }

  /**
   * Validates that signer order is consistent with signing order type
   * Only validates order if the creator is present as a signer
   * @param signingOrderType - The signing order type
   * @param signersData - Array of signer data
   * @param creatorUserId - The user ID who created the envelope
   */
  private static validateSignerOrderConsistency(
    signingOrderType: SigningOrderType,
    signersData: CreateSignerData[],
    creatorUserId: string
  ): void {
    const creatorSigner = signersData.find(signer => 
      !signer.isExternal && signer.userId === creatorUserId
    );

    // Only validate order if creator is present as signer
    if (creatorSigner) {
      if (signingOrderType === SigningOrderType.OWNER_FIRST) {
        // Creator should be the first signer (order: 1)
        if (creatorSigner.order !== 1) {
          throw invalidEnvelopeState('OWNER_FIRST signing order requires the creator to be the first signer (order: 1)');
        }
      } else if (signingOrderType === SigningOrderType.INVITEES_FIRST) {
        // Creator should be the last signer
        const maxOrder = Math.max(...signersData.map(s => s.order || 1));
        if (creatorSigner.order !== maxOrder) {
          throw invalidEnvelopeState('INVITEES_FIRST signing order requires the creator to be the last signer');
        }
      }
    }
  }
}
