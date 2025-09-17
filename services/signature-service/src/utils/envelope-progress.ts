/**
 * @fileoverview EnvelopeProgressUtils - Utilities for envelope progress calculations
 * @summary Provides utilities for calculating signing progress and statistics
 * @description This module contains utility functions for calculating envelope
 * signing progress, statistics, and related metrics for the frontend dashboard.
 */

import { Signer } from '../domain/entities/Signer';

/**
 * Interface for envelope progress statistics
 */
export interface EnvelopeProgress {
  /** Total number of signers */
  total: number;
  /** Number of signers who have signed */
  signed: number;
  /** Number of signers pending to sign */
  pending: number;
  /** Number of signers who declined */
  declined: number;
  /** Completion percentage (0-100) */
  percentage: number;
}

/**
 * Calculates signing progress for an envelope based on signer statuses
 * 
 * @param signers - Array of signer entities
 * @returns Progress summary object with statistics
 * 
 * @example
 * ```typescript
 * const progress = calculateEnvelopeProgress(signers);
 * console.log(`Progress: ${progress.percentage}% (${progress.signed}/${progress.total})`);
 * ```
 */
export function calculateEnvelopeProgress(signers: Signer[]): EnvelopeProgress {
  const total = signers.length;
  
  if (total === 0) {
    return {
      total: 0,
      signed: 0,
      pending: 0,
      declined: 0,
      percentage: 0
    };
  }

  const signed = signers.filter(signer => signer.getStatus() === 'SIGNED').length;
  const pending = signers.filter(signer => signer.getStatus() === 'PENDING').length;
  const declined = signers.filter(signer => signer.getStatus() === 'DECLINED').length;
  const percentage = Math.round((signed / total) * 100);

  return {
    total,
    signed,
    pending,
    declined,
    percentage
  };
}

/**
 * Determines if an envelope is completed based on signer statuses
 * 
 * @param signers - Array of signer entities
 * @returns true if all signers have either signed or declined
 * 
 * @example
 * ```typescript
 * const isCompleted = isEnvelopeCompleted(signers);
 * if (isCompleted) {
 *   // Handle completed envelope
 * }
 * ```
 */
export function isEnvelopeCompleted(signers: Signer[]): boolean {
  return signers.every(signer => 
    signer.getStatus() === 'SIGNED' || signer.getStatus() === 'DECLINED'
  );
}

/**
 * Gets the next signer in the signing order based on envelope signing order type
 * 
 * @param signers - Array of signer entities
 * @param signingOrderType - The signing order type (OWNER_FIRST or INVITEES_FIRST)
 * @returns The next signer to sign, or null if none pending
 * 
 * @description Signing order logic:
 * - OWNER_FIRST: Owner signs first, then all invited signers (no specific order among invitees)
 * - INVITEES_FIRST: All invited signers sign first (no specific order), then owner signs last
 * 
 * @example
 * ```typescript
 * const nextSigner = getNextSigner(signers, SigningOrderType.OWNER_FIRST);
 * if (nextSigner) {
 *   // Send notification to next signer
 * }
 * ```
 */
export function getNextSigner(signers: Signer[], signingOrderType: 'OWNER_FIRST' | 'INVITEES_FIRST'): Signer | null {
  if (signingOrderType === 'OWNER_FIRST') {
    // Owner signs first, then any pending invitees
    const owner = signers.find(signer => signer.getOrder() === 1); // Owner is always order 1
    if (owner && owner.getStatus() === 'PENDING') {
      return owner;
    }
    // Return any pending invitee (no specific order among invitees)
    return signers.find(signer => signer.getOrder() > 1 && signer.getStatus() === 'PENDING') || null;
  } else {
    // INVITEES_FIRST: Invitees sign first, then owner
    const pendingInvitees = signers.filter(signer => signer.getOrder() > 1 && signer.getStatus() === 'PENDING');
    if (pendingInvitees.length > 0) {
      return pendingInvitees[0]; // Return first pending invitee (no specific order)
    }
    // If no pending invitees, owner can sign
    const owner = signers.find(signer => signer.getOrder() === 1);
    return (owner && owner.getStatus() === 'PENDING') ? owner : null;
  }
}
