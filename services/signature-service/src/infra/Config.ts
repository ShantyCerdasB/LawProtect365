// services/signature-service/src/infra/Config.ts

import { buildAppConfig } from "@lawprotect/shared-ts";
import { getEnv, getRequired, getNumber, getBoolean } from "@lawprotect/shared-ts";
import type { AppConfig } from "@lawprotect/shared-ts";

/**
 * Service-specific configuration for the signature-service.
 * Extends the shared AppConfig with domain resources (DynamoDB, S3, KMS, EventBridge) and feature toggles.
 */
export interface SignatureServiceConfig extends AppConfig {
  /** DynamoDB tables used by the service. */
  ddb: {
    envelopesTable: string;
    documentsTable: string;
    inputsTable: string;
    partiesTable: string;
    idempotencyTable: string;
  };

  /** S3 buckets and defaults for storage and presigning. */
  s3: {
    /** Bucket for evidences/uploads (e.g., render artifacts, attachments). */
    evidenceBucket: string;
    /** Bucket for final signed PDFs (optional; falls back to evidenceBucket if not provided). */
    signedBucket: string;
    /** KMS key to use for SSE-KMS on PUTs (optional). */
    sseKmsKeyId?: string;
    /** Default presign expiration in seconds. */
    presignTtlSeconds: number;
    /** Optional Cache-Control used on uploads. */
    defaultCacheControl?: string;
    /** Whether to set ACL public-read on presigned PUTs (false by default). */
    defaultPublicAcl: boolean;
  };

  /** Keys for KMS operations (document signing and generic crypto). */
  kms: {
    /** KMS key used to produce signatures (Sign/Verify). */
    signerKeyId: string;
    /** Optional KMS key for auxiliary encryption operations. */
    dataKeyId?: string;
    /** Default signing algorithm (e.g., RSASSA_PSS_SHA_256). */
    signingAlgorithm: string;
  };

  /** EventBridge integration for domain events. */
  events: {
    busName: string;
    source: string;
  };

  /** Optional SSM base path used by adapters that fetch runtime parameters. */
  ssm?: {
    basePath?: string;
  };

  /** Upload and multipart defaults. */
  uploads: {
    /** Minimum multipart part size in bytes. */
    minPartSizeBytes: number;
    /** Maximum parts allowed by the service policy. */
    maxParts: number;
  };
}

/**
 * Loads the typed configuration for the signature-service by composing the shared AppConfig
 * with domain-specific resources and defaults. All reads come from process.env.
 *
 * Environment variables (suggested):
 * - Tables:
 *   ENVELOPES_TABLE, DOCUMENTS_TABLE, INPUTS_TABLE, PARTIES_TABLE, IDEMPOTENCY_TABLE
 * - S3:
 *   EVIDENCE_BUCKET, SIGNED_BUCKET?, S3_SSE_KMS_KEY_ID?, PRESIGN_TTL_SECONDS?, S3_DEFAULT_CACHE_CONTROL?, S3_DEFAULT_PUBLIC_ACL?
 * - KMS:
 *   KMS_SIGNER_KEY_ID, KMS_DATA_KEY_ID?, KMS_SIGNING_ALGORITHM?
 * - EventBridge:
 *   EVENTS_BUS_NAME, EVENTS_SOURCE
 * - SSM:
 *   SSM_BASE_PATH?
 * - Uploads:
 *   UPLOAD_MIN_PART_SIZE_BYTES?, UPLOAD_MAX_PARTS?
 *
 * @param overrides Optional partial overrides (useful for tests and local runs).
 * @returns A fully-populated, strongly-typed configuration object.
 */
export const loadConfig = (overrides?: Partial<SignatureServiceConfig>): SignatureServiceConfig => {
  const base = buildAppConfig();

  const cfg: SignatureServiceConfig = {
    ...base,

    ddb: {
      envelopesTable: getRequired("ENVELOPES_TABLE"),
      documentsTable: getRequired("DOCUMENTS_TABLE"),
      inputsTable: getRequired("INPUTS_TABLE"),
      partiesTable: getRequired("PARTIES_TABLE"),
      idempotencyTable: getRequired("IDEMPOTENCY_TABLE")
    },

    s3: {
      evidenceBucket: getRequired("EVIDENCE_BUCKET"),
      signedBucket: getEnv("SIGNED_BUCKET") ?? getRequired("EVIDENCE_BUCKET"),
      sseKmsKeyId: getEnv("S3_SSE_KMS_KEY_ID"),
      presignTtlSeconds: getNumber("PRESIGN_TTL_SECONDS", 900, { min: 60, max: 86400 }),
      defaultCacheControl: getEnv("S3_DEFAULT_CACHE_CONTROL"),
      defaultPublicAcl: getBoolean("S3_DEFAULT_PUBLIC_ACL", false)
    },

    kms: {
      signerKeyId: getRequired("KMS_SIGNER_KEY_ID"),
      dataKeyId: getEnv("KMS_DATA_KEY_ID"),
      signingAlgorithm: getEnv("KMS_SIGNING_ALGORITHM") ?? "RSASSA_PSS_SHA_256"
    },

    events: {
      busName: getRequired("EVENTS_BUS_NAME"),
      source: getEnv("EVENTS_SOURCE") ?? `${base.projectName}.${base.serviceName}`
    },

    ssm: {
      basePath: getEnv("SSM_BASE_PATH")
    },

    uploads: {
      minPartSizeBytes: getNumber("UPLOAD_MIN_PART_SIZE_BYTES", 5 * 1024 * 1024, { min: 5 * 1024 * 1024 }),
      maxParts: getNumber("UPLOAD_MAX_PARTS", 500, { min: 1, max: 10000 })
    }
  };

  return { ...cfg, ...(overrides ?? {}) };
};
