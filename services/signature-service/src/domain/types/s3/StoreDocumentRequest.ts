/**
 * @fileoverview StoreDocumentRequest - Interface for document storage operations
 * @summary Defines data structure for storing documents in S3
 * @description This interface provides type-safe specifications for document storage
 * operations, including content, metadata, and validation requirements.
 */

import { EnvelopeId } from '../../value-objects/EnvelopeId';
import { SignerId } from '../../value-objects/SignerId';
import { ContentType } from '../../value-objects/ContentType';

export interface StoreDocumentRequest {
  envelopeId: EnvelopeId;
  signerId: SignerId;
  documentContent: Buffer;
  contentType: ContentType;
  metadata?: {
    originalFileName?: string;
    fileSize?: number;
    checksum?: string;
  };
}