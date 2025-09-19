/**
 * @fileoverview CreateSignerRequest type - Defines the structure for creating signer records
 * @summary Type definition for signer creation requests
 * @description The CreateSignerRequest interface defines the data structure required for
 * creating a new signer record, including all necessary metadata for signing workflow.
 */

import type { SignerId } from '../../value-objects/SignerId';
import type { EnvelopeId } from '../../value-objects/EnvelopeId';
import type { Email } from '../../value-objects/Email';
import type { SignerStatus } from '@lawprotect/shared-ts';

/**
 * Request to create a new signer record
 */
export interface CreateSignerDomainRequest {
  /**
   * The signer unique identifier
   */
  id: SignerId;

  /**
   * The envelope ID this signer belongs to
   */
  envelopeId: EnvelopeId;

  /**
   * The signer's email address
   */
  email: Email;

  /**
   * The signer's full name
   */
  fullName: string;

  /**
   * The signer status
   */
  status: SignerStatus;

  /**
   * The signing order for this signer
   */
  order: number;

  /**
   * Optional timestamp when the signer signed
   */
  signedAt?: Date;

  /**
   * Optional timestamp when the signer declined
   */
  declinedAt?: Date;

  /**
   * Optional invitation token for external signers
   */
  invitationToken?: string;

  /**
   * Signer metadata
   */
  metadata: {
    /**
     * IP address of the signer
     */
    ipAddress?: string;

    /**
     * User agent of the signer's browser
     */
    userAgent?: string;

    /**
     * Whether consent was given
     */
    consentGiven: boolean;

    /**
     * Timestamp when consent was given
     */
    consentTimestamp?: Date;

    /**
     * Reason for declining (if applicable)
     */
    declineReason?: string;
  };
}
