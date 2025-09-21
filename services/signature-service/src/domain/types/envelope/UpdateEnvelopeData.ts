/**
 * @fileoverview UpdateEnvelopeData - Type definition for envelope update data
 * @summary Defines the structure for envelope update operations
 * @description This interface provides type safety for envelope update operations
 * in the SignatureEnvelopeService, allowing partial updates of envelope fields.
 */

import { SigningOrder } from '../../value-objects/SigningOrder';

/**
 * Data structure for envelope updates
 * @interface UpdateEnvelopeData
 */
export interface UpdateEnvelopeData {
  /** Updated title of the envelope */
  title?: string;
  /** Updated description of the envelope */
  description?: string;
  /** Updated expiration date */
  expiresAt?: Date;
  /** Updated signing order configuration */
  signingOrder?: SigningOrder;
}
