/**
 * @file S3ObjectRef.ts
 * @summary S3 object reference value objects for storage management
 * @description S3 object reference value objects for storage management.
 * Provides branded types and schemas for S3 object references with validation and metadata support.
 */

import type { Brand } from "@lawprotect/shared-ts";

/**
 * @description Branded ETag string for S3 objects.
 * Compile-time type safety for S3 entity tags.
 */
export type S3ETag = Brand<string, "S3ETag">;

/**
 * @description Branded VersionId string for S3 objects.
 * Compile-time type safety for S3 object version identifiers.
 */
export type S3ObjectVersionId = Brand<string, "S3ObjectVersionId">;

/**
 * @description Reference to an object in S3-compatible storage.
 * Contains bucket, key, and optional metadata for S3 object identification.
 */
export interface S3ObjectRef {
  /** S3 bucket name */
  bucket: string;
  /** S3 object key */
  key: string;
  /** Optional content type */
  contentType?: string;
  /** Optional ETag for integrity verification */
  etag?: S3ETag;
  /** Optional version ID for versioned objects */
  versionId?: S3ObjectVersionId;
}