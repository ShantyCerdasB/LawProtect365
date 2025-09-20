/**
 * @fileoverview EnvelopeSigningOrderRules - Signing order validation rules for envelope operations
 * @summary Defines workflow rules for sequential and parallel signing order validation
 * @description Contains validation rules for envelope signing order including sequential signing
 * (owner first) and parallel signing (invitees first) workflows.
 */

import { SignerStatus } from '@/domain/enums/SignerStatus';
import { SigningOrder } from '@/domain/value-objects/SigningOrder';
import { SignatureEnvelope } from '@/domain/entities/SignatureEnvelope';
import { Signer } from '@/domain/entities/Signer';
import { invalidSigningOrder } from '@/signature-errors';

/**
 * Validates signing order workflow for an envelope
 * @param envelope - The envelope to validate signing order for
 * @param signingOrder - The signing order configuration
 * @throws {SignatureError} When signing order is invalid for current state
 * @returns void
 */
export function validateSigningOrderWorkflow(envelope: Envelope, signingOrder: SigningOrder): void {
  const signers = envelope.getSigners();
  
  if (signingOrder.isOwnerFirst()) {
    validateSequentialSigning(envelope, signers);
  } else {
    validateParallelSigning(envelope, signers);
  }
}

/**
 * Validates sequential signing workflow (owner first)
 * @param envelope - The envelope being validated
 * @param signers - Array of signers in the envelope
 * @throws {SignatureError} When sequential signing rules are violated
 * @returns void
 */
export function validateSequentialSigning(envelope: Envelope, signers: Signer[]): void {
  const ownerId = envelope.getOwnerId();
  const owner = signers.find(s => s.getEmail().getValue() === ownerId);
  const invitees = signers.filter(s => s.getEmail().getValue() !== ownerId);
  
  if (!owner) {
    throw invalidSigningOrder('Sequential signing requires an owner to be defined');
  }
  
  // Owner must sign before any invitee
  if (owner.getStatus() !== SignerStatus.SIGNED) {
    const signedInvitees = invitees.filter(s => s.getStatus() === SignerStatus.SIGNED);
    if (signedInvitees.length > 0) {
      throw invalidSigningOrder('Owner must sign before invitees in sequential signing');
    }
  }
  
  // Validate signer order
  validateSignerOrder(signers);
}

/**
 * Validates parallel signing workflow (invitees first)
 * @param envelope - The envelope being validated
 * @param signers - Array of signers in the envelope
 * @throws {SignatureError} When parallel signing rules are violated
 * @returns void
 */
export function validateParallelSigning(envelope: Envelope, signers: Signer[]): void {
  const ownerId = envelope.getOwnerId();
  const owner = signers.find(s => s.getEmail().getValue() === ownerId);
  const invitees = signers.filter(s => s.getEmail().getValue() !== ownerId);
  
  if (!owner) {
    throw invalidSigningOrder('Parallel signing requires an owner to be defined');
  }
  
  // All invitees must sign before owner
  if (owner.getStatus() === SignerStatus.SIGNED) {
    const pendingInvitees = invitees.filter(s => s.getStatus() === SignerStatus.PENDING);
    if (pendingInvitees.length > 0) {
      throw invalidSigningOrder('All invitees must sign before owner in parallel signing');
    }
  }
}

/**
 * Validates signer order in the signing sequence
 * @param signers - Array of signers to validate order for
 * @throws {SignatureError} When signer order is invalid
 * @returns void
 */
export function validateSignerOrder(signers: Signer[]): void {
  const sortedSigners = [...signers].sort((a, b) => a.getOrder() - b.getOrder());
  
  for (let i = 0; i < sortedSigners.length - 1; i++) {
    const current = sortedSigners[i];
    const next = sortedSigners[i + 1];
    
    // If current signer hasn't signed, next signer cannot sign
    if (current.getStatus() === SignerStatus.PENDING && next.getStatus() === SignerStatus.SIGNED) {
      throw invalidSigningOrder(`Signer ${current.getEmail().getValue()} must sign before ${next.getEmail().getValue()}`);
    }
  }
}
