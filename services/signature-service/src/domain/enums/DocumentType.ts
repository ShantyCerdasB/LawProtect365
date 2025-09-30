/**
 * @fileoverview DocumentType - Enum for document types in S3 storage
 * @summary Defines all possible document types for S3 operations
 * @description This enum provides type-safe document type classification for
 * S3 storage operations, covering source, metadata, flattened, and signed documents.
 */

export enum DocumentType {
  SOURCE = 'source',
  META = 'meta',
  FLATTENED = 'flattened',
  SIGNED = 'signed'
}
