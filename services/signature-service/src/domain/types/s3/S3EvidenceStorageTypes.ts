/**
 * @file S3EvidenceStorageTypes.ts
 * @summary Types for S3 evidence storage operations
 * @description Defines interfaces and types for S3 evidence storage functionality
 */

import type { S3AclType } from "../../../domain/values/enums";

/**
 * Construction options for S3EvidenceStorage.
 * Defaults are applied *only if* the corresponding per-call parameter is omitted/falsy at runtime.
 */
export interface S3EvidenceStorageOptions {
  /**
   * Maximum number of attempts for AWS SDK calls, including the first try.
   * @defaultValue 3
   */
  maxAttempts?: number;

  /**
   * Default S3 bucket name used when a per-call bucket is not provided (or is an empty string).
   */
  defaultBucket?: string;

  /**
   * Default KMS key ARN/ID used for SSE-KMS on PUT when `kmsKeyId` is omitted per call.
   */
  defaultKmsKeyId?: string;

  /**
   * Default Cache-Control header for PUT when `cacheControl` is omitted per call.
   */
  defaultCacheControl?: string;

  /**
   * Default canned ACL for PUT when `acl` is omitted per call.
   */
  defaultAcl?: S3AclType;
}

/**
 * Result shape for S3EvidenceStorage.headObject.
 *
 * @remarks
 * This is a discriminated union keyed by `exists`. When `exists` is `false`,
 * only the `exists` property is present. When `exists` is `true`, additional
 * metadata fields are available.
 */
export type HeadResult =
  | { exists: false }
  | {
      exists: true;
      size?: number;
      etag?: string;
      lastModified?: Date;
      metadata?: Record<string, string>;
    }; 

