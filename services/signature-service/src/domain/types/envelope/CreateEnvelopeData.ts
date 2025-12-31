/**
 * @fileoverview CreateEnvelopeData - Type definition for envelope creation data
 * @summary Defines the structure for envelope creation requests
 * @description This interface provides type safety for envelope creation operations
 * in the SignatureEnvelopeService, ensuring all required fields are provided.
 */

import { EnvelopeId } from '../../value-objects/EnvelopeId';
import { DocumentOrigin } from '../../value-objects/DocumentOrigin';
import { SigningOrder } from '../../value-objects/SigningOrder';

/**
 * Data structure for envelope creation
 * @interface CreateEnvelopeData
 */
export interface CreateEnvelopeData {
  /** Unique identifier for the envelope */
  id: EnvelopeId;
  /** ID of the user who created the envelope */
  createdBy: string;
  /** Title of the envelope */
  title: string;
  /** Optional description of the envelope */
  description?: string;
  /** Document origin information */
  origin: DocumentOrigin;
  /** Signing order configuration */
  signingOrder: SigningOrder;
  /** Optional expiration date */
  expiresAt?: Date;
  /** Source key from Document Service */
  sourceKey?: string;
  /** Meta key from Document Service */
  metaKey?: string;
}
