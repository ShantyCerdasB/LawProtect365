/**
 * @fileoverview SigningFlowValidationRule - Validates complete signing flow
 * @summary Domain rule for validating signing flow operations
 * @description Validates envelope state, signer state, and signing order for document signing operations.
 * Note: Age validation requires data access and should be handled in the use case or domain service.
 */

import { SignatureEnvelope } from '../entities/SignatureEnvelope';
import { EnvelopeSigner } from '../entities/EnvelopeSigner';
import { EnvelopeStatus } from '../value-objects/EnvelopeStatus';
import { SignerStatus } from '@prisma/client';
import { SigningOrderValidationRule } from './SigningOrderValidationRule';
import { 
  invalidEnvelopeState,
  invalidSignerState
} from '../../signature-errors';

/**
 * Domain rule for validating signing flow operations
 * @description
 * Validates pure domain invariants: envelope state, signer state, and signing order.
 * These validations are stateless and do not require external data access.
 */
export class SigningFlowValidationRule {
  /**
   * Validates complete signing flow for a signer
   * @param envelope - The envelope being signed
   * @param signer - The signer attempting to sign
   * @param userId - The user ID (for authenticated users)
   * @param allSigners - All signers in the envelope
   * @throws ConflictError when envelope is not in valid state
   * @throws ConflictError when signer is not in valid state
   * @throws ConflictError when signing order is violated
   */
  static validateSigningFlow(
    envelope: SignatureEnvelope,
    signer: EnvelopeSigner,
    userId: string | undefined,
    allSigners: EnvelopeSigner[]
  ): void {
    SigningFlowValidationRule.validateEnvelopeState(envelope);
    SigningFlowValidationRule.validateSignerState(signer);
    
    if (userId) {
      SigningOrderValidationRule.validateSigningOrder(
        envelope,
        signer.getId(),
        userId,
        allSigners
      );
    }
    
    SigningFlowValidationRule.validateEnvelopeSent(envelope, signer, userId);
  }

  /**
   * Validates that envelope is in valid state for signing
   * @param envelope - The envelope to validate
   * @throws ConflictError when envelope is not ready
   */
  private static validateEnvelopeState(envelope: SignatureEnvelope): void {
    const status = envelope.getStatus();
    
    if (status.getValue() !== EnvelopeStatus.readyForSignature().getValue()) {
      throw invalidEnvelopeState(
        `Envelope ${envelope.getId().getValue()} is not ready for signing. Current status: ${status.getValue()}`
      );
    }
  }

  /**
   * Validates that signer is in valid state for signing
   * @param signer - The signer to validate
   * @throws ConflictError when signer is not ready
   */
  private static validateSignerState(signer: EnvelopeSigner): void {
    const status = signer.getStatus();
    
    if (status !== SignerStatus.PENDING) {
      throw invalidSignerState(
        `Signer ${signer.getId().getValue()} is not ready for signing. Current status: ${status}`
      );
    }
  }

  /**
   * Validates that envelope was sent before external signers can sign
   * @param envelope - The envelope to validate
   * @param signer - The signer attempting to sign
   * @param userId - The user making the request
   * @throws ConflictError when external signer tries to sign unsent envelope
   */
  private static validateEnvelopeSent(envelope: SignatureEnvelope, signer: EnvelopeSigner, _userId: string | undefined): void {
    const isOwner = !signer.getIsExternal() && signer.getUserId() === envelope.getCreatedBy();
    
    if (!isOwner && !envelope.getSentAt()) {
      throw invalidEnvelopeState(
        `Envelope ${envelope.getId().getValue()} must be sent before external signers can sign it`
      );
    }
  }

}