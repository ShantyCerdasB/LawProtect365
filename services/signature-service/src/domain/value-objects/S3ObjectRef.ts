import { z, TrimmedString } from "@lawprotect/shared-ts";
import type { Brand } from "@lawprotect/shared-ts";

/**
 * Branded ETag string for S3 objects.
 */
export type S3ETag = Brand<string, "S3ETag">;

/**
 * Branded VersionId string for S3 objects.
 */
export type S3ObjectVersionId = Brand<string, "S3ObjectVersionId">;

/**
 * Reference to an object in S3-compatible storage.
 */
export interface S3ObjectRef {
  bucket: string;
  key: string;
  contentType?: string;
  etag?: S3ETag;
  versionId?: S3ObjectVersionId;
}

/**
 * S3 object reference schema.
 */
export const S3ObjectRefSchema = z.object({
  bucket: TrimmedString.pipe(z.string().min(3)),
  key: TrimmedString,
  contentType: TrimmedString.optional(),
  etag: TrimmedString.transform((v) => v as S3ETag).optional(),
  versionId: TrimmedString.transform((v) => v as S3ObjectVersionId).optional(),
});
