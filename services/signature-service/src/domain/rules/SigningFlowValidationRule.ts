/**
 * @fileoverview SigningFlowValidationRule - Validates complete signing flow
 * @summary Domain rule for validating signing flow operations
 * @description Validates envelope state, signer state, and signing order for document signing operations
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
 */
export class SigningFlowValidationRule {
  constructor() {}

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
  validateSigningFlow(
    envelope: SignatureEnvelope,
    signer: EnvelopeSigner,
    userId: string,
    allSigners: EnvelopeSigner[]
  ): void {
    // Validate envelope state
    this.validateEnvelopeState(envelope);
    
    // Validate signer state
    this.validateSignerState(signer);
    
      // Validate signing order
      SigningOrderValidationRule.validateSigningOrder(
        envelope,
        signer.getId(),
        userId,
        allSigners
      );
  }

  /**
   * Validates that envelope is in valid state for signing
   * @param envelope - The envelope to validate
   * @throws ConflictError when envelope is not ready
   */
  private validateEnvelopeState(envelope: SignatureEnvelope): void {
    const status = envelope.getStatus();
    
    if (status !== EnvelopeStatus.readyForSignature()) {
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
  private validateSignerState(signer: EnvelopeSigner): void {
    const status = signer.getStatus();
    
    if (status !== SignerStatus.PENDING) {
      throw invalidSignerState(
        `Signer ${signer.getId().getValue()} is not ready for signing. Current status: ${status}`
      );
    }
  }
}
