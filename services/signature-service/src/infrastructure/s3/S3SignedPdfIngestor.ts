/**
 * @file S3SignedPdfIngestor.ts
 * @summary Focused helper to store final signed PDFs and return useful metadata.
 * @description
 * Provides a small wrapper around any {@link S3Port} (such as {@link S3EvidenceStorage})
 * to consistently upload finalized PDF documents to S3.
 *
 * @remarks
 * - Forces `Content-Type: application/pdf` on all uploads.
 * - Returns both storage metadata (ETag, VersionId) and a ready-to-use HTTPS URL.
 * - Supports both virtual-hosted-style and path-style URLs.
 * - Accepts constructor-level defaults (bucket/region/KMS/cache-control/path-style) that
 *   are used only when the per-call input omits those fields.
 * - Uses shared region helpers: {@link requireRegion} and {@link isValidRegion}.
 *
 * @example
 * ```ts
 * import { S3Client } from "@aws-sdk/client-s3";
 * import { S3EvidenceStorage } from "./S3EvidenceStorage";
 * import { S3SignedPdfIngestor } from "./S3SignedPdfIngestor";
 *
 * const s3 = new S3EvidenceStorage(new S3Client({ region: "us-east-1" }), {
 *   maxAttempts: 3,
 * });
 * const ingestor = new S3SignedPdfIngestor(s3, {
 *   defaultBucket: "legal-pdfs",
 *   // region can be omitted if AWS_REGION/AWS_DEFAULT_REGION is set in env;
 *   // otherwise set:
 *   defaultRegion: "us-east-1",
 *   defaultKmsKeyId: "arn:aws:kms:us-east-1:123456789012:key/abcd",
 * });
 *
 * const result = await ingestor.ingest({
 *   key: "contracts/contract-123.pdf",
 *   body: fs.readFileSync("contract.pdf"),
 *   metadata: { signer: "Alice" },
 *   // region omitted -> taken from env or defaultRegion via requireRegion()
 * });
 *
 * console.log(result.httpUrl);
 * ```
 */

import type { S3Port } from "@lawprotect/shared-ts";
import { toHttpUrl, requireRegion, isValidRegion, BadRequestError, ErrorCodes } from "@lawprotect/shared-ts";
import { S3_ACL_TYPES } from "../../domain/values/enums";
import type { 
  SignedPdfIngestInput, 
  SignedPdfIngestOutput, 
  S3SignedPdfIngestorOptions 
} from "../../domain/types/s3";

/**
 * Ingests signed PDF documents into S3 via a provided {@link S3Port}.
 *
 * @remarks
 * - Always sets `Content-Type: application/pdf` and applies private ACL.
 * - Per-call inputs override constructor defaults.
 * - Validates region using shared helpers.
 */
export class S3SignedPdfIngestor {
  private readonly defaults: S3SignedPdfIngestorOptions;

  /**
   * Creates a new {@link S3SignedPdfIngestor}.
   *
   * @param s3 - Any implementation of {@link S3Port} (e.g., {@link S3EvidenceStorage}).
   * @param opts - Optional defaults (bucket/region/KMS/cache-control/path-style).
   */
  constructor(
    private readonly s3: S3Port,
    opts: S3SignedPdfIngestorOptions = {}
  ) {
    this.defaults = { ...opts };
  }

  /**
   * Uploads a finalized signed PDF to S3 and returns metadata plus a public HTTPS URL.
   *
   * @param input - Parameters including key, PDF data, and optional settings
   *                (bucket/region/kms/cache-control/path-style).
   *
   * @returns An {@link SignedPdfIngestOutput} containing ETag, VersionId, and HTTPS URL.
   *
   * @throws {BadRequestError} When bucket is missing or region is invalid.
   * @throws Error - Propagates any error thrown by the underlying {@link S3Port.putObject}.
   */
  async ingest(input: SignedPdfIngestInput): Promise<SignedPdfIngestOutput> {
    const bucket = input.bucket || this.defaults.defaultBucket;
    if (!bucket) {
      throw new BadRequestError(
        "Bucket is required",
        ErrorCodes.COMMON_BAD_REQUEST,
        { hint: "Provide input.bucket or configure defaultBucket in the constructor." }
      );
    }

    // Region resolution: per-call -> constructor default -> environment
    const region = requireRegion(input.region ?? this.defaults.defaultRegion);
    if (!isValidRegion(region)) {
      throw new BadRequestError(
        "Invalid AWS region",
        ErrorCodes.COMMON_BAD_REQUEST,
        { region }
      );
    }

    const kmsKeyId = input.kmsKeyId ?? this.defaults.defaultKmsKeyId;
    const cacheControl = input.cacheControl ?? this.defaults.defaultCacheControl;
    const pathStyle = input.pathStyleUrl ?? this.defaults.defaultPathStyleUrl ?? false;

    const put = await this.s3.putObject({
      bucket,
      key: input.key,
      body: input.body,
      contentType: "application/pdf",
      cacheControl,
      metadata: input.metadata,
      kmsKeyId,
      acl: S3_ACL_TYPES[0], // "private"
    });

    const httpUrl = toHttpUrl(bucket, input.key, region, {
      virtualHosted: !pathStyle,
    });

    return {
      etag: put.etag,
      versionId: put.versionId,
      httpUrl,
    };
  }
}



