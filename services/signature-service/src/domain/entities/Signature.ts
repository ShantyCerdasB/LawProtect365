/**
 * @file Signature.ts
 * @summary Signature domain entity for completed signature actions
 * @description Signature domain entity that records actual signature actions by parties on inputs.
 * Represents a completed signature with metadata including method, location, and timestamp.
 */

/**
 * @file Signature entity.
 * @description
 * Records an actual signature action by a party on an input.
 */

import { SignatureMethod } from "../values/enums";

/**
 * @description Signature domain entity representing a completed signature action.
 * Contains all metadata about a signature including the signer, method, location, and timing.
 */
export interface Signature {
  /** Unique identifier of the signature */
  readonly signatureId: string;
  /** Input the signature fulfills */
  readonly inputId: string;
  /** Party who signed */
  readonly partyId: string;
  /** Envelope context */
  readonly envelopeId: string;
  /** Method used (drawn, typed, uploaded) */
  readonly method: SignatureMethod;
  /** Binary blob location in S3 (bucket/key) */
  readonly bucket: string;
  /** S3 key for the signature binary data */
  readonly key: string;
  /** Signature timestamp (ISO8601) */
  readonly signedAt: string;
}

