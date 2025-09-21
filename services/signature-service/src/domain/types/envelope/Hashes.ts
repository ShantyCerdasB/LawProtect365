/**
 * @fileoverview Hashes - Interface for document hashes update operations
 * @summary Defines document hash fields for envelope update operations
 * @description This interface provides type-safe document hash updates for envelope
 * document integrity verification operations.
 */

/**
 * Document hashes update interface
 * @interface Hashes
 */
export interface Hashes {
  /** SHA-256 hash of source document */
  sourceSha256?: string;
  /** SHA-256 hash of flattened document */
  flattenedSha256?: string;
  /** SHA-256 hash of signed document */
  signedSha256?: string;
}
