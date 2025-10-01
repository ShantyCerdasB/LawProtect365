/**
 * @fileoverview InfrastructureFactory - Factory for AWS and external infrastructure services
 * @summary Creates infrastructure components including S3, KMS, EventBridge, and DynamoDB
 * @description Manages AWS client creation and configuration for external service dependencies.
 * This factory follows the Single Responsibility Principle by focusing exclusively on
 * infrastructure service instantiation and AWS client configuration.
 */

import { KMSClient } from '@aws-sdk/client-kms';
import { EventBridgeClient } from '@aws-sdk/client-eventbridge';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  S3Presigner,
  S3EvidenceStorage,
  EventServiceFactory,
  OutboxRepository,
  EventBridgeAdapter,
  EventPublisherService,
  DynamoDBClientAdapter,
  EventBridgeClientAdapter,
} from '@lawprotect/shared-ts';

import { KmsService } from '@/services/kmsService/KmsService';
import { S3Service } from '@/services/s3Service/S3Service';
import { AuditEventService } from '@/services/audit/AuditEventService';

import { loadConfig } from '@/config/AppConfig';

/**
 * Factory responsible for creating all infrastructure and AWS service instances.
 * Follows the Single Responsibility Principle by focusing exclusively on infrastructure creation.
 */
export class InfrastructureFactory {
  private static readonly config = loadConfig();

  /** Singleton AWS KMS client */
  private static readonly kmsClient = new KMSClient({
    region: this.config.kms.region,
  });

  /** Singleton S3 presigner client */
  private static readonly s3Presigner = new S3Presigner({
    region: this.config.s3.region,
  });

  /** Singleton S3 evidence storage client */
  private static readonly s3EvidenceStorage = new S3EvidenceStorage({
    defaultBucket: this.config.s3.bucketName,
    region: this.config.s3.region,
  });

  /**
   * Creates KmsService for cryptographic operations
   * @returns Configured KmsService instance
   */
  static createKmsService(): KmsService {
    return new KmsService(this.kmsClient);
  }

  /**
   * Creates S3Service for S3 operations and evidence storage
   * @returns Configured S3Service instance
   */
  static createS3Service(): S3Service {
    const auditEventService = this.createAuditEventService();
    return new S3Service(
      this.s3Presigner,
      this.s3EvidenceStorage,
      this.config.s3.bucketName,
      auditEventService,
      {
        documentDownload: {
          maxExpirationSeconds: this.config.documentDownload.maxExpirationSeconds,
          minExpirationSeconds: this.config.documentDownload.minExpirationSeconds
        }
      }
    );
  }

  /**
   * Creates AuditEventService for audit operations
   * @returns Configured AuditEventService instance
   */
  static createAuditEventService(): AuditEventService {
    const { RepositoryFactory } = require('../repositories');
    const auditRepo = RepositoryFactory.createSignatureAuditEventRepository();
    return new AuditEventService(auditRepo);
  }

  /**
   * Creates outbox repository for event publishing
   * @returns Configured OutboxRepository instance
   */
  static createOutboxRepository(): OutboxRepository {
    const dynamoDbClient = new DynamoDBClient({
      region: this.config.aws.region,
    });

    const ddbAdapter = new DynamoDBClientAdapter(dynamoDbClient);
    return EventServiceFactory.createOutboxRepository(this.config.outbox.tableName, ddbAdapter);
  }

  /**
   * Creates EventBridge adapter for integration events
   * @returns Configured EventBridgeAdapter instance
   */
  static createEventBridgeAdapter(): EventBridgeAdapter {
    const eventBridgeClient = new EventBridgeClient({
      region: this.config.aws.region,
    });

    const eventBridgeAdapter = new EventBridgeClientAdapter(eventBridgeClient);
    return EventServiceFactory.createEventBridgeAdapter(
      {
        busName: this.config.eventbridge.busName,
        source: this.config.eventbridge.source,
      },
      eventBridgeAdapter
    );
  }

  /**
   * Creates EventPublisherService using Outbox and EventBridge
   * @returns Configured EventPublisherService instance
   */
  static createEventPublisherService(): EventPublisherService {
    return EventServiceFactory.createEventPublisherService({
      outboxRepository: this.createOutboxRepository(),
      eventBridgeAdapter: this.createEventBridgeAdapter(),
    });
  }

  /**
   * Creates all infrastructure services in a single operation
   * @returns Object containing all infrastructure service instances
   */
  static createAll() {
    return {
      kmsService: this.createKmsService(),
      s3Service: this.createS3Service(),
      auditEventService: this.createAuditEventService(),
      outboxRepository: this.createOutboxRepository(),
      eventBridgeAdapter: this.createEventBridgeAdapter(),
      eventPublisherService: this.createEventPublisherService(),
    };
  }
}
