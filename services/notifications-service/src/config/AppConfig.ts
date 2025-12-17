/**
 * @fileoverview AppConfig - Configuration for notifications-service
 * @summary Service-specific configuration extending shared-ts AppConfig
 * @description Configuration for notifications-service using SES, Pinpoint, and EventBridge.
 * Extends shared-ts AppConfig with domain-specific settings.
 */

import { buildAppConfig } from '@lawprotect/shared-ts';
import type { NotificationServiceConfig } from './types';

/**
 * Loads the typed configuration for the notifications-service
 * @returns A fully-typed NotificationServiceConfig object ready for dependency injection
 */
export const loadConfig = (): NotificationServiceConfig => {
  const base = buildAppConfig();

  return {
    ...base,
    aws: {
      region: process.env.AWS_REGION || 'us-east-1',
    },
    database: {
      url: process.env.DATABASE_URL!,
      maxConnections: Number.parseInt(process.env.DB_MAX_CONNECTIONS || '10'),
      connectionTimeout: Number.parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000'),
    },
    email: {
      fromEmail: process.env.SES_FROM_EMAIL!,
      replyToEmail: process.env.SES_REPLY_TO_EMAIL || process.env.SES_FROM_EMAIL!,
      configurationSet: process.env.SES_CONFIGURATION_SET,
      region: process.env.AWS_REGION || 'us-east-1',
    },
    sms: {
      applicationId: process.env.PINPOINT_APPLICATION_ID!,
      senderId: process.env.PINPOINT_SENDER_ID!,
      region: process.env.AWS_REGION || 'us-east-1',
    },
    push: {
      fcm: process.env.FCM_SERVICE_ACCOUNT_KEY ? {
        serviceAccountKey: process.env.FCM_SERVICE_ACCOUNT_KEY,
        projectId: process.env.FCM_PROJECT_ID,
      } : undefined,
      apns: process.env.APNS_KEY_ID ? {
        keyId: process.env.APNS_KEY_ID,
        teamId: process.env.APNS_TEAM_ID!,
        key: process.env.APNS_KEY!,
        bundleId: process.env.APNS_BUNDLE_ID!,
        production: process.env.APNS_PRODUCTION !== 'false',
      } : undefined,
    },
    eventbridge: {
      busName: process.env.EVENT_BUS_NAME!,
      source: process.env.EVENT_SOURCE || `${base.projectName}.${base.serviceName}`,
    },
    retry: {
      maxAttempts: Number.parseInt(process.env.MAX_RETRY_ATTEMPTS || '3'),
      delayMs: Number.parseInt(process.env.RETRY_DELAY_MS || '1000'),
    },
    features: {
      enableEmail: process.env.ENABLE_EMAIL !== 'false', // Default true
      enableSms: process.env.ENABLE_SMS !== 'false', // Default true
      enablePush: process.env.ENABLE_PUSH === 'true', // Default false
    },
    monitoring: {
      metricsNamespace: process.env.METRICS_NAMESPACE || 'NotificationsService',
    },
  };
};

