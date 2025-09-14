/**
 * @fileoverview UpdateSignerRequest type - Defines the structure for updating signer records
 * @summary Type definition for signer update requests
 * @description The UpdateSignerRequest interface defines the data structure for
 * updating existing signer records, primarily for status changes and metadata updates.
 */

import type { SignerStatus } from '../../enums/SignerStatus';

/**
 * Request to update an existing signer record
 */
export interface UpdateSignerDomainRequest {
  /**
   * The signer status to update
   */
  status?: SignerStatus;

  /**
   * Optional timestamp when the signer signed
   */
  signedAt?: Date;

  /**
   * Optional timestamp when the signer declined
   */
  declinedAt?: Date;

  /**
   * Additional metadata for the signer (optional)
   */
  metadata?: {
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
    consentGiven?: boolean;

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
