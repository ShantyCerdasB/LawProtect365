/**
 * @file Config.ts
 * @summary Service-specific configuration for the signature-service
 * @description Service-specific configuration for the signature-service.
 * Extends the shared AppConfig with domain resources and feature toggles.
 * Provides configuration for DynamoDB tables, S3 buckets, KMS keys, EventBridge, and upload settings.
 */

import { buildAppConfig, getEnv, getRequired, getNumber, getBoolean } from "@lawprotect/shared-ts";
import type { AppConfig } from "@lawprotect/shared-ts";
import type { SigningAlgorithmSpec } from "@aws-sdk/client-kms";
import { KmsAlgorithmSchema } from "../domain/value-objects";

/**
 * @description Service-specific configuration for the signature-service.
 * Extends the shared {@link AppConfig} with domain resources and feature toggles.
 */
export interface SignatureServiceConfig extends AppConfig {
  /**
   * @description DynamoDB tables used by the service.
   * Table names are expected to be supplied via environment variables.
   */
  ddb: {
    /** Table holding Envelope aggregates */
    envelopesTable: string;
    /**
     * Optional GSI name used for listing envelopes by tenant.
     * If omitted, consumers should fall back to their own defaults.
     */
    envelopesGsi1Name?: string;
    /** Table holding Document aggregates or records */
    documentsTable: string;
    /** Table holding input artifacts (e.g., uploads, form inputs) */
    inputsTable: string;
    /** Table holding Party aggregates or records */
    partiesTable: string;
    /** Table used for idempotency tokens/locks */
    idempotencyTable: string;
    /** Table holding audit events. Defaults to envelopesTable if not provided */
    auditTable?: string;
    /** Table holding outbox events for reliable event publishing */
    outboxTable: string;
  };

  /**
   * @description S3 buckets and defaults for storage and presigning.
   * TTL and ACL defaults are read from environment variables and validated.
   */
  s3: {
    /** Bucket where evidentiary artifacts are stored */
    evidenceBucket: string;
    /** Bucket where signed outputs are stored. Defaults to `evidenceBucket` if not provided */
    signedBucket: string;
    /** Optional SSE-KMS key ID used for bucket-side encryption */
    sseKmsKeyId?: string;
    /** Default TTL (in seconds) for presigned URLs */
    presignTtlSeconds: number;
    /** Optional default Cache-Control header value for uploads */
    defaultCacheControl?: string;
    /** Whether to apply a public ACL by default for specific operations */
    defaultPublicAcl: boolean;
  };

  /**
   * @description Keys and defaults for KMS operations.
   * The signing algorithm is validated by {@link KmsAlgorithmSchema}.
   */
  kms: {
    /** CMK used for signing operations */
    signerKeyId: string;
    /** Optional CMK used for data-key operations */
    dataKeyId?: string;
    /** KMS signing algorithm used for signatures */
    signingAlgorithm: SigningAlgorithmSpec;
  };

  /**
   * @description EventBridge integration for domain events.
   */
  events: {
    /** Target EventBridge bus name */
    busName: string;
    /**
     * Default event `source`. If not provided, it is derived from
     * `projectName.serviceName` (from the shared {@link AppConfig}).
     */
    source: string;
  };

  /**
   * @description Optional SSM base path used by adapters that fetch runtime parameters.
   */
  ssm?: {
    /** Base path prefix for SSM parameter lookups */
    basePath?: string;
  };

  /**
   * @description Upload and multipart defaults.
   */
  uploads: {
    /** Minimum part size in bytes for multipart uploads */
    minPartSizeBytes: number;
    /** Maximum number of parts for multipart uploads */
    maxParts: number;
  };

  /**
   * @description System user configuration.
   */
  system: {
    /** The ID of the system user */
    userId: string;
    /** The email of the system user */
    email: string;
    /** The name of the system user */
    name: string;
  };

  /**
   * @description Outbox worker configuration for reliable event processing.
   */
  outbox: {
    /** Maximum number of events to process in a single batch */
    maxBatchSize: number;
    /** Maximum time to wait before processing a batch (milliseconds) */
    maxWaitTimeMs: number;
    /** Maximum number of retry attempts for failed events */
    maxRetries: number;
    /** Delay between retry attempts (milliseconds) */
    retryDelayMs: number;
    /** Whether to enable debug logging */
    debug: boolean;
  };

  /**
   * @description CloudWatch metrics configuration.
   */
  metrics: {
    /** Whether to enable custom metrics for outbox processing */
    enableOutboxMetrics: boolean;
    /** CloudWatch namespace for custom metrics */
    namespace: string;
    /** CloudWatch region (defaults to service region) */
    region?: string;
  };
}

