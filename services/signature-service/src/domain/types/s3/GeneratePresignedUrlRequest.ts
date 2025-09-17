/**
 * @fileoverview GeneratePresignedUrlRequest - Request interface for generating presigned URLs
 * @summary Defines the request structure for generating presigned URLs for S3 access
 * @description This interface defines the complete request structure for generating
 * presigned URLs for S3 document access, including all required fields and options.
 */

import { EnvelopeId } from '../../value-objects/EnvelopeId';
import { SignerId } from '../../value-objects/SignerId';

/**
 * Request interface for generating presigned URLs for S3 access
 * 
 * This interface defines the complete request structure for generating
 * presigned URLs for S3 document access. It includes all required fields
 * for URL generation and optional configuration.
 */
export interface GeneratePresignedUrlRequest {
  /**
   * Identifier of the envelope containing the document
   */
  readonly envelopeId: EnvelopeId;

  /**
   * Identifier of the signer requesting access
   */
  readonly signerId: SignerId;

  /**
   * S3 key of the document to generate URL for
   * This is the unique identifier for the document in S3
   */
  readonly documentKey: string;

  /**
   * Operation type for the presigned URL
   * - 'get': For downloading/viewing the document
   * - 'put': For uploading/updating the document
   */
  readonly operation: 'get' | 'put';

  /**
   * Optional expiration time in seconds
   * Default: 3600 (1 hour)
   * Maximum: 604800 (1 week)
   */
  readonly expiresIn?: number;
}

