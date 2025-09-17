/**
 * @fileoverview RetrieveDocumentRequest - Request interface for retrieving documents from S3
 * @summary Defines the request structure for retrieving documents from S3
 * @description This interface defines the complete request structure for retrieving
 * documents from S3, including all required fields for document access.
 */

import { EnvelopeId } from '../../value-objects/EnvelopeId';
import { SignerId } from '../../value-objects/SignerId';

/**
 * Request interface for retrieving documents from S3
 * 
 * This interface defines the complete request structure for retrieving
 * documents from S3. It includes all required fields for document
 * access operations.
 */
export interface RetrieveDocumentRequest {
  /**
   * Identifier of the envelope containing the document
   */
  readonly envelopeId: EnvelopeId;

  /**
   * Identifier of the signer associated with the document
   */
  readonly signerId: SignerId;

  /**
   * S3 key of the document to retrieve
   * This is the unique identifier for the document in S3
   */
  readonly documentKey: string;
}

