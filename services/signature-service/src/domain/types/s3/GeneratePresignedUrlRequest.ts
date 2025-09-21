/**
 * @fileoverview GeneratePresignedUrlRequest - Interface for presigned URL generation
 * @summary Defines data structure for generating presigned URLs for S3 operations
 * @description This interface provides type-safe specifications for presigned URL
 * generation, including operation type, expiration, and access control.
 */

import { EnvelopeId } from '../../value-objects/EnvelopeId';
import { SignerId } from '../../value-objects/SignerId';
import { S3Key } from '../../value-objects/S3Key';
import { S3Operation } from '../../value-objects/S3Operation';

export interface GeneratePresignedUrlRequest {
  documentKey: S3Key;
  operation: S3Operation;
  envelopeId: EnvelopeId;
  signerId: SignerId;
  expiresIn?: number;
}