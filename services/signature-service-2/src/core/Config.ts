/**
 * @file Config.ts
 * @summary Service-specific configuration for the signature-service
 * @description Service-specific configuration for the signature-service.
 * Extends the shared AppConfig with domain resources and feature toggles.
 * Provides configuration for DynamoDB tables, S3 buckets, KMS keys, EventBridge, and upload settings.
 * 
 * This module defines the complete configuration interface and loading logic for the signature service.
 * It handles environment variable validation, provides sensible defaults, and ensures type safety
 * for all configuration properties used throughout the application.
 */

import { buildAppConfig, getEnv, getRequired, getNumber, getBoolean } from "@lawprotect/shared-ts";
import type { AppConfig } from "@lawprotect/shared-ts";
import type { SigningAlgorithmSpec } from "@aws-sdk/client-kms";
import { KmsAlgorithmSchema } from "../domain/value-objects";

/**
 * @description Environment types for the signature service
 */
export type EnvironmentType = 'test' | 'local' | 'development' | 'staging' | 'production';

/**
 * @description DynamoDB configuration for different environments
 */
export interface DynamoDBConfig {
  /** Whether to use DynamoDB Local */
  useLocal: boolean;
  /** DynamoDB endpoint URL (for local development) */
  endpoint?: string;
  /** AWS region */
  region: string;
  /** AWS credentials (for local development) */
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
}

/**
 * @description Service-specific configuration for the signature-service.
 * Extends the shared {@link AppConfig} with domain resources and feature toggles.
 */
export interface SignatureServiceConfig extends AppConfig {
  /**
   * @description Current environment type
   */
  environment: EnvironmentType;
  
  /**
   * @description DynamoDB configuration for the current environment
   */
  dynamodb: DynamoDBConfig;
  
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
    /** Table holding consent records */
    consentTable?: string;
    /** Table holding delegation records */
    delegationTable?: string;
    /** Table holding global party records */
    globalPartiesTable?: string;
    /** Table holding invitation tokens */
    invitationTokensTable?: string;
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

  /**
   * @description Audit configuration.
   */
  audit: {
    /** Default page size for audit queries */
    defaultPageSize: number;
    /** Maximum page size for audit queries */
    maxPageSize: number;
  };

  /**
   * @description Rate limiting configuration for parties.
   */
  partiesRateLimit: {
    /** Maximum parties per envelope */
    maxPartiesPerEnvelope: number;
    /** Rate limit window in seconds */
    windowSeconds: number;
    /** TTL for rate limit entries in seconds */
    ttlSeconds: number;
  };
}

/**
 * @description Detects the current environment type based on environment variables
 * @returns The detected environment type
 */
export const detectEnvironment = (): EnvironmentType => {
  const nodeEnv = process.env.NODE_ENV;
  const endpointUrl = process.env.AWS_ENDPOINT_URL;
  
  // Test environment
  if (nodeEnv === 'test' || process.env.JEST_WORKER_ID) {
    return 'test';
  }
  
  // Local development environment
  if (endpointUrl?.includes('localhost') || endpointUrl?.includes('127.0.0.1')) {
    return 'local';
  }
  
  // Production-like environments
  if (nodeEnv === 'development') return 'development';
  if (nodeEnv === 'staging') return 'staging';
  if (nodeEnv === 'production') return 'production';
  
  // Default to local for development
  return 'local';
};

/**
 * @description Creates DynamoDB configuration based on the current environment
 * @param environment - The current environment type
 * @returns DynamoDB configuration object
 */
export const createDynamoDBConfig = (environment: EnvironmentType): DynamoDBConfig => {
  const isLocal = environment === 'test' || environment === 'local';
  
  if (isLocal) {
    return {
      useLocal: true,
      endpoint: process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000',
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.DYNAMODB_ACCESS_KEY_ID || 'fake',
        secretAccessKey: process.env.DYNAMODB_SECRET_ACCESS_KEY || 'fake'
      }
    };
  }
  
  // Production environment
  return {
    useLocal: false,
    region: process.env.AWS_REGION || 'us-east-1'
  };
};

/**
 * @description Gets table names based on the current environment
 * @param environment - The current environment type
 * @returns Object with table names
 */
export const getTableNames = (environment: EnvironmentType) => {
  const prefix = environment === 'test' ? 'test-' : 
                 environment === 'local' ? 'local-' : '';
  
  return {
    envelopesTable: getRequired("ENVELOPES_TABLE") || `${prefix}envelopes`,
    documentsTable: getRequired("DOCUMENTS_TABLE") || `${prefix}documents`,
    inputsTable: getRequired("INPUTS_TABLE") || `${prefix}inputs`,
    partiesTable: getRequired("PARTIES_TABLE") || `${prefix}parties`,
    idempotencyTable: getRequired("IDEMPOTENCY_TABLE") || `${prefix}idempotency`,
    outboxTable: getRequired("OUTBOX_TABLE") || `${prefix}outbox`,
    auditTable: getEnv("AUDIT_TABLE") || `${prefix}audit`,
    consentTable: getEnv("CONSENT_TABLE") || `${prefix}consent`,
    delegationTable: getEnv("DELEGATION_TABLE") || `${prefix}delegation`,
    globalPartiesTable: getEnv("GLOBAL_PARTIES_TABLE") || `${prefix}global-parties`,
    invitationTokensTable: getEnv("INVITATION_TOKENS_TABLE") || `${prefix}invitation-tokens`
  };
};

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
 * - Environment detection is automatic based on NODE_ENV and AWS_ENDPOINT_URL.
 * - DynamoDB Local is used for test and local environments.
 */
