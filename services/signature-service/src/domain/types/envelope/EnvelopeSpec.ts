/**
 * @fileoverview EnvelopeSpec - Specification interface for envelope queries
 * @summary Defines query specifications for envelope repository operations
 * @description This interface provides type-safe query specifications for filtering
 * and searching envelope entities in the repository layer.
 */

import { EnvelopeStatus } from '../../value-objects/EnvelopeStatus';
import { SignerStatus } from '@prisma/client';

/**
 * Specification interface for envelope queries
 * @interface EnvelopeSpec
 */
export interface EnvelopeSpec {
  /** User ID who created the envelopes */
  createdBy?: string;
  /** Envelope status to filter by */
  status?: EnvelopeStatus;
  /** Title to search for */
  title?: string;
  /** Filter by expiration status */
  isExpired?: boolean;
  /** Filter by presence of signers */
  hasSigners?: boolean;
  /** Filter by specific signer status */
  signerStatus?: SignerStatus;
}
