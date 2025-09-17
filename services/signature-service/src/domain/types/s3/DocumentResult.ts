/**
 * @fileoverview DocumentResult - Result interface for S3 document operations
 * @summary Defines the result structure for S3 document operations
 * @description This interface defines the complete result structure for S3
 * document operations, including metadata and location information.
 */

/**
 * Result interface for S3 document operations
 * 
 * This interface defines the complete result structure for S3
 * document operations. It provides information about the document
 * location, metadata, and access details.
 */
export interface DocumentResult {
  /**
   * S3 key of the document
   * This is the unique identifier for the document in S3
   */
  readonly documentKey: string;

  /**
   * Full S3 location URI
   * Format: s3://bucket-name/document-key
   */
  readonly s3Location: string;

  /**
   * MIME type of the document content
   * Examples: 'application/pdf', 'image/jpeg', 'text/plain'
   */
  readonly contentType: string;

  /**
   * File size in bytes
   * Only present when available from S3 metadata
   */
  readonly size?: number;

  /**
   * Last modified timestamp
   * Only present when available from S3 metadata
   */
  readonly lastModified?: Date;
}

