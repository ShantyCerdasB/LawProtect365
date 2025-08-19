/**
 * @file IdempotencyKey entity.
 * @description
 * Tracks idempotent operations (e.g., envelope send).
 */

export interface IdempotencyKey {
  /** Unique key value (e.g., hash of request). */
  key: string;
  /** Operation performed (domain-specific string). */
  operation: string;
  /** Envelope context if relevant. */
  envelopeId?: string;
  /** Request payload hash for replay protection. */
  payloadHash: string;
  /** Timestamp of first use (ISO8601). */
  createdAt: string;
  /** Expiration timestamp (ISO8601). */
  expiresAt: string;
}
