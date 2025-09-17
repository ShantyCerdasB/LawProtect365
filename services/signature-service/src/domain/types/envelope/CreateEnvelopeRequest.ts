/**
 * @fileoverview CreateEnvelopeRequest type - Defines request structure for creating envelopes
 * @summary Type definition for envelope creation requests
 * @description The CreateEnvelopeRequest interface defines the data structure required for
 * creating new envelopes in the system, extending the metadata request with document and signer information.
 */

import { CreateEnvelopeMetadataRequest } from './CreateEnvelopeMetadataRequest';

/**
 * Request to create a complete envelope
 * Extends the metadata request with document and signer information
 */
export interface CreateEnvelopeRequest extends CreateEnvelopeMetadataRequest {
  /**
   * Hash of the document to be signed
   */
  documentHash: string;

  /**
   * S3 key where the document is stored
   */
  s3Key: string;

  /**
   * Optional array of signers to be added to the envelope
   */
  signers?: Array<{
    /**
     * Email address of the signer
     */
    email: string;

    /**
     * Full name of the signer
     */
    fullName: string;

    /**
     * Order in which the signer should sign (1-based)
     */
    order: number;
  }>;
}
