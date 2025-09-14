/**
 * @fileoverview UpdateSignatureRequest type - Defines the structure for updating signature records
 * @summary Type definition for signature update requests
 * @description The UpdateSignatureRequest interface defines the data structure for
 * updating existing signature records, primarily for status changes and metadata updates.
 */

import type { SignatureStatus } from '../../enums/SignatureStatus';

/**
 * Request to update an existing signature record
 */
export interface UpdateSignatureRequest {
  /**
   * The signature status to update
   */
  status?: SignatureStatus;

  /**
   * Additional metadata for the signature (optional)
   */
  metadata?: {
    reason?: string;
    location?: string;
    certificateInfo?: {
      issuer: string;
      subject: string;
      validFrom: Date;
      validTo: Date;
      certificateHash: string;
    };
    ipAddress?: string;
    userAgent?: string;
  };
}
