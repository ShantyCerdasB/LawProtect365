/**
 * @fileoverview Unit tests for AppConfig
 * @summary Tests for configuration loading and validation
 * @description Comprehensive test suite for AppConfig covering environment variable
 * parsing, default values, type validation, and configuration inheritance.
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { loadConfig } from '../../../src/config/AppConfig';
import type { NotificationServiceConfig } from '../../../src/config/types';
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
    for (const key of Object.keys(process.env)) {
      delete process.env[key];
    }

    // Setup mock
    mockBuildAppConfig = buildAppConfig as jest.MockedFunction<typeof buildAppConfig>;
    mockBuildAppConfig.mockReturnValue({
      projectName: 'lawprotect365',
      serviceName: 'notifications-service',
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
      process.env.AWS_REGION = 'us-east-1';
      process.env.SES_FROM_EMAIL = 'noreply@lawprotect365.com';
      process.env.PINPOINT_APPLICATION_ID = 'test-pinpoint-app-id';
      process.env.PINPOINT_SENDER_ID = 'LawProtect';
      process.env.EVENT_BUS_NAME = 'test-bus';

      const config = loadConfig();

      expect(config).toBeDefined();
      expect(config.database.maxConnections).toBe(10);
      expect(config.database.connectionTimeout).toBe(30000);
      expect(config.aws.region).toBe('us-east-1');
      expect(config.email.region).toBe('us-east-1');
      expect(config.sms.region).toBe('us-east-1');
      expect(config.retry.maxAttempts).toBe(3);
      expect(config.retry.delayMs).toBe(1000);
      expect(config.features.enableEmail).toBe(true);
      expect(config.features.enableSms).toBe(true);
      expect(config.features.enablePush).toBe(false);
      expect(config.monitoring.metricsNamespace).toBe('NotificationsService');
    });

    it('should load configuration with custom environment variables', () => {
      // Set all environment variables with custom values
      process.env.DATABASE_URL = 'postgresql://custom:custom@localhost:5432/custom';
      process.env.DB_MAX_CONNECTIONS = '20';
      process.env.DB_CONNECTION_TIMEOUT = '60000';
      process.env.AWS_REGION = 'us-west-2';
      process.env.SES_FROM_EMAIL = 'custom@example.com';
      process.env.SES_REPLY_TO_EMAIL = 'reply@example.com';
      process.env.SES_CONFIGURATION_SET = 'custom-config-set';
      process.env.PINPOINT_APPLICATION_ID = 'custom-pinpoint-app-id';
      process.env.PINPOINT_SENDER_ID = 'CustomSender';
      process.env.EVENT_BUS_NAME = 'custom-bus';
      process.env.EVENT_SOURCE = 'custom.source';
      process.env.MAX_RETRY_ATTEMPTS = '5';
      process.env.RETRY_DELAY_MS = '2000';
      process.env.ENABLE_EMAIL = 'false';
      process.env.ENABLE_SMS = 'false';
      process.env.ENABLE_PUSH = 'true';
      process.env.METRICS_NAMESPACE = 'CustomNotifications';

      const config = loadConfig();

      expect(config.database.url).toBe('postgresql://custom:custom@localhost:5432/custom');
      expect(config.database.maxConnections).toBe(20);
      expect(config.database.connectionTimeout).toBe(60000);
      expect(config.aws.region).toBe('us-west-2');
      expect(config.email.fromEmail).toBe('custom@example.com');
      expect(config.email.replyToEmail).toBe('reply@example.com');
      expect(config.email.configurationSet).toBe('custom-config-set');
      expect(config.email.region).toBe('us-west-2');
      expect(config.sms.applicationId).toBe('custom-pinpoint-app-id');
      expect(config.sms.senderId).toBe('CustomSender');
      expect(config.sms.region).toBe('us-west-2');
      expect(config.eventbridge.busName).toBe('custom-bus');
      expect(config.eventbridge.source).toBe('custom.source');
      expect(config.retry.maxAttempts).toBe(5);
      expect(config.retry.delayMs).toBe(2000);
      expect(config.features.enableEmail).toBe(false);
      expect(config.features.enableSms).toBe(false);
      expect(config.features.enablePush).toBe(true);
      expect(config.monitoring.metricsNamespace).toBe('CustomNotifications');
    });

    it('should inherit from base AppConfig', () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.AWS_REGION = 'us-east-1';
      process.env.SES_FROM_EMAIL = 'noreply@lawprotect365.com';
      process.env.PINPOINT_APPLICATION_ID = 'test-pinpoint-app-id';
      process.env.PINPOINT_SENDER_ID = 'LawProtect';
      process.env.EVENT_BUS_NAME = 'test-bus';

      const config = loadConfig();

      expect(config.projectName).toBe('lawprotect365');
      expect(config.serviceName).toBe('notifications-service');
      expect(config.region).toBe('us-east-1');
      expect(config.env).toBe('dev');
    });

    it('should use default replyToEmail when not provided', () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.AWS_REGION = 'us-east-1';
      process.env.SES_FROM_EMAIL = 'noreply@lawprotect365.com';
      process.env.PINPOINT_APPLICATION_ID = 'test-pinpoint-app-id';
      process.env.PINPOINT_SENDER_ID = 'LawProtect';
      process.env.EVENT_BUS_NAME = 'test-bus';

      const config = loadConfig();

      expect(config.email.replyToEmail).toBe('noreply@lawprotect365.com');
    });

    it('should generate eventbridge source from project and service name when not provided', () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.AWS_REGION = 'us-east-1';
      process.env.SES_FROM_EMAIL = 'noreply@lawprotect365.com';
      process.env.PINPOINT_APPLICATION_ID = 'test-pinpoint-app-id';
      process.env.PINPOINT_SENDER_ID = 'LawProtect';
      process.env.EVENT_BUS_NAME = 'test-bus';

      const config = loadConfig();

      expect(config.eventbridge.source).toBe('lawprotect365.notifications-service');
    });

    it('should return NotificationServiceConfig type', () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.AWS_REGION = 'us-east-1';
      process.env.SES_FROM_EMAIL = 'noreply@lawprotect365.com';
      process.env.PINPOINT_APPLICATION_ID = 'test-pinpoint-app-id';
      process.env.PINPOINT_SENDER_ID = 'LawProtect';
      process.env.EVENT_BUS_NAME = 'test-bus';

      const config = loadConfig();

      // TypeScript compilation will fail if this doesn't match NotificationServiceConfig
      const typedConfig: NotificationServiceConfig = config;
      expect(typedConfig).toBeDefined();
      expect(typedConfig.database).toBeDefined();
      expect(typedConfig.aws).toBeDefined();
      expect(typedConfig.email).toBeDefined();
      expect(typedConfig.sms).toBeDefined();
      expect(typedConfig.eventbridge).toBeDefined();
      expect(typedConfig.retry).toBeDefined();
      expect(typedConfig.features).toBeDefined();
      expect(typedConfig.monitoring).toBeDefined();
    });

    it('should handle numeric parsing with invalid values', () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.AWS_REGION = 'us-east-1';
      process.env.SES_FROM_EMAIL = 'noreply@lawprotect365.com';
      process.env.PINPOINT_APPLICATION_ID = 'test-pinpoint-app-id';
      process.env.PINPOINT_SENDER_ID = 'LawProtect';
      process.env.EVENT_BUS_NAME = 'test-bus';
      
      // Set invalid numeric values
      process.env.DB_MAX_CONNECTIONS = 'invalid';
      process.env.DB_CONNECTION_TIMEOUT = 'not-a-number';
      process.env.MAX_RETRY_ATTEMPTS = 'NaN';
      process.env.RETRY_DELAY_MS = 'invalid';

      const config = loadConfig();

      expect(config.database.maxConnections).toBeNaN();
      expect(config.database.connectionTimeout).toBeNaN();
      expect(config.retry.maxAttempts).toBeNaN();
      expect(config.retry.delayMs).toBeNaN();
    });

    it('should handle empty string environment variables', () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.AWS_REGION = 'us-east-1';
      process.env.SES_FROM_EMAIL = 'noreply@lawprotect365.com';
      process.env.PINPOINT_APPLICATION_ID = 'test-pinpoint-app-id';
      process.env.PINPOINT_SENDER_ID = 'LawProtect';
      process.env.EVENT_BUS_NAME = 'test-bus';
      
      // Set empty string values
      process.env.DB_MAX_CONNECTIONS = '';
      process.env.EVENT_SOURCE = '';

      const config = loadConfig();

      expect(config.database.maxConnections).toBe(10); // Empty string uses default '10'
      expect(config.eventbridge.source).toBe('lawprotect365.notifications-service'); // Should use generated
    });

    it('should use default AWS region when not provided', () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.SES_FROM_EMAIL = 'noreply@lawprotect365.com';
      process.env.PINPOINT_APPLICATION_ID = 'test-pinpoint-app-id';
      process.env.PINPOINT_SENDER_ID = 'LawProtect';
      process.env.EVENT_BUS_NAME = 'test-bus';

      const config = loadConfig();

      expect(config.aws.region).toBe('us-east-1');
      expect(config.email.region).toBe('us-east-1');
      expect(config.sms.region).toBe('us-east-1');
    });
  });
});

