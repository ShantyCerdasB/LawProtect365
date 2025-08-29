/**
 * @file Signature entity.
 * @description
 * Records an actual signature action by a party on an input.
 */

import { SignatureMethod } from "../values/enums";



/**
 * Signature domain entity.
 */
export interface Signature {
  /** Unique identifier of the signature. */
  signatureId: string;
  /** Input the signature fulfills. */
  inputId: string;
  /** Party who signed. */
  partyId: string;
  /** Envelope context. */
  envelopeId: string;
  /** Method used (drawn, typed, uploaded). */
  method: SignatureMethod;
  /** Binary blob location in S3 (bucket/key). */
  bucket: string;
  key: string;
  /** Signature timestamp (ISO8601). */
  signedAt: string;
}