export const loadConfig = (
  overrides?: Partial<SignatureServiceConfig>
): SignatureServiceConfig => {
  const base = buildAppConfig();
  
  // Detect environment and create configuration
  const environment = detectEnvironment();
  const dynamodbConfig = createDynamoDBConfig(environment);
  const tableNames = getTableNames(environment);

  const signingAlgorithm = KmsAlgorithmSchema.parse(
    getEnv("KMS_SIGNING_ALGORITHM") ?? "RSASSA_PSS_SHA_256"
  ) as SigningAlgorithmSpec;

  const cfg: SignatureServiceConfig = {
    ...base,
    
    environment,
    dynamodb: dynamodbConfig,

  ddb: {
    envelopesTable: tableNames.envelopesTable,
    envelopesGsi1Name: getEnv("ENVELOPES_GSI1_NAME"),
    documentsTable: tableNames.documentsTable,
    inputsTable: tableNames.inputsTable,
    partiesTable: tableNames.partiesTable,
    idempotencyTable: tableNames.idempotencyTable,
    outboxTable: tableNames.outboxTable,
    auditTable: tableNames.auditTable,
    consentTable: tableNames.consentTable,
    delegationTable: tableNames.delegationTable,
    globalPartiesTable: tableNames.globalPartiesTable,
    invitationTokensTable: tableNames.invitationTokensTable
  },

    s3: {
      evidenceBucket: getRequired("EVIDENCE_BUCKET"),
      signedBucket: getEnv("SIGNED_BUCKET") ?? getRequired("EVIDENCE_BUCKET"),
      sseKmsKeyId: getEnv("S3_SSE_KMS_KEY_ID"),
      presignTtlSeconds: getNumber("PRESIGN_TTL_SECONDS", 900, { min: 60, max: 86_400 }),
      defaultCacheControl: getEnv("S3_DEFAULT_CACHE_CONTROL"),
      defaultPublicAcl: getBoolean("S3_DEFAULT_PUBLIC_ACL", false)},

    kms: {
      signerKeyId: getRequired("KMS_SIGNER_KEY_ID"),
      dataKeyId: getEnv("KMS_DATA_KEY_ID"),
      signingAlgorithm},

    events: {
      busName: getRequired("EVENTS_BUS_NAME"),
      source: getEnv("EVENTS_SOURCE") ?? `${base.projectName}.${base.serviceName}`},

    ssm: {
      basePath: getEnv("SSM_BASE_PATH")},

    uploads: {
      minPartSizeBytes: getNumber("UPLOAD_MIN_PART_SIZE_BYTES", 5 * 1024 * 1024, {
        min: 5 * 1024 * 1024}),
      maxParts: getNumber("UPLOAD_MAX_PARTS", 500, { min: 1, max: 10_000 })},

    system: {
      userId: getEnv("SYSTEM_USER_ID") ?? "system",
      email: getEnv("SYSTEM_USER_EMAIL") ?? "system@lawprotect.com",
      name: getEnv("SYSTEM_USER_NAME") ?? "System Service"},

    outbox: {
      maxBatchSize: getNumber("OUTBOX_MAX_BATCH_SIZE", 10, { min: 1, max: 100 }),
      maxWaitTimeMs: getNumber("OUTBOX_MAX_WAIT_TIME_MS", 5000, { min: 1000, max: 30000 }),
      maxRetries: getNumber("OUTBOX_MAX_RETRIES", 3, { min: 1, max: 10 }),
      retryDelayMs: getNumber("OUTBOX_RETRY_DELAY_MS", 1000, { min: 100, max: 10000 }),
      debug: getBoolean("OUTBOX_DEBUG", false)},

    metrics: {
      enableOutboxMetrics: getBoolean("ENABLE_OUTBOX_METRICS", true),
      namespace: getEnv("CLOUDWATCH_NAMESPACE") ?? `${base.projectName}/${base.serviceName}`,
      region: getEnv("CLOUDWATCH_REGION")},

    audit: {
      defaultPageSize: getNumber("AUDIT_DEFAULT_PAGE_SIZE", 50, { min: 1, max: 100 }),
      maxPageSize: getNumber("AUDIT_MAX_PAGE_SIZE", 100, { min: 1, max: 1000 })},

    partiesRateLimit: {
      maxPartiesPerEnvelope: getNumber("PARTIES_MAX_PER_ENVELOPE", 50, { min: 1, max: 100 }),
      windowSeconds: getNumber("PARTIES_RATE_LIMIT_WINDOW_SECONDS", 3600, { min: 60, max: 86400 }),
      ttlSeconds: getNumber("PARTIES_RATE_LIMIT_TTL_SECONDS", 7200, { min: 300, max: 86400 })}};

  return { ...cfg, ...(overrides ?? {}) };
};
