/**
 * @file RequestToken entity.
 * @description
 * Temporary token for secure party access to sign/view.
 */

export interface RequestToken {
  /** Token value (opaque, random). */
  readonly tokenId: string;
  /** Party the token belongs to. */
  readonly partyId: string;
  /** Envelope context. */
  readonly envelopeId: string;
  /** Expiration timestamp (ISO8601). */
  readonly expiresAt: string;
  /** Creation timestamp (ISO8601). */
  readonly createdAt: string;
}

