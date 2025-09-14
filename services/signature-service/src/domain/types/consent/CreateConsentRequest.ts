/**
 * @fileoverview CreateConsentRequest type - Defines the structure for creating consent records
 * @summary Type definition for consent creation requests
 * @description The CreateConsentRequest interface defines the data structure required for
 * creating a new consent record, including all necessary metadata for legal compliance.
 */

import type { EnvelopeId } from '../../value-objects/EnvelopeId';
import type { SignerId } from '../../value-objects/SignerId';
import type { SignatureId } from '../../value-objects/SignatureId';

/**
 * Request to create a new consent record
 */
export interface CreateConsentRequest {
  /**
   * The envelope ID this consent belongs to
   */
  envelopeId: EnvelopeId;

  /**
   * The signer ID who is giving consent
   */
  signerId: SignerId;

  /**
   * The signature ID that will be linked to this consent
   */
  signatureId: SignatureId;

  /**
   * Whether consent was given (should always be true if this request is made)
   */
  consentGiven: boolean;

  /**
   * The timestamp when consent was given
   */
  consentTimestamp: Date;

  /**
   * The consent text that was shown to the signer
   */
  consentText: string;

  /**
   * The IP address of the signer when consent was given
   */
  ipAddress: string;

  /**
   * The user agent of the signer's browser
   */
  userAgent: string;
}
