/**
 * @file RequestToken entity.
 * @description
 * Temporary token for secure party access to sign/view.
 */

export interface RequestToken {
  /** Token value (opaque, random). */
  tokenId: string;
  /** Party the token belongs to. */
  partyId: string;
  /** Envelope context. */
  envelopeId: string;
  /** Expiration timestamp (ISO8601). */
  expiresAt: string;
  /** Creation timestamp (ISO8601). */
  createdAt: string;
}