/**
 * Loads the typed configuration for the signature-service by composing the shared {@link AppConfig}
 * with domain-specific resources and defaults.
 *
 * @param overrides - Optional partial configuration to overlay on top of the computed values.
 * @returns A fully-typed {@link SignatureServiceConfig} object ready for dependency injection.
 *
 * @throws {Error} If any required environment variable is missing (thrown by {@link getRequired}).
 * @throws {Error} If numeric or boolean environment variables fail validation (thrown by {@link getNumber} / {@link getBoolean}).
 * @throws {Error} If the KMS signing algorithm is invalid (thrown by {@link KmsAlgorithmSchema.parse}).
 *
 * @remarks
 * All reads come from `process.env`. Sensible defaults are applied where appropriate:
 * - `SIGNED_BUCKET` falls back to `EVIDENCE_BUCKET`.
 * - `PRESIGN_TTL_SECONDS` defaults to 900 and is clamped to [60, 86400].
 * - `UPLOAD_MIN_PART_SIZE_BYTES` defaults to 5 MiB and is clamped to [5 MiB, ∞).
 * - `UPLOAD_MAX_PARTS` defaults to 500 and is clamped to [1, 10000].
 * - `EVENTS_SOURCE` falls back to `${projectName}.${serviceName}` from the shared config.
 * - `KMS_SIGNING_ALGORITHM` defaults to `"RSASSA_PSS_SHA_256"`.
 */
export const loadConfig = (
  overrides?: Partial<SignatureServiceConfig>
): SignatureServiceConfig => {
  const base = buildAppConfig();

  const signingAlgorithm = KmsAlgorithmSchema.parse(
    getEnv("KMS_SIGNING_ALGORITHM") ?? "RSASSA_PSS_SHA_256"
  ) as SigningAlgorithmSpec;

  const cfg: SignatureServiceConfig = {
    ...base,

    ddb: {
      envelopesTable: getRequired("ENVELOPES_TABLE"),
      envelopesGsi1Name: getEnv("ENVELOPES_GSI1_NAME"),
      documentsTable: getRequired("DOCUMENTS_TABLE"),
      inputsTable: getRequired("INPUTS_TABLE"),
      partiesTable: getRequired("PARTIES_TABLE"),
      idempotencyTable: getRequired("IDEMPOTENCY_TABLE"),
      outboxTable: getRequired("OUTBOX_TABLE"),
    },

    s3: {
      evidenceBucket: getRequired("EVIDENCE_BUCKET"),
      signedBucket: getEnv("SIGNED_BUCKET") ?? getRequired("EVIDENCE_BUCKET"),
      sseKmsKeyId: getEnv("S3_SSE_KMS_KEY_ID"),
      presignTtlSeconds: getNumber("PRESIGN_TTL_SECONDS", 900, { min: 60, max: 86_400 }),
      defaultCacheControl: getEnv("S3_DEFAULT_CACHE_CONTROL"),
      defaultPublicAcl: getBoolean("S3_DEFAULT_PUBLIC_ACL", false),
    },

    kms: {
      signerKeyId: getRequired("KMS_SIGNER_KEY_ID"),
      dataKeyId: getEnv("KMS_DATA_KEY_ID"),
      signingAlgorithm,
    },

    events: {
      busName: getRequired("EVENTS_BUS_NAME"),
      source: getEnv("EVENTS_SOURCE") ?? `${base.projectName}.${base.serviceName}`,
    },

    ssm: {
      basePath: getEnv("SSM_BASE_PATH"),
    },

    uploads: {
      minPartSizeBytes: getNumber("UPLOAD_MIN_PART_SIZE_BYTES", 5 * 1024 * 1024, {
        min: 5 * 1024 * 1024,
      }),
      maxParts: getNumber("UPLOAD_MAX_PARTS", 500, { min: 1, max: 10_000 }),
    },

    system: {
      userId: getEnv("SYSTEM_USER_ID") ?? "system",
      email: getEnv("SYSTEM_USER_EMAIL") ?? "system@lawprotect.com",
      name: getEnv("SYSTEM_USER_NAME") ?? "System Service",
    },

    outbox: {
      maxBatchSize: getNumber("OUTBOX_MAX_BATCH_SIZE", 10, { min: 1, max: 100 }),
      maxWaitTimeMs: getNumber("OUTBOX_MAX_WAIT_TIME_MS", 5000, { min: 1000, max: 30000 }),
      maxRetries: getNumber("OUTBOX_MAX_RETRIES", 3, { min: 1, max: 10 }),
      retryDelayMs: getNumber("OUTBOX_RETRY_DELAY_MS", 1000, { min: 100, max: 10000 }),
      debug: getBoolean("OUTBOX_DEBUG", false),
    },

    metrics: {
      enableOutboxMetrics: getBoolean("ENABLE_OUTBOX_METRICS", true),
      namespace: getEnv("CLOUDWATCH_NAMESPACE") ?? `${base.projectName}/${base.serviceName}`,
      region: getEnv("CLOUDWATCH_REGION"),
    },
  };

  return { ...cfg, ...(overrides ?? {}) };
};






