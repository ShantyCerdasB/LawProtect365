/**
 * @fileoverview Config Test Builders - Reusable test data builders for configuration testing
 * @summary Provides builders for creating test configuration data
 * @description This module provides builders for creating configuration-related test data
 * including app config, service configs, and environment settings.
 */

/**
 * Creates S3Service configuration for testing
 * @param overrides - Optional overrides for the configuration
 * @returns S3Service configuration with test data
 */
export function s3ServiceConfig(overrides: any = {}) {
  return {
    documentDownload: {
      maxExpirationSeconds: overrides.maxExpirationSeconds || 86400, // 24 hours
      minExpirationSeconds: overrides.minExpirationSeconds || 300    // 5 minutes
    }
  };
}

/**
 * Creates app configuration for testing
 * @param overrides - Optional overrides for the configuration
 * @returns App configuration with test data
 */
export function appConfig(overrides: any = {}) {
  return {
    documentDownload: {
      maxExpirationSeconds: overrides.maxExpirationSeconds || 86400,
      minExpirationSeconds: overrides.minExpirationSeconds || 300
    },
    database: {
      url: overrides.databaseUrl || 'postgresql://test:test@localhost:5432/test',
      ssl: overrides.databaseSsl || false
    },
    aws: {
      region: overrides.awsRegion || 'us-east-1',
      s3Bucket: overrides.s3Bucket || 'test-bucket'
    }
  };
}

/**
 * Creates reminder tracking configuration for testing
 * @param overrides - Optional overrides for the configuration
 * @returns Reminder tracking configuration with test data
 */
export function reminderTrackingConfig(overrides: any = {}) {
  return {
    maxReminders: overrides.maxReminders || 3,
    minHoursBetween: overrides.minHoursBetween || 24,
    firstReminderHours: overrides.firstReminderHours || 24,
    secondReminderHours: overrides.secondReminderHours || 48,
    thirdReminderHours: overrides.thirdReminderHours || 72
  };
}
