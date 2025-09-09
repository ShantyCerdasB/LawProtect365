/**
 * @file S3EvidenceStorage.ts
 * @summary AWS S3 adapter implementing the shared `S3Port` (put/get/head/delete).
 * @description
 * Uses the AWS SDK v3 `S3Client` with a shared jittered backoff strategy to retry
 * throttling and transient failures. All AWS errors are normalized via `mapAwsError`.
 *
 * @remarks
 * - Retries use `shouldRetry` with `isAwsRetryable` to decide attempt and delay.
 * - `withRetry` centralizes retry and error mapping.
 * - `headObject` returns a discriminated union via `{ exists: boolean }`.
 * - Constructor supports domain defaults (`defaultBucket`, `defaultKmsKeyId`, `defaultCacheControl`, `defaultAcl`)
 *   that are applied only when the per-call input omits them at runtime.
 *
 * @example
 * ```ts
 * import { S3Client } from "@aws-sdk/client-s3";
 * import { S3EvidenceStorage } from "./S3EvidenceStorage";
 *
 * const s3 = new S3Client({ region: "us-east-1" });
 * const storage = new S3EvidenceStorage(s3, {
 *   maxAttempts: 5,
 *   defaultBucket: "my-bucket",
 *   defaultKmsKeyId: "arn:aws:kms:us-east-1:123456789012:key/abcd",
 *   defaultCacheControl: "max-age=300",
 *   defaultAcl: "private",
 * });
 *
 * // Put (per-call values override constructor defaults)
 * await storage.putObject({
 *   bucket: "my-bucket",
 *   key: "path/file.txt",
 *   body: Buffer.from("hello"),
 *   contentType: "text/plain",
 * });
 *
 * // Head (bucket param is still required by S3Port; at runtime an empty string will fallback to defaultBucket)
 * const head = await storage.headObject("my-bucket", "path/file.txt");
 * if (head.exists) console.log(head.size, head.etag);
 * ```
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  type GetObjectCommandOutput,
} from "@aws-sdk/client-s3";

import type { S3Port, S3PutObjectInput, S3GetObjectOutput } from "../ports.js";
import { shouldRetry, isAwsRetryable, mapAwsError, sleep } from "../../index.js";
import type { S3EvidenceStorageOptions, HeadResult } from "./types.js";

/**
 * S3-backed implementation of the shared {@link S3Port}.
 *
 * @remarks
 * - All operations use a shared retry wrapper with exponential jittered backoff.
 * - AWS errors are mapped to a shared error model via {@link mapAwsError}.
 * - Bucket in method signatures remains required by the `S3Port` contract; however,
 *   at runtime an empty string will fallback to the configured `defaultBucket`.
 */
export class S3EvidenceStorage implements S3Port {
  /** Underlying AWS SDK v3 S3 client. */
  private readonly s3: S3Client;

  /** Maximum number of attempts for each operation. */
  private readonly maxAttempts: number;

  /** Optional domain defaults applied when per-call values are omitted. */
  private readonly defaultBucket?: string;
  private readonly defaultKmsKeyId?: string;
  private readonly defaultCacheControl?: string;
  private readonly defaultAcl?: "private" | "public-read";

  /**
   * Creates a new {@link S3EvidenceStorage}.
   *
   * @param client - Preconfigured AWS SDK v3 {@link S3Client}.
   * @param opts - Optional configuration (retry attempts and domain defaults).
   *
   * @throws {@link Error} If invalid options are provided.
   */
  constructor(client: S3Client, opts: S3EvidenceStorageOptions = {}) {
    this.s3 = client;
    this.maxAttempts = Math.max(1, opts.maxAttempts ?? 3);
    this.defaultBucket = opts.defaultBucket;
    this.defaultKmsKeyId = opts.defaultKmsKeyId;
    this.defaultCacheControl = opts.defaultCacheControl;
    this.defaultAcl = opts.defaultAcl;
  }

