/**
 * @file Config.ts
 * @summary Core configuration contracts
 * @description Shared contracts for application configuration and settings
 */

import type { SigningAlgorithmSpec } from "@aws-sdk/client-kms";

/**
 * @summary DynamoDB configuration
 * @description Configuration for DynamoDB tables and indexes used by the service.
 */
export interface DynamoDBConfig {
  /** Table holding Envelope aggregates */
  readonly envelopesTable: string;
  /** Optional GSI name used for listing envelopes by tenant */
  readonly envelopesGsi1Name?: string;
  /** Table holding Document aggregates or records */
  readonly documentsTable: string;
  /** Table holding input artifacts (e.g., uploads, form inputs) */
  readonly inputsTable: string;
  /** Table holding Party aggregates or records */
  readonly partiesTable: string;
  /** Table used for idempotency tokens/locks */
  readonly idempotencyTable: string;
  /** Table holding audit events. Defaults to envelopesTable if not provided */
  readonly auditTable?: string;
}

/**
 * @summary S3 configuration
 * @description Configuration for S3 buckets and defaults for storage and presigning.
 */
export interface S3Config {
  /** Bucket where evidentiary artifacts are stored */
  readonly evidenceBucket: string;
  /** Bucket where signed outputs are stored. Defaults to `evidenceBucket` if not provided */
  readonly signedBucket: string;
  /** Optional SSE-KMS key ID used for bucket-side encryption */
  readonly sseKmsKeyId?: string;
  /** Default TTL (in seconds) for presigned URLs */
  readonly presignTtlSeconds: number;
  /** Optional default Cache-Control header value for uploads */
  readonly defaultCacheControl?: string;
  /** Whether to apply a public ACL by default for specific operations */
  readonly defaultPublicAcl: boolean;
}

/**
 * @summary KMS configuration
 * @description Configuration for KMS keys and defaults for cryptographic operations.
 */
export interface KmsConfig {
  /** CMK used for signing operations */
  readonly signerKeyId: string;
  /** Optional CMK used for data-key operations */
  readonly dataKeyId?: string;
  /** KMS signing algorithm used for signatures */
  readonly signingAlgorithm: SigningAlgorithmSpec;
}

/**
 * @summary EventBridge configuration
 * @description Configuration for EventBridge integration for domain events.
 */
export interface EventBridgeConfig {
  /** Target EventBridge bus name */
  readonly busName: string;
  /** Default event `source`. If not provided, it is derived from `projectName.serviceName` */
  readonly source: string;
}

/**
 * @summary SSM configuration
 * @description Optional SSM base path used by adapters that fetch runtime parameters.
 */
export interface SsmConfig {
  /** Base path prefix for SSM parameter lookups */
  readonly basePath?: string;
}

/**
 * @summary Upload configuration
 * @description Configuration for upload and multipart defaults.
 */
export interface UploadConfig {
  /** Minimum part size in bytes for multipart uploads */
  readonly minPartSizeBytes: number;
  /** Maximum number of parts allowed in a multipart upload */
  readonly maxParts: number;
}

/**
 * @summary Rate limiting configuration
 * @description Configuration for rate limiting and throttling.
 */
export interface RateLimitConfig {
  /** Maximum requests per time window */
  readonly maxRequests: number;
  /** Time window in seconds */
  readonly timeWindowSeconds: number;
}

/**
 * @summary System configuration
 * @description Configuration for system-level settings.
 */
export interface SystemConfig {
  /** System user ID */
  readonly userId: string;
  /** System user email */
  readonly email: string;
  /** System user name */
  readonly name: string;
}

/**
 * @summary Outbox configuration
 * @description Configuration for outbox worker processing.
 */
export interface OutboxConfig {
  /** Maximum batch size for processing events */
  readonly maxBatchSize: number;
  /** Maximum wait time before processing batch (ms) */
  readonly maxWaitTimeMs: number;
  /** Maximum retries */
  readonly maxRetries: number;
  /** Delay between retries (ms) */
  readonly retryDelayMs: number;
  /** Debug mode */
  readonly debug: boolean;
}

/**
 * @summary Metrics configuration
 * @description Configuration for CloudWatch metrics.
 */
export interface MetricsConfig {
  /** Enable outbox metrics */
  readonly enableOutboxMetrics: boolean;
  /** CloudWatch namespace */
  readonly namespace: string;
  /** CloudWatch region */
  readonly region?: string;
}

/**
 * @summary System configuration
 * @description Configuration for system-level settings.
 */
export interface SystemConfig {
  /** System user ID */
  readonly userId: string;
  /** System user email */
  readonly email: string;
  /** System user name */
  readonly name: string;
}

/**
 * @summary Outbox configuration
 * @description Configuration for outbox worker processing.
 */
export interface OutboxConfig {
  /** Maximum batch size for processing events */
  readonly maxBatchSize: number;
  /** Maximum wait time before processing batch (ms) */
  readonly maxWaitTimeMs: number;
  /** Maximum retry attempts */
  readonly maxRetries: number;
  /** Delay between retries (ms) */
  readonly retryDelayMs: number;
  /** Debug mode */
  readonly debug: boolean;
}

/**
 * @summary Metrics configuration
 * @description Configuration for CloudWatch metrics.
 */
export interface MetricsConfig {
  /** Enable outbox metrics */
  readonly enableOutboxMetrics: boolean;
  /** CloudWatch namespace */
  readonly namespace: string;
  /** CloudWatch region */
  readonly region?: string;
}

/**
 * @summary Complete application configuration
 * @description All configuration settings for the signature service.
 */
export interface SignatureServiceConfig {
  /** AWS region for all services */
  readonly region: string;
  /** DynamoDB configuration */
  readonly ddb: DynamoDBConfig;
  /** S3 configuration */
  readonly s3: S3Config;
  /** KMS configuration */
  readonly kms: KmsConfig;
  /** EventBridge configuration */
  readonly events: EventBridgeConfig;
  /** SSM configuration */
  readonly ssm?: SsmConfig;
  /** Upload and multipart defaults. */
  readonly uploads: UploadConfig;

  /** System configuration */
  readonly system: SystemConfig;
  /** Outbox configuration */
  readonly outbox: OutboxConfig;
  /** Metrics configuration */
  readonly metrics: MetricsConfig;
}
