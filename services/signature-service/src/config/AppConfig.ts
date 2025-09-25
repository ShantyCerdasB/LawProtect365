/**
 * @fileoverview AppConfig - Configuration for signature-service with Prisma
 * @summary Service-specific configuration extending shared-ts AppConfig
 * @description Configuration for signature-service using Prisma, S3, KMS, and EventBridge.
 * Extends shared-ts AppConfig with domain-specific settings.
 */

import { buildAppConfig } from '@lawprotect/shared-ts';
import type { AppConfig } from '@lawprotect/shared-ts';

export interface SignatureServiceConfig extends AppConfig {
  database: {
    url: string;
    maxConnections: number;
    connectionTimeout: number;
  };
  
  s3: {
    bucketName: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
  };
  
  kms: {
    signerKeyId: string;
    signingAlgorithm: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
  };
  
  eventbridge: {
    busName: string;
    source: string;
  };
  
  outbox: {
    tableName: string;
  };
  
  aws: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
  };
  
  documentDownload: {
    defaultExpirationSeconds: number;
    maxExpirationSeconds: number;
    minExpirationSeconds: number;
  };
  
  reminders: {
    maxRemindersPerSigner: number;
    minHoursBetweenReminders: number;
    firstReminderHours: number;
    secondReminderHours: number;
    thirdReminderHours: number;
  };
}

/**
 * Loads the typed configuration for the signature-service
 * @returns A fully-typed SignatureServiceConfig object ready for dependency injection
 */
export const loadConfig = (): SignatureServiceConfig => {
  const base = buildAppConfig();
  
  return {
    ...base,
    database: {
      url: process.env.DATABASE_URL!,
      maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10'),
      connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000')
    },
    s3: {
      bucketName: process.env.S3_BUCKET_NAME!,
      region: process.env.S3_REGION!,
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!
    },
    kms: {
      signerKeyId: process.env.KMS_SIGNER_KEY_ID!,
      signingAlgorithm: process.env.KMS_SIGNING_ALGORITHM || 'RSASSA_PSS_SHA_256',
      region: process.env.KMS_REGION || process.env.AWS_REGION || 'us-east-1',
      accessKeyId: process.env.KMS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.KMS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY!
    },
    eventbridge: {
      busName: process.env.EVENTBRIDGE_BUS_NAME!,
      source: process.env.EVENTBRIDGE_SOURCE || `${base.projectName}.${base.serviceName}`
    },
    outbox: {
      tableName: process.env.OUTBOX_TABLE_NAME!
    },
    aws: {
      region: process.env.AWS_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
    },
    documentDownload: {
      defaultExpirationSeconds: parseInt(process.env.DOCUMENT_DOWNLOAD_DEFAULT_EXPIRATION_SECONDS || '3600'), // 1 hour
      maxExpirationSeconds: parseInt(process.env.DOCUMENT_DOWNLOAD_MAX_EXPIRATION_SECONDS || '86400'), // 24 hours
      minExpirationSeconds: parseInt(process.env.DOCUMENT_DOWNLOAD_MIN_EXPIRATION_SECONDS || '300') // 5 minutes
    },
    reminders: {
      maxRemindersPerSigner: parseInt(process.env.MAX_REMINDERS_PER_SIGNER || '3'),
      minHoursBetweenReminders: parseInt(process.env.MIN_HOURS_BETWEEN_REMINDERS || '24'),
      firstReminderHours: parseInt(process.env.FIRST_REMINDER_HOURS || '24'),
      secondReminderHours: parseInt(process.env.SECOND_REMINDER_HOURS || '48'),
      thirdReminderHours: parseInt(process.env.THIRD_REMINDER_HOURS || '72')
    }
  };
};