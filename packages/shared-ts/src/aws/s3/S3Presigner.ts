/**
 * @file S3Presigner.ts
 * @summary AWS S3 presigner implementing the shared S3Presigner port
 * @description AWS S3 presigner implementing the shared `S3Presigner` port.
 * Provides helpers to generate pre-signed GET and PUT URLs using the AWS SDK v3
 * `S3Client` and `@aws-sdk/s3-request-presigner` with configurable defaults and error handling.
 * @remarks
 * - Supports GET (with response header overrides) and PUT (with ACL, metadata, cache control).
 * - Optionally includes SSE-KMS settings for PUT when a KMS key is provided.
 * - Allows safe constructor defaults (TTL, ACL, Cache-Control, KMS key) that are used
 *   only when the per-call input omits them.
 * - All underlying AWS errors are normalized via `mapAwsError` for consistent handling.
 *
 * @example
 * ```ts
 * import { S3Client } from "@aws-sdk/client-s3";
 * import { S3Presigner } from "./S3Presigner";
 *
 * const s3 = new S3Client({ region: "us-east-1" });
 * const presigner = new S3Presigner(s3, {
 *   defaultTtl: 600,
 *   defaultAcl: "private",
 *   defaultCacheControl: "max-age=300",
 *   defaultKmsKeyId: "arn:aws:kms:us-east-1:123456789012:key/abcd-ef",
 * });
 *
 * // GET URL with response headers
 * const getUrl = await presigner.getObjectUrl({
 *   bucket: "my-bucket",
 *   key: "path/file.txt",
 *   responseContentType: "text/plain",
 *   responseContentDisposition: 'attachment; filename="file.txt"',
 *   expiresInSeconds: 300, // optional; falls back to defaultTtl otherwise
 * });
 *
 * // PUT URL that falls back to constructor defaults when fields are omitted
 * const putUrl = await presigner.putObjectUrl({
 *   bucket: "my-bucket",
 *   key: "uploads/new.txt",
 *   contentType: "text/plain",
 *   // acl/cacheControl/kmsKeyId omitted -> will use defaults from the constructor
 *   expiresInSeconds: 300,
 * });
 * ```
 */

import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import type {
  PresignGetObjectInput,
  PresignPutObjectInput,
} from "../s3Presign.js";
import { mapAwsError } from "../../index.js";
import type { S3PresignerOptions } from "./types.js";

/**
 * @description S3 pre-signing utility that implements the shared {@link S3PresignerPort}.
 *
 * @remarks
 * - Uses the calling credentials/config of the provided {@link S3Client}.
 * - Ensures `expiresIn` is at least one second to meet SDK constraints.
 * - Bucket is intentionally not fixed at construction to keep the presigner generic.
 */
export class S3Presigner {
  /** Underlying AWS SDK v3 S3 client used for command signing. */
  private readonly s3: S3Client;

  /** Default expiration (seconds) for generated URLs. */
  private readonly defaultTtl: number;

  /** Default canned ACL for PUT (optional). */
  private readonly defaultAcl?: "private" | "public-read";

  /** Default Cache-Control for PUT (optional). */
  private readonly defaultCacheControl?: string;

  /** Default SSE-KMS key for PUT (optional). */
  private readonly defaultKmsKeyId?: string;

  /**
   * Creates a new {@link S3Presigner}.
   *
   * @param client - A configured AWS SDK v3 {@link S3Client}.
   * @param opts - Optional defaults (TTL/ACL/Cache-Control/KMS key).
   *
   * @throws {@link Error} If invalid options are provided.
   */
  constructor(client: S3Client, opts: S3PresignerOptions = {}) {
    this.s3 = client;
    this.defaultTtl = Math.max(1, opts.defaultTtl ?? 900);
    this.defaultAcl = opts.defaultAcl;
    this.defaultCacheControl = opts.defaultCacheControl;
    this.defaultKmsKeyId = opts.defaultKmsKeyId;
  }

  /**
   * Generates a pre-signed GET object URL.
   *
   * @param input - Parameters for the GET operation:
   *  - `bucket`: S3 bucket name.
   *  - `key`: Object key.
   *  - `responseContentType`: Optional override for `Content-Type` of the response.
   *  - `responseContentDisposition`: Optional `Content-Disposition` override.
   *  - `expiresInSeconds`: Optional URL TTL (seconds). Falls back to constructor `defaultTtl`.
   *
   * @returns A pre-signed URL string usable with HTTP GET.
   *
   * @throws Error - A mapped AWS error via {@link mapAwsError} if signing fails.
   */
  async getObjectUrl(input: PresignGetObjectInput): Promise<string> {
    const ctx = "S3Presigner.getObjectUrl";
    try {
      const cmd = new GetObjectCommand({
        Bucket: input.bucket,
        Key: input.key,
        ResponseContentType: input.responseContentType,
        ResponseContentDisposition: input.responseContentDisposition,
      });
      return await getSignedUrl(this.s3, cmd, {
        expiresIn: Math.max(1, input.expiresInSeconds ?? this.defaultTtl),
      });
    } catch (err) {
      throw mapAwsError(err, ctx);
    }
  }

  /**
   * Generates a pre-signed PUT object URL.
   *
   * @param input - Parameters for the PUT operation:
   *  - `bucket`: S3 bucket name.
   *  - `key`: Object key.
   *  - `contentType`: Optional `Content-Type` to be enforced on upload.
   *  - `acl`: Optional canned ACL (e.g., `"private"`, `"public-read"`). Falls back to constructor `defaultAcl`.
   *  - `cacheControl`: Optional `Cache-Control` header. Falls back to constructor `defaultCacheControl`.
   *  - `metadata`: Optional user metadata.
   *  - `kmsKeyId`: Optional KMS key ARN/ID to request SSE-KMS. Falls back to constructor `defaultKmsKeyId`.
   *  - `expiresInSeconds`: Optional URL TTL (seconds). Falls back to constructor `defaultTtl`.
   *
   * @returns A pre-signed URL string usable with HTTP PUT.
   *
   * @throws Error - A mapped AWS error via {@link mapAwsError} if signing fails.
   */
  async putObjectUrl(input: PresignPutObjectInput): Promise<string> {
    const ctx = "S3Presigner.putObjectUrl";
    try {
      const acl = input.acl ?? this.defaultAcl;
      const cacheControl = input.cacheControl ?? this.defaultCacheControl;
      const kmsKeyId = input.kmsKeyId ?? this.defaultKmsKeyId;

      const cmd = new PutObjectCommand({
        Bucket: input.bucket,
        Key: input.key,
        ContentType: input.contentType,
        ACL: acl,
        CacheControl: cacheControl,
        Metadata: input.metadata,
        ...(kmsKeyId
          ? {
              ServerSideEncryption: "aws:kms",
              SSEKMSKeyId: kmsKeyId,
            }
          : {}),
      });
      return await getSignedUrl(this.s3, cmd, {
        expiresIn: Math.max(1, input.expiresInSeconds ?? this.defaultTtl),
      });
    } catch (err) {
      throw mapAwsError(err, ctx);
    }
  }
}






