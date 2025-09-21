/**
 * @fileoverview RetrieveDocumentRequest - Interface for document retrieval operations
 * @summary Defines data structure for retrieving documents from S3
 * @description This interface provides type-safe specifications for document retrieval
 * operations, including document key validation and access control.
 */

import { EnvelopeId } from '../../value-objects/EnvelopeId';
import { SignerId } from '../../value-objects/SignerId';
import { S3Key } from '../../value-objects/S3Key';

export interface RetrieveDocumentRequest {
  documentKey: S3Key;
  envelopeId: EnvelopeId;
  signerId: SignerId;
}