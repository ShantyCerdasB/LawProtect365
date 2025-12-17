/**
 * @fileoverview Config Types - Configuration type definitions
 * @summary Type definitions for notifications service configuration
 * @description Defines the interface for notifications service configuration
 * extending the base AppConfig from shared-ts.
 */

import type { AppConfig } from '@lawprotect/shared-ts';

/**
 * Notifications service specific configuration extending shared-ts AppConfig
 */
export interface NotificationServiceConfig extends AppConfig {
  // AWS Configuration
  aws: {
    region: string;
  };

  // Database Configuration
  database: {
    url: string;
    maxConnections: number;
    connectionTimeout: number;
  };

  // Email Configuration (SES)
  email: {
    fromEmail: string;
    replyToEmail: string;
    configurationSet?: string;
    region: string;
  };

  // SMS Configuration (Pinpoint)
  sms: {
    applicationId: string;
    senderId: string;
    region: string;
  };

  // Push Notification Configuration
  push: {
    fcm?: {
      serviceAccountKey: string;
      projectId?: string;
    };
    apns?: {
      keyId: string;
      teamId: string;
      key: string;
      bundleId: string;
      production: boolean;
    };
  };

  // EventBridge Configuration
  eventbridge: {
    busName: string;
    source: string;
  };

  // Retry Configuration
  retry: {
    maxAttempts: number;
    delayMs: number;
  };

  // Feature Flags
  features: {
    enableEmail: boolean;
    enableSms: boolean;
    enablePush: boolean;
  };

  // Monitoring
  monitoring: {
    metricsNamespace: string;
  };
}

