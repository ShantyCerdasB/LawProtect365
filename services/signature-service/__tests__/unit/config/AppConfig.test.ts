/**
 * @fileoverview Unit tests for AppConfig
 * @summary Tests for configuration loading and validation
 * @description Comprehensive test suite for AppConfig covering environment variable
 * parsing, default values, type validation, and configuration inheritance.
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { loadConfig, SignatureServiceConfig } from '../../../src/config/AppConfig';
import { buildAppConfig } from '@lawprotect/shared-ts';

// Mock shared-ts buildAppConfig
jest.mock('@lawprotect/shared-ts', () => ({
  buildAppConfig: jest.fn()
}));

describe('AppConfig', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let mockBuildAppConfig: jest.MockedFunction<typeof buildAppConfig>;

  beforeEach(() => {
    // Store original env
    originalEnv = { ...process.env };
    
    // Clear all env vars
    Object.keys(process.env).forEach(key => {
      delete process.env[key];
    });

    // Setup mock
    mockBuildAppConfig = buildAppConfig as jest.MockedFunction<typeof buildAppConfig>;
    mockBuildAppConfig.mockReturnValue({
      projectName: 'lawprotect365',
      serviceName: 'signature-service',
      region: 'us-east-1',
      env: 'dev',
      logLevel: 'info',
      isDev: true,
      isStaging: false,
      isProd: false,
      flags: {}
    });
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  describe('loadConfig', () => {
    it('should load configuration with default values', () => {
      // Set required environment variables
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.EVIDENCE_BUCKET = 'test-bucket';
      process.env.AWS_REGION = 'us-east-1';
      process.env.KMS_SIGNER_KEY_ID = 'test-kms-key';
      process.env.EVENTBRIDGE_BUS_NAME = 'test-bus';
      process.env.OUTBOX_TABLE_NAME = 'test-outbox';

      const config = loadConfig();

      expect(config).toBeDefined();
      expect(config.database.maxConnections).toBe(10);
      expect(config.database.connectionTimeout).toBe(30000);
      expect(config.kms.signingAlgorithm).toBe('RSASSA_PSS_SHA_256');
      expect(config.kms.region).toBe('us-east-1');
      expect(config.aws.region).toBe('us-east-1');
      expect(config.documentDownload.defaultExpirationSeconds).toBe(3600);
      expect(config.documentDownload.maxExpirationSeconds).toBe(86400);
      expect(config.documentDownload.minExpirationSeconds).toBe(300);
      expect(config.reminders.maxRemindersPerSigner).toBe(3);
      expect(config.reminders.minHoursBetweenReminders).toBe(24);
      expect(config.reminders.firstReminderHours).toBe(24);
      expect(config.reminders.secondReminderHours).toBe(48);
      expect(config.reminders.thirdReminderHours).toBe(72);
    });

    it('should load configuration with custom environment variables', () => {
      // Set all environment variables with custom values
      process.env.DATABASE_URL = 'postgresql://custom:custom@localhost:5432/custom';
      process.env.DB_MAX_CONNECTIONS = '20';
      process.env.DB_CONNECTION_TIMEOUT = '60000';
      process.env.EVIDENCE_BUCKET = 'custom-bucket';
      process.env.AWS_REGION = 'us-west-2';
      process.env.KMS_SIGNER_KEY_ID = 'custom-kms-key';
      process.env.KMS_SIGNING_ALGORITHM = 'RSASSA_PKCS1_V1_5_SHA_256';
      process.env.EVENTBRIDGE_BUS_NAME = 'custom-bus';
      process.env.EVENTBRIDGE_SOURCE = 'custom.source';
      process.env.OUTBOX_TABLE_NAME = 'custom-outbox';
      process.env.AWS_REGION = 'us-west-2';
      process.env.DOCUMENT_DOWNLOAD_DEFAULT_EXPIRATION_SECONDS = '7200';
      process.env.DOCUMENT_DOWNLOAD_MAX_EXPIRATION_SECONDS = '172800';
      process.env.DOCUMENT_DOWNLOAD_MIN_EXPIRATION_SECONDS = '600';
      process.env.MAX_REMINDERS_PER_SIGNER = '5';
      process.env.MIN_HOURS_BETWEEN_REMINDERS = '48';
      process.env.FIRST_REMINDER_HOURS = '12';
      process.env.SECOND_REMINDER_HOURS = '36';
      process.env.THIRD_REMINDER_HOURS = '96';

      const config = loadConfig();

      expect(config.database.url).toBe('postgresql://custom:custom@localhost:5432/custom');
      expect(config.database.maxConnections).toBe(20);
      expect(config.database.connectionTimeout).toBe(60000);
      expect(config.s3.bucketName).toBe('custom-bucket');
      expect(config.s3.region).toBe('us-west-2');
      expect(config.kms.signerKeyId).toBe('custom-kms-key');
      expect(config.kms.signingAlgorithm).toBe('RSASSA_PKCS1_V1_5_SHA_256');
      expect(config.kms.region).toBe('us-west-2');
      expect(config.eventbridge.busName).toBe('custom-bus');
      expect(config.eventbridge.source).toBe('custom.source');
      expect(config.outbox.tableName).toBe('custom-outbox');
      expect(config.aws.region).toBe('us-west-2');
      expect(config.documentDownload.defaultExpirationSeconds).toBe(7200);
      expect(config.documentDownload.maxExpirationSeconds).toBe(172800);
      expect(config.documentDownload.minExpirationSeconds).toBe(600);
      expect(config.reminders.maxRemindersPerSigner).toBe(5);
      expect(config.reminders.minHoursBetweenReminders).toBe(48);
      expect(config.reminders.firstReminderHours).toBe(12);
      expect(config.reminders.secondReminderHours).toBe(36);
      expect(config.reminders.thirdReminderHours).toBe(96);
    });

    it('should inherit from base AppConfig', () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.EVIDENCE_BUCKET = 'test-bucket';
      process.env.AWS_REGION = 'us-east-1';
      process.env.KMS_SIGNER_KEY_ID = 'test-kms-key';
      process.env.EVENTBRIDGE_BUS_NAME = 'test-bus';
      process.env.OUTBOX_TABLE_NAME = 'test-outbox';

      const config = loadConfig();

      expect(config.projectName).toBe('lawprotect365');
      expect(config.serviceName).toBe('signature-service');
      expect(config.region).toBe('us-east-1');
      expect(config.env).toBe('dev');
    });

    it('should use KMS fallback to AWS credentials when KMS credentials not provided', () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.EVIDENCE_BUCKET = 'test-bucket';
      process.env.AWS_REGION = 'us-east-1';
      process.env.KMS_SIGNER_KEY_ID = 'test-kms-key';
      process.env.EVENTBRIDGE_BUS_NAME = 'test-bus';
      process.env.OUTBOX_TABLE_NAME = 'test-outbox';
      process.env.AWS_REGION = 'us-west-2';

      const config = loadConfig();

      expect(config.kms.region).toBe('us-west-2');
    });

    it('should use KMS credentials when provided instead of AWS fallback', () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.EVIDENCE_BUCKET = 'test-bucket';
      process.env.AWS_REGION = 'us-east-1';
      process.env.KMS_SIGNER_KEY_ID = 'test-kms-key';
      process.env.EVENTBRIDGE_BUS_NAME = 'test-bus';
      process.env.OUTBOX_TABLE_NAME = 'test-outbox';

      const config = loadConfig();

      expect(config.kms.region).toBe('us-east-1');
    });

    it('should generate eventbridge source from project and service name when not provided', () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.EVIDENCE_BUCKET = 'test-bucket';
      process.env.AWS_REGION = 'us-east-1';
      process.env.KMS_SIGNER_KEY_ID = 'test-kms-key';
      process.env.EVENTBRIDGE_BUS_NAME = 'test-bus';
      process.env.OUTBOX_TABLE_NAME = 'test-outbox';

      const config = loadConfig();

      expect(config.eventbridge.source).toBe('lawprotect365.signature-service');
    });

    it('should return SignatureServiceConfig type', () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.EVIDENCE_BUCKET = 'test-bucket';
      process.env.AWS_REGION = 'us-east-1';
      process.env.KMS_SIGNER_KEY_ID = 'test-kms-key';
      process.env.EVENTBRIDGE_BUS_NAME = 'test-bus';
      process.env.OUTBOX_TABLE_NAME = 'test-outbox';

      const config = loadConfig();

      // TypeScript compilation will fail if this doesn't match SignatureServiceConfig
      const typedConfig: SignatureServiceConfig = config;
      expect(typedConfig).toBeDefined();
      expect(typedConfig.database).toBeDefined();
      expect(typedConfig.s3).toBeDefined();
      expect(typedConfig.kms).toBeDefined();
      expect(typedConfig.eventbridge).toBeDefined();
      expect(typedConfig.outbox).toBeDefined();
      expect(typedConfig.aws).toBeDefined();
      expect(typedConfig.documentDownload).toBeDefined();
      expect(typedConfig.reminders).toBeDefined();
    });

    it('should handle numeric parsing with invalid values', () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.EVIDENCE_BUCKET = 'test-bucket';
      process.env.AWS_REGION = 'us-east-1';
      process.env.KMS_SIGNER_KEY_ID = 'test-kms-key';
      process.env.EVENTBRIDGE_BUS_NAME = 'test-bus';
      process.env.OUTBOX_TABLE_NAME = 'test-outbox';
      
      // Set invalid numeric values
      process.env.DB_MAX_CONNECTIONS = 'invalid';
      process.env.DB_CONNECTION_TIMEOUT = 'not-a-number';
      process.env.DOCUMENT_DOWNLOAD_DEFAULT_EXPIRATION_SECONDS = 'NaN';

      const config = loadConfig();

      expect(config.database.maxConnections).toBeNaN();
      expect(config.database.connectionTimeout).toBeNaN();
      expect(config.documentDownload.defaultExpirationSeconds).toBeNaN();
    });

    it('should handle empty string environment variables', () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.EVIDENCE_BUCKET = 'test-bucket';
      process.env.AWS_REGION = 'us-east-1';
      process.env.KMS_SIGNER_KEY_ID = 'test-kms-key';
      process.env.EVENTBRIDGE_BUS_NAME = 'test-bus';
      process.env.OUTBOX_TABLE_NAME = 'test-outbox';
      
      // Set empty string values
      process.env.DB_MAX_CONNECTIONS = '';
      process.env.KMS_SIGNING_ALGORITHM = '';
      process.env.EVENTBRIDGE_SOURCE = '';

      const config = loadConfig();

      expect(config.database.maxConnections).toBe(10); // Empty string uses default '10'
      expect(config.kms.signingAlgorithm).toBe('RSASSA_PSS_SHA_256'); // Should use default
      expect(config.eventbridge.source).toBe('lawprotect365.signature-service'); // Should use generated
    });
  });
});
