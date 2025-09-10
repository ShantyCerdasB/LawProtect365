/**
 * @file S3PresignerTypes.ts
 * @summary Types for S3 presigner operations
 * @description Defines interfaces and types for S3 presigner functionality
 */

import type { S3AclType } from "../../../domain/values/enums";

/**
 * Construction options for S3Presigner.
 * All values are used only when the per-call input does not provide them.
 */
export interface S3PresignerOptions {
  /**
   * Default time-to-live for pre-signed URLs, in seconds.
   * Applied when a per-call `expiresInSeconds` is not provided.
   * @defaultValue 900 (15 minutes)
   */
  defaultTtl?: number;

  /**
   * Default canned ACL for PUT operations (e.g., "private", "public-read").
   * Applied when `input.acl` is not provided to putObjectUrl.
   */
  defaultAcl?: S3AclType;

  /**
   * Default Cache-Control header for PUT operations.
   * Applied when `input.cacheControl` is not provided to putObjectUrl.
   */
  defaultCacheControl?: string;

  /**
   * Default KMS key ARN/ID for SSE-KMS on PUT operations.
   * Applied when `input.kmsKeyId` is not provided to putObjectUrl.
   */
  defaultKmsKeyId?: string;
} 