  /**
   * Uploads an object to S3.
   *
   * @param input - Put parameters including bucket, key, and body. Optionally includes
   *  content type, metadata, cache control, ACL, and KMS key.
   *
   * @returns An object containing the ETag and VersionId (when bucket versioning is enabled).
   *
   * @throws Error - A mapped AWS error via {@link mapAwsError} if the operation ultimately fails.
   *
   * @example
   * ```ts
   * await storage.putObject({
   *   bucket: "my-bucket",
   *   key: "path/file.json",
   *   body: JSON.stringify({ ok: true }),
   *   contentType: "application/json",
   *   // cacheControl/kmsKeyId/acl omitted -> fall back to constructor defaults when present
   * });
   * ```
   */
  async putObject(input: S3PutObjectInput): Promise<{ etag?: string; versionId?: string }> {
    const ctx = "S3EvidenceStorage.putObject";
    return this.withRetry(ctx, async () => {
      const bucket = input.bucket || this.defaultBucket;
      if (!bucket) throw new Error("bucket is required (no defaultBucket configured)");

      const kmsKeyId = input.kmsKeyId ?? this.defaultKmsKeyId;
      const cacheControl = input.cacheControl ?? this.defaultCacheControl;
      const acl = input.acl ?? this.defaultAcl;

      const res = await this.s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: input.key,
          Body: input.body as any,
          ContentType: input.contentType,
          Metadata: input.metadata,
          CacheControl: cacheControl,
          ACL: acl,
          ...(kmsKeyId
            ? {
                ServerSideEncryption: "aws:kms",
                SSEKMSKeyId: kmsKeyId,
              }
            : {}),
        })
      );
      return { etag: res.ETag, versionId: res.VersionId };
    });
  }

  /**
   * Retrieves an object from S3.
   *
   * @param bucket - The S3 bucket name (empty string will fallback to `defaultBucket` if configured).
   * @param key - The object key.
   * @param rangeBytes - Optional HTTP Range header value (e.g., `"bytes=0-1023"`).
   *
   * @returns The object body (stream in Node.js), content type, metadata, ETag, and last modified time.
   *
   * @throws Error - A mapped AWS error via {@link mapAwsError} if the operation ultimately fails.
   */
  async getObject(bucket: string, key: string, rangeBytes?: string): Promise<S3GetObjectOutput> {
    const ctx = "S3EvidenceStorage.getObject";
    return this.withRetry(ctx, async () => {
      const b = bucket || this.defaultBucket;
      if (!b) throw new Error("bucket is required (no defaultBucket configured)");

      const res: GetObjectCommandOutput = await this.s3.send(
        new GetObjectCommand({
          Bucket: b,
          Key: key,
          Range: rangeBytes,
        })
      );
      // `Body` is a stream in Node in most environments; surfaced as-is.
      return {
        body: (res.Body ?? new Uint8Array()) as any,
        contentType: res.ContentType ?? undefined,
        metadata: res.Metadata,
        etag: res.ETag ?? undefined,
        lastModified: res.LastModified ?? undefined,
      };
    });
  }

  /**
   * Checks whether an object exists and, if so, returns its metadata.
   *
   * @param bucket - The S3 bucket name (empty string will fallback to `defaultBucket` if configured).
   * @param key - The object key.
   *
   * @returns A {@link HeadResult}:
   * - `{ exists: false }` if the object is not found (HTTP 404).
   * - `{ exists: true, ... }` with size, ETag, lastModified, and metadata when found.
   *
   * @throws Error - A mapped AWS error via {@link mapAwsError} if a non-404 error ultimately occurs.
   */
  async headObject(bucket: string, key: string): Promise<HeadResult> {
    const ctx = "S3EvidenceStorage.headObject";
    return this.withRetry<HeadResult>(
      ctx,
      async () => {
        const b = bucket || this.defaultBucket;
        if (!b) throw new Error("bucket is required (no defaultBucket configured)");

        const res = await this.s3.send(
          new HeadObjectCommand({
            Bucket: b,
            Key: key,
          })
        );
        return {
          exists: true,
          size: res.ContentLength ?? undefined,
          etag: res.ETag ?? undefined,
          lastModified: res.LastModified ?? undefined,
          metadata: res.Metadata,
        };
      },
      async (err) => {
        // 404 should not be mapped as an exception here; return exists=false.
        const name = (err as any)?.name;
        const code = (err as any)?.$metadata?.httpStatusCode;
        if (name === "NotFound" || code === 404) {
          return { exists: false };
        }
        throw err;
      }
    );
  }

  /**
   * Deletes an object from S3.
   *
   * @param bucket - The S3 bucket name (empty string will fallback to `defaultBucket` if configured).
   * @param key - The object key.
   *
   * @returns A promise that resolves when the delete completes.
   *
   * @throws Error - A mapped AWS error via {@link mapAwsError} if the operation ultimately fails.
   */
  async deleteObject(bucket: string, key: string): Promise<void> {
    const ctx = "S3EvidenceStorage.deleteObject";
    await this.withRetry(ctx, async () => {
      const b = bucket || this.defaultBucket;
      if (!b) throw new Error("bucket is required (no defaultBucket configured)");

      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: b,
          Key: key,
        })
      );
    });
  }

  /**
   * Shared retry wrapper that applies the standard retry policy and error mapping.
   *
   * @typeParam T - The resolved type of the operation.
   *
   * @param op - A concise operation name used for error context.
   * @param fn - The operation to execute. If it throws, retry may occur based on policy.
   * @param onFinalNonRetryable - Optional handler invoked when the last error is deemed
   * non-retryable or attempts are exhausted. If provided, its return value is used as the
   * final result; otherwise the error is mapped and rethrown.
   *
   * @returns The result of `fn()` or `onFinalNonRetryable()` when applicable.
   *
   * @throws Error - A mapped AWS error via {@link mapAwsError} when retries are exhausted
   * and `onFinalNonRetryable` is not provided.
   */
  private async withRetry<T>(
    op: string,
    fn: () => Promise<T>,
    onFinalNonRetryable?: (err: unknown) => Promise<T>
  ): Promise<T> {
    let lastErr: unknown;
    for (let attempt = 0; attempt < this.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastErr = err;
        const { retry, delayMs } = shouldRetry(attempt, this.maxAttempts, isAwsRetryable, err);
        if (!retry) {
          if (onFinalNonRetryable) return onFinalNonRetryable(err);
          throw mapAwsError(err, op);
        }
        await sleep(delayMs);
      }
    }
    throw mapAwsError(lastErr, op);
  }
}






