/**
 * @fileoverview StoreDocumentRequest - Request interface for storing documents in S3
 * @summary Defines the request structure for storing documents in S3
 * @description This interface defines the complete request structure for storing
 * documents in S3, including all required fields and metadata.
 */

import { EnvelopeId } from '../../value-objects/EnvelopeId';
import { SignerId } from '../../value-objects/SignerId';

/**
 * Request interface for storing documents in S3
 * 
 * This interface defines the complete request structure for storing
 * documents in S3. It includes all required fields for document
 * storage operations and metadata tracking.
 */
export interface StoreDocumentRequest {
  /**
   * Identifier of the envelope containing the document
   */
  readonly envelopeId: EnvelopeId;

  /**
   * Identifier of the signer associated with the document
   */
  readonly signerId: SignerId;

  /**
   * Document content to be stored
   * Can be Buffer, Uint8Array, or string
   */
  readonly documentContent: Buffer | Uint8Array | string;

  /**
   * MIME type of the document content
   * Examples: 'application/pdf', 'image/jpeg', 'text/plain'
   */
  readonly contentType: string;

  /**
   * Optional metadata for the document
   */
  readonly metadata?: {
    /**
     * Original filename of the document
     */
    readonly originalFileName?: string;

    /**
     * File size in bytes
     */
    readonly fileSize?: number;

    /**
     * Checksum or hash of the document content
     */
    readonly checksum?: string;
  };
}

