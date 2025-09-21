/**
 * @fileoverview S3Keys - Interface for S3 keys update operations
 * @summary Defines S3 key fields for envelope update operations
 * @description This interface provides type-safe S3 key updates for envelope
 * document storage operations.
 */

/**
 * S3 keys update interface
 * @interface S3Keys
 */
export interface S3Keys {
  /** S3 key for source document */
  sourceKey?: string;
  /** S3 key for metadata document */
  metaKey?: string;
  /** S3 key for flattened document */
  flattenedKey?: string;
  /** S3 key for signed document */
  signedKey?: string;
}
