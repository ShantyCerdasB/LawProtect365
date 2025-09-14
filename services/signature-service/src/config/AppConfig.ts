/**
 * @file AppConfig.ts
 * @summary Service-specific configuration for the signature-service
 * @description Service-specific configuration for the signature-service.
 * Extends the shared AppConfig with domain resources and feature toggles.
 * Provides configuration for DynamoDB tables, S3 buckets, KMS keys, EventBridge, and business rules.
 * 
 * This module defines the complete configuration interface and loading logic for the signature service.
 * It handles environment variable validation, provides sensible defaults, and ensures type safety
 * for all configuration properties used throughout the application.
 */

import { buildAppConfig, getEnv, getRequired, getNumber, getBoolean } from "@lawprotect/shared-ts";
import type { AppConfig } from "@lawprotect/shared-ts";
import type { SigningAlgorithmSpec } from "@aws-sdk/client-kms";

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
 * @description Business rules configuration for envelope operations
 */
export interface EnvelopeRulesConfig {
  /** Maximum signers per envelope */
  maxSignersPerEnvelope: number;
  /** Maximum envelopes per owner (or unlimited) */
  maxEnvelopesPerOwner: number;
  /** Minimum expiration days */
  minExpirationDays: number;
  /** Maximum expiration days */
  maxExpirationDays: number;
  /** Require unique titles per owner */
  requireUniqueTitlesPerOwner: boolean;
  /** Maximum custom fields per envelope */
  maxCustomFields: number;
  /** Maximum tags per envelope */
  maxTags: number;
  /** Maximum tag length */
  maxTagLength: number;
  /** Maximum custom field key length */
  maxCustomFieldKeyLength: number;
  /** Maximum custom field value length */
  maxCustomFieldValueLength: number;
}

/**
 * @description Business rules configuration for signer operations
 */
export interface SignerRulesConfig {
  /** Maximum signers per envelope */
  maxSignersPerEnvelope: number;
  /** Maximum signer name length */
  maxSignerNameLength: number;
  /** Maximum signer email length */
  maxSignerEmailLength: number;
  /** Require unique emails per envelope */
  requireUniqueEmailsPerEnvelope: boolean;
}

/**
 * @description Business rules configuration for signature operations
 */
export interface SignatureRulesConfig {
  /** Maximum signature attempts per signer */
  maxSignatureAttempts: number;
  /** Signature timeout in minutes */
  signatureTimeoutMinutes: number;
  /** Maximum signature reason length */
  maxSignatureReasonLength: number;
  /** Maximum signature location length */
  maxSignatureLocationLength: number;
}

/**
 * @description Rate limiting configuration
 */
