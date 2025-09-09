/**
 * @file testConfig.ts
 * @summary Test configuration for integration tests
 * @description Provides all required environment variables for testing
 */

/**
 * Sets up all required environment variables for integration tests
 */
export const setupTestEnvironment = () => {
  // Shared-ts required variables
  process.env.ENV = "dev";
  process.env.PROJECT_NAME = "lawprotect";
  process.env.SERVICE_NAME = "signature-service";
  process.env.AWS_REGION = "us-east-1";
  process.env.LOG_LEVEL = "debug";
  process.env.JWT_ISSUER = "https://test.lawprotect.com";
  process.env.JWT_AUDIENCE = "signature-service";

  // Signature-service specific variables
  process.env.ENVELOPES_TABLE = "test-envelopes-table";
  process.env.ENVELOPES_GSI1_NAME = "test-envelopes-gsi1";
  process.env.DOCUMENTS_TABLE = "test-documents-table";
  process.env.INPUTS_TABLE = "test-inputs-table";
  process.env.PARTIES_TABLE = "test-parties-table";
  process.env.IDEMPOTENCY_TABLE = "test-idempotency-table";
  process.env.OUTBOX_TABLE = "test-outbox-table";

  process.env.EVIDENCE_BUCKET = "test-evidence-bucket";
  process.env.SIGNED_BUCKET = "test-signed-bucket";
  process.env.S3_SSE_KMS_KEY_ID = "test-s3-kms-key";
  process.env.PRESIGN_TTL_SECONDS = "900";
  process.env.S3_DEFAULT_CACHE_CONTROL = "max-age=3600";
  process.env.S3_DEFAULT_PUBLIC_ACL = "false";

  process.env.KMS_SIGNER_KEY_ID = "test-kms-signer-key";
  process.env.KMS_DATA_KEY_ID = "test-kms-data-key";
  process.env.KMS_SIGNING_ALGORITHM = "RSASSA_PSS_SHA_256";

  process.env.EVENTS_BUS_NAME = "test-events-bus";
  process.env.EVENTS_SOURCE = "lawprotect.signature-service";

  process.env.SSM_BASE_PATH = "/lawprotect/signature-service";

  process.env.UPLOAD_MIN_PART_SIZE_BYTES = "5242880"; // 5MB
  process.env.UPLOAD_MAX_PARTS = "500";

  process.env.SYSTEM_USER_ID = "system";
  process.env.SYSTEM_USER_EMAIL = "system@lawprotect.com";
  process.env.SYSTEM_USER_NAME = "System Service";

  process.env.OUTBOX_MAX_BATCH_SIZE = "10";
  process.env.OUTBOX_MAX_WAIT_TIME_MS = "5000";
  process.env.OUTBOX_MAX_RETRIES = "3";
  process.env.OUTBOX_RETRY_DELAY_MS = "1000";
  process.env.OUTBOX_DEBUG = "true";

  process.env.METRICS_NAMESPACE = "LawProtect/SignatureService";
  process.env.METRICS_ENABLED = "true";

  process.env.CORS_ALLOWED_ORIGINS = "*";
};
