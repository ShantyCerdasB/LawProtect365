/**
 * @fileoverview SignDocumentResult - Result interface for document signing operations
 * @summary Contains the result of a successful document signing operation
 * @description This interface defines the structure for document signing results,
 * including signature information, envelope status, and success message.
 */

import { SignatureInfo } from './SignatureInfo';
import { EnvelopeInfo } from './EnvelopeInfo';

export interface SignDocumentResult {
  /** Success message */
  message: string;
  /** Signature information */
  signature: SignatureInfo;
  /** Envelope information */
  envelope: EnvelopeInfo;
}