export interface RateLimitConfig {
  /** Envelope creation rate limit per hour */
  envelopeCreationRateLimit: number;
  /** Signer invitation rate limit per hour */
  signerInvitationRateLimit: number;
  /** Signature attempt rate limit per hour */
  signatureAttemptRateLimit: number;
  /** Rate limit window in seconds */
  rateLimitWindowSeconds: number;
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
    /** Table holding Signer aggregates */
    signersTable: string;
    /** Table holding Signature aggregates */
    signaturesTable: string;
    /** Table holding Document aggregates (shared with Document Service) */
    documentsTable: string;
    /** Table holding audit events */
    auditTable: string;
    /** Table used for idempotency tokens/locks */
    idempotencyTable: string;
    /** Table holding outbox events for reliable event publishing */
    outboxTable: string;
    /** Table holding consent records */
    consentTable: string;
    /** Table holding invitation tokens */
    invitationTokensTable: string;
  };

  /**
   * @description S3 buckets and defaults for storage and presigning.
   * TTL and ACL defaults are read from environment variables and validated.
   */
  s3: {
    /** Bucket where signed documents are stored */
    signedBucket: string;
    /** Bucket where evidence artifacts are stored */
    evidenceBucket: string;
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
   * The signing algorithm is validated by the KMS client.
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
   * @description Business rules configuration for envelope operations
   */
  envelopeRules: EnvelopeRulesConfig;

  /**
   * @description Business rules configuration for signer operations
   */
  signerRules: SignerRulesConfig;

  /**
   * @description Business rules configuration for signature operations
   */
  signatureRules: SignatureRulesConfig;

  /**
   * @description Rate limiting configuration
   */
  businessRateLimit: RateLimitConfig;

  /**
   * @description Security configuration
   */
  security?: {
    /** List of blocked IP addresses */
    blockedIPs?: string[];
    /** List of blocked IP ranges (CIDR notation) */
    blockedIPRanges?: string[];
    /** List of blocked user agent patterns (regex) */
    blockedUserAgentPatterns?: string[];
    /** List of blocked countries (ISO codes) */
    blockedCountries?: string[];
    /** List of trusted device fingerprints */
    trustedDevices?: string[];
    /** Whether to enforce business hours */
    enforceBusinessHours?: boolean;
    /** Threshold for rapid operations detection */
    rapidOperationThreshold?: number;
    /** Window for rapid operations detection (seconds) */
    rapidOperationWindowSeconds?: number;
    /** Whether to enable IP validation */
    enableIPValidation?: boolean;
    /** Whether to enable user agent validation */
    enableUserAgentValidation?: boolean;
    /** Whether to enable geolocation validation */
    enableGeolocationValidation?: boolean;
    /** Whether to enable device trust validation */
    enableDeviceTrustValidation?: boolean;
    /** Whether to enable suspicious activity detection */
    enableSuspiciousActivityDetection?: boolean;
    /** Whether to enable rate limiting */
    enableRateLimiting?: boolean;
    /** List of sensitive operations that require additional validation */
    sensitiveOperations?: string[];
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
    signersTable: getRequired("SIGNERS_TABLE") || `${prefix}signers`,
    signaturesTable: getRequired("SIGNATURES_TABLE") || `${prefix}signatures`,
    documentsTable: getRequired("DOCUMENTS_TABLE") || `${prefix}documents`,
    auditTable: getRequired("AUDIT_TABLE") || `${prefix}audit`,
    idempotencyTable: getRequired("IDEMPOTENCY_TABLE") || `${prefix}idempotency`,
    outboxTable: getRequired("OUTBOX_TABLE") || `${prefix}outbox`,
    consentTable: getRequired("CONSENT_TABLE") || `${prefix}consent`,
    invitationTokensTable: getRequired("INVITATION_TOKENS_TABLE") || `${prefix}invitation-tokens`
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
 * @throws {Error} If the KMS signing algorithm is invalid.
 *
 * @remarks
 * All reads come from `process.env`. Sensible defaults are applied where appropriate:
 * - `SIGNED_BUCKET` falls back to `EVIDENCE_BUCKET`.
 * - `PRESIGN_TTL_SECONDS` defaults to 900 and is clamped to [60, 86400].
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

  const signingAlgorithm = (getEnv("KMS_SIGNING_ALGORITHM") ?? "RSASSA_PSS_SHA_256") as SigningAlgorithmSpec;

  const cfg: SignatureServiceConfig = {
    ...base,
    
    environment,
    dynamodb: dynamodbConfig,

    ddb: {
      envelopesTable: tableNames.envelopesTable,
      signersTable: tableNames.signersTable,
      signaturesTable: tableNames.signaturesTable,
      documentsTable: tableNames.documentsTable,
      auditTable: tableNames.auditTable,
      idempotencyTable: tableNames.idempotencyTable,
      outboxTable: tableNames.outboxTable,
      consentTable: tableNames.consentTable,
      invitationTokensTable: tableNames.invitationTokensTable
    },

    s3: {
      evidenceBucket: getRequired("EVIDENCE_BUCKET"),
      signedBucket: getEnv("SIGNED_BUCKET") ?? getRequired("EVIDENCE_BUCKET"),
      sseKmsKeyId: getEnv("S3_SSE_KMS_KEY_ID"),
      presignTtlSeconds: getNumber("PRESIGN_TTL_SECONDS", 900, { min: 60, max: 86_400 }),
      defaultCacheControl: getEnv("S3_DEFAULT_CACHE_CONTROL"),
      defaultPublicAcl: getBoolean("S3_DEFAULT_PUBLIC_ACL", false)
    },

    kms: {
      signerKeyId: getRequired("KMS_SIGNER_KEY_ID"),
      dataKeyId: getEnv("KMS_DATA_KEY_ID"),
      signingAlgorithm
    },

    events: {
      busName: getRequired("EVENTS_BUS_NAME"),
      source: getEnv("EVENTS_SOURCE") ?? `${base.projectName}.${base.serviceName}`
    },

    ssm: {
      basePath: getEnv("SSM_BASE_PATH")
    },

    system: {
      userId: getEnv("SYSTEM_USER_ID") ?? "system",
      email: getEnv("SYSTEM_USER_EMAIL") ?? "system@lawprotect.com",
      name: getEnv("SYSTEM_USER_NAME") ?? "System Service"
    },

    outbox: {
      maxBatchSize: getNumber("OUTBOX_MAX_BATCH_SIZE", 10, { min: 1, max: 100 }),
      maxWaitTimeMs: getNumber("OUTBOX_MAX_WAIT_TIME_MS", 5000, { min: 1000, max: 30000 }),
      maxRetries: getNumber("OUTBOX_MAX_RETRIES", 3, { min: 1, max: 10 }),
      retryDelayMs: getNumber("OUTBOX_RETRY_DELAY_MS", 1000, { min: 100, max: 10000 }),
      debug: getBoolean("OUTBOX_DEBUG", false)
    },

    metrics: {
      enableOutboxMetrics: getBoolean("ENABLE_OUTBOX_METRICS", true),
      namespace: getEnv("CLOUDWATCH_NAMESPACE") ?? `${base.projectName}/${base.serviceName}`,
      region: getEnv("CLOUDWATCH_REGION")
    },

    audit: {
      defaultPageSize: getNumber("AUDIT_DEFAULT_PAGE_SIZE", 50, { min: 1, max: 100 }),
      maxPageSize: getNumber("AUDIT_MAX_PAGE_SIZE", 100, { min: 1, max: 1000 })
    },

    envelopeRules: {
      maxSignersPerEnvelope: getNumber("MAX_SIGNERS_PER_ENVELOPE", 50, { min: 1, max: 1000 }),
      maxEnvelopesPerOwner: getEnv("MAX_ENVELOPES_PER_OWNER") === 'UNLIMITED' 
        ? Number.MAX_SAFE_INTEGER 
        : getNumber("MAX_ENVELOPES_PER_OWNER", 1000, { min: 1, max: 10000 }),
      minExpirationDays: getNumber("MIN_EXPIRATION_DAYS", 1, { min: 1, max: 30 }),
      maxExpirationDays: getNumber("MAX_EXPIRATION_DAYS", 365, { min: 1, max: 3650 }),
      requireUniqueTitlesPerOwner: getBoolean("REQUIRE_UNIQUE_TITLES_PER_OWNER", true),
      maxCustomFields: getNumber("MAX_CUSTOM_FIELDS", 20, { min: 1, max: 100 }),
      maxTags: getNumber("MAX_TAGS", 10, { min: 1, max: 50 }),
      maxTagLength: getNumber("MAX_TAG_LENGTH", 50, { min: 1, max: 200 }),
      maxCustomFieldKeyLength: getNumber("MAX_CUSTOM_FIELD_KEY_LENGTH", 100, { min: 1, max: 500 }),
      maxCustomFieldValueLength: getNumber("MAX_CUSTOM_FIELD_VALUE_LENGTH", 1000, { min: 1, max: 10000 })
    },

    signerRules: {
      maxSignersPerEnvelope: getNumber("MAX_SIGNERS_PER_ENVELOPE", 50, { min: 1, max: 1000 }),
      maxSignerNameLength: getNumber("MAX_SIGNER_NAME_LENGTH", 255, { min: 1, max: 500 }),
      maxSignerEmailLength: getNumber("MAX_SIGNER_EMAIL_LENGTH", 254, { min: 1, max: 500 }),
      requireUniqueEmailsPerEnvelope: getBoolean("REQUIRE_UNIQUE_EMAILS_PER_ENVELOPE", true)
    },

    signatureRules: {
      maxSignatureAttempts: getNumber("MAX_SIGNATURE_ATTEMPTS", 3, { min: 1, max: 10 }),
      signatureTimeoutMinutes: getNumber("SIGNATURE_TIMEOUT_MINUTES", 30, { min: 1, max: 1440 }),
      maxSignatureReasonLength: getNumber("MAX_SIGNATURE_REASON_LENGTH", 255, { min: 1, max: 1000 }),
      maxSignatureLocationLength: getNumber("MAX_SIGNATURE_LOCATION_LENGTH", 255, { min: 1, max: 1000 })
    },

    businessRateLimit: {
      envelopeCreationRateLimit: getNumber("ENVELOPE_CREATION_RATE_LIMIT", 100, { min: 1, max: 10000 }),
      signerInvitationRateLimit: getNumber("SIGNER_INVITATION_RATE_LIMIT", 1000, { min: 1, max: 10000 }),
      signatureAttemptRateLimit: getNumber("SIGNATURE_ATTEMPT_RATE_LIMIT", 100, { min: 1, max: 10000 }),
      rateLimitWindowSeconds: getNumber("RATE_LIMIT_WINDOW_SECONDS", 3600, { min: 60, max: 86400 })
    },

    security: {
      blockedIPs: getEnv("BLOCKED_IPS")?.split(',').map(ip => ip.trim()).filter(Boolean),
      blockedIPRanges: getEnv("BLOCKED_IP_RANGES")?.split(',').map(range => range.trim()).filter(Boolean),
      blockedUserAgentPatterns: getEnv("BLOCKED_USER_AGENT_PATTERNS")?.split(',').map(pattern => pattern.trim()).filter(Boolean),
      blockedCountries: getEnv("BLOCKED_COUNTRIES")?.split(',').map(country => country.trim()).filter(Boolean),
      trustedDevices: getEnv("TRUSTED_DEVICES")?.split(',').map(device => device.trim()).filter(Boolean),
      enforceBusinessHours: getBoolean("ENFORCE_BUSINESS_HOURS", false),
      rapidOperationThreshold: getNumber("RAPID_OPERATION_THRESHOLD", 10, { min: 1, max: 1000 }),
      rapidOperationWindowSeconds: getNumber("RAPID_OPERATION_WINDOW_SECONDS", 60, { min: 1, max: 3600 }),
      enableIPValidation: getBoolean("SECURITY_ENABLE_IP_VALIDATION", false),
      enableUserAgentValidation: getBoolean("SECURITY_ENABLE_USER_AGENT_VALIDATION", false),
      enableGeolocationValidation: getBoolean("SECURITY_ENABLE_GEOLOCATION_VALIDATION", false),
      enableDeviceTrustValidation: getBoolean("SECURITY_ENABLE_DEVICE_TRUST_VALIDATION", false),
      enableSuspiciousActivityDetection: getBoolean("SECURITY_ENABLE_SUSPICIOUS_ACTIVITY_DETECTION", false),
      enableRateLimiting: getBoolean("SECURITY_ENABLE_RATE_LIMITING", false),
      sensitiveOperations: getEnv("SECURITY_SENSITIVE_OPERATIONS")?.split(',').map(op => op.trim()).filter(Boolean) || []
    }
  };

  return { ...cfg, ...(overrides ?? {}) };
};
