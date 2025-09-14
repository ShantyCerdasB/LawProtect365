/**
 * @fileoverview UpdateConsentRequest type - Defines the structure for updating consent records
 * @summary Type definition for consent update requests
 * @description The UpdateConsentRequest interface defines the data structure for
 * updating existing consent records, primarily for linking with signatures.
 */

import type { SignatureId } from '../../value-objects/SignatureId';

/**
 * Request to update an existing consent record
 */
export interface UpdateConsentRequest {
  /**
   * The signature ID to link with this consent
   */
  signatureId?: SignatureId;

  /**
   * Additional metadata for the consent (optional)
   */
  metadata?: Record<string, unknown>;
}
