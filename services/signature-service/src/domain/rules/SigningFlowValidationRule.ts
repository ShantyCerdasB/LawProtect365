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
    console.log('🔍 DEBUG SigningFlowValidationRule.validateSigningFlow:');
    console.log('  - Envelope ID:', envelope.getId().getValue());
    console.log('  - Envelope Status:', envelope.getStatus().getValue());
    console.log('  - Signer ID:', signer.getId().getValue());
    console.log('  - Signer Status:', signer.getStatus());
    console.log('  - User ID:', userId);
    console.log('  - All signers count:', allSigners.length);
    
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
    
    // Validate envelope was sent (for external signers)
    this.validateEnvelopeSent(envelope, signer, userId);
  }

  /**
   * Validates that envelope is in valid state for signing
   * @param envelope - The envelope to validate
   * @throws ConflictError when envelope is not ready
   */
  private validateEnvelopeState(envelope: SignatureEnvelope): void {
    const status = envelope.getStatus();
    const readyForSignatureStatus = EnvelopeStatus.readyForSignature();
    
    console.log('🔍 DEBUG validateEnvelopeState:');
    console.log('  - Envelope ID:', envelope.getId().getValue());
    console.log('  - Current status:', status.getValue());
    console.log('  - Ready for signature status:', readyForSignatureStatus.getValue());
    console.log('  - Status equals readyForSignature:', status === readyForSignatureStatus);
    console.log('  - Status equals check (getValue):', status.getValue() === readyForSignatureStatus.getValue());
    
    if (status.getValue() !== EnvelopeStatus.readyForSignature().getValue()) {
      console.log('❌ ERROR: Envelope state validation failed!');
      throw invalidEnvelopeState(
        `Envelope ${envelope.getId().getValue()} is not ready for signing. Current status: ${status.getValue()}`
      );
    }
    
    console.log('✅ Envelope state validation passed');
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

  /**
   * Validates that envelope was sent before external signers can sign
   * @param envelope - The envelope to validate
   * @param signer - The signer attempting to sign
   * @param userId - The user making the request
   * @throws ConflictError when external signer tries to sign unsent envelope
   */
  private validateEnvelopeSent(envelope: SignatureEnvelope, signer: EnvelopeSigner, _userId: string): void {
    const isOwner = !signer.getIsExternal() && signer.getUserId() === envelope.getCreatedBy();
    
    if (!isOwner && !envelope.getSentAt()) {
      throw invalidEnvelopeState(
        `Envelope ${envelope.getId().getValue()} must be sent before external signers can sign it`
      );
    }
  }
}
