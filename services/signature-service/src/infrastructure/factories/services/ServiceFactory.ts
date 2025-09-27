/**
 * @fileoverview ServiceFactory - Infrastructure factory for service instantiation with Prisma
 * @summary Factory for creating service instances with proper dependency injection using Prisma
 * @description This factory creates service instances with proper dependency injection
 * for the new DDD architecture using Prisma repositories instead of DynamoDB.
 */

import { PrismaClient } from '@prisma/client';
import { 
  getPrisma, 
  S3Presigner, 
  S3EvidenceStorage,
  EventServiceFactory,
  OutboxRepository,
  EventBridgeAdapter,
  EventPublisherService,
  DynamoDBClientAdapter,
  EventBridgeClientAdapter
} from '@lawprotect/shared-ts';
import { KMSClient } from '@aws-sdk/client-kms';
import { EventBridgeClient } from '@aws-sdk/client-eventbridge';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { loadConfig } from '../../../config/AppConfig';
import { SignatureEnvelopeService } from '../../../services/SignatureEnvelopeService';
import { EnvelopeSignerService } from '../../../services/EnvelopeSignerService';
import { InvitationTokenService } from '../../../services/InvitationTokenService';
import { AuditEventService } from '@/services/audit/AuditEventService';
import { SignatureOrchestrator } from '../../../services/orchestrators/SignatureOrchestrator';
import { IntegrationEventFactory } from '../events/IntegrationEventFactory';
import { OutboxEventPublisher } from '@lawprotect/shared-ts';
import { EnvelopeNotificationService } from '../../../services/events/EnvelopeNotificationService';
import { KmsService } from '../../../services/KmsService';
import { S3Service } from '../../../services/S3Service';
import { SignatureEnvelopeRepository } from '../../../repositories/SignatureEnvelopeRepository';
import { EnvelopeSignerRepository } from '../../../repositories/EnvelopeSignerRepository';
import { InvitationTokenRepository } from '../../../repositories/InvitationTokenRepository';
import { SignatureAuditEventRepository } from '../../../repositories/SignatureAuditEventRepository';
import { ConsentService } from '../../../services/ConsentService';
import { ConsentRepository } from '../../../repositories/ConsentRepository';
import { SignerReminderTrackingService } from '../../../services/SignerReminderTrackingService';
import { SignerReminderTrackingRepository } from '../../../repositories/SignerReminderTrackingRepository';

/**
 * ServiceFactory - Infrastructure factory for service instantiation with Prisma
 * 
 * This factory creates service instances with proper dependency injection
 * for the new DDD architecture using Prisma repositories.
 * 
 * Responsibilities:
 * - Create service instances with proper dependencies
 * - Manage Prisma repository instantiation
 * - Provide consistent service creation across handlers
 * - Support the new DDD architecture
 */

export class ServiceFactory {
  private static readonly config = loadConfig();
  private static readonly prismaClient = getPrisma({ 
    url: this.config.database.url 
  });
  
  // AWS Services with external configuration
  // KMS Client for signature-specific operations (sign/verify)
  private static readonly kmsClient = new KMSClient({
    region: this.config.kms.region,
    credentials: {
      accessKeyId: this.config.kms.accessKeyId,
      secretAccessKey: this.config.kms.secretAccessKey
    }
  });
  
  private static readonly s3Presigner = new S3Presigner({
    region: this.config.s3.region,
    accessKeyId: this.config.s3.accessKeyId,
    secretAccessKey: this.config.s3.secretAccessKey
  });
  
  private static readonly s3EvidenceStorage = new S3EvidenceStorage({
    defaultBucket: this.config.s3.bucketName,
    region: this.config.s3.region,
    accessKeyId: this.config.s3.accessKeyId,
    secretAccessKey: this.config.s3.secretAccessKey
  });

  /**
   * Creates a SignatureEnvelopeService instance with all required dependencies
   * 
   * @returns Configured SignatureEnvelopeService instance
   */
  static createSignatureEnvelopeService(): SignatureEnvelopeService {
    const signatureEnvelopeRepository = new SignatureEnvelopeRepository(this.prismaClient);
    const signatureAuditEventService = this.createAuditEventService();
    const invitationTokenService = this.createInvitationTokenService();
    const s3Service = this.createS3Service();

    return new SignatureEnvelopeService(
      signatureEnvelopeRepository,
      signatureAuditEventService,
      invitationTokenService,
      s3Service
    );
  }

  /**
   * Creates an EnvelopeSignerService instance with all required dependencies
   * 
   * @returns Configured EnvelopeSignerService instance
   */
  static createEnvelopeSignerService(): EnvelopeSignerService {
    const envelopeSignerRepository = new EnvelopeSignerRepository(this.prismaClient);
    const signatureEnvelopeRepository = new SignatureEnvelopeRepository(this.prismaClient);
    const signatureAuditEventService = this.createAuditEventService();

    return new EnvelopeSignerService(
      envelopeSignerRepository,
      signatureEnvelopeRepository,
      signatureAuditEventService
    );
  }

  /**
   * Creates an InvitationTokenService instance with all required dependencies
   * 
   * @returns Configured InvitationTokenService instance
   */
  static createInvitationTokenService(): InvitationTokenService {
    const invitationTokenRepository = new InvitationTokenRepository(this.prismaClient);
    const envelopeSignerRepository = new EnvelopeSignerRepository(this.prismaClient);
    const signatureAuditEventService = this.createAuditEventService();

    return new InvitationTokenService(
      invitationTokenRepository,
      envelopeSignerRepository,
      signatureAuditEventService
    );
  }

  /**
   * Creates an AuditEventService instance with all required dependencies
   * 
   * @returns Configured AuditEventService instance
   */
  static createAuditEventService(): AuditEventService {
    const signatureAuditEventRepository = new SignatureAuditEventRepository(this.prismaClient);
    return new AuditEventService(signatureAuditEventRepository);
  }

  /**
   * Creates a ConsentService instance with all required dependencies
   * 
   * @returns Configured ConsentService instance
   */
  static createConsentService(): ConsentService {
    const consentRepository = new ConsentRepository(this.prismaClient);
    const envelopeSignerRepository = new EnvelopeSignerRepository(this.prismaClient);
    const signatureAuditEventService = this.createAuditEventService();
    return new ConsentService(consentRepository, envelopeSignerRepository, signatureAuditEventService);
  }

  /**
   * Creates a SignatureOrchestrator instance with all required dependencies
   * 
   * @returns Configured SignatureOrchestrator instance
   */
  static createSignatureOrchestrator(): SignatureOrchestrator {
    const signatureEnvelopeService = this.createSignatureEnvelopeService();
    const envelopeSignerService = this.createEnvelopeSignerService();
    const invitationTokenService = this.createInvitationTokenService();
    const signatureAuditEventService = this.createAuditEventService();
    const s3Service = this.createS3Service();
    const outboxRepository = this.createOutboxRepository();
    const consentService = this.createConsentService();
    const kmsService = this.createKmsService();
    const signerReminderTrackingService = this.createSignerReminderTrackingService();

    const eventFactory = new IntegrationEventFactory();
    const eventPublisher = new OutboxEventPublisher(outboxRepository);
    const envelopeNotificationService = new EnvelopeNotificationService(eventFactory, eventPublisher);

    return new SignatureOrchestrator(
      signatureEnvelopeService,
      envelopeSignerService,
      invitationTokenService,
      signatureAuditEventService,
      s3Service,
      consentService,
      kmsService,
      signerReminderTrackingService,
      envelopeNotificationService
    );
  }

  /**
   * Creates a KmsService instance with all required dependencies
   * 
   * @returns Configured KmsService instance
   */
  static createKmsService(): KmsService {
    return new KmsService(this.kmsClient);
  }

  /**
   * Creates an S3Service instance with all required dependencies
   * 
   * @returns Configured S3Service instance
   */
  static createS3Service(): S3Service {
    const signatureAuditEventService = this.createAuditEventService();
    return new S3Service(
      this.s3Presigner,
      this.s3EvidenceStorage,
      this.config.s3.bucketName,
      signatureAuditEventService
    );
  }

  /**
   * Creates an OutboxRepository instance for event publishing
   * 
   * @returns Configured OutboxRepository instance
   */
  static createOutboxRepository(): OutboxRepository {
    const dynamoDbClient = new DynamoDBClient({
      region: this.config.aws.region,
      credentials: {
        accessKeyId: this.config.aws.accessKeyId,
        secretAccessKey: this.config.aws.secretAccessKey
      }
    });
    
    const ddbAdapter = new DynamoDBClientAdapter(dynamoDbClient);
    
    return EventServiceFactory.createOutboxRepository(
      this.config.outbox.tableName,
      ddbAdapter
    );
  }

  /**
   * Creates an EventBridgeAdapter instance for event publishing
   * 
   * @returns Configured EventBridgeAdapter instance
   */
  static createEventBridgeAdapter(): EventBridgeAdapter {
    const eventBridgeClient = new EventBridgeClient({
      region: this.config.aws.region,
      credentials: {
        accessKeyId: this.config.aws.accessKeyId,
        secretAccessKey: this.config.aws.secretAccessKey
      }
    });
    
    const eventBridgeAdapter = new EventBridgeClientAdapter(eventBridgeClient);
    
    return EventServiceFactory.createEventBridgeAdapter(
      {
        busName: this.config.eventbridge.busName,
        source: this.config.eventbridge.source
      },
      eventBridgeAdapter
    );
  }

  /**
   * Creates an EventPublisherService instance for event publishing
   * 
   * @returns Configured EventPublisherService instance
   */
  static createEventPublisherService(): EventPublisherService {
    return EventServiceFactory.createEventPublisherService({
      outboxRepository: this.createOutboxRepository(),
      eventBridgeAdapter: this.createEventBridgeAdapter()
    });
  }

  /**
   * Creates a SignerReminderTrackingService instance with all required dependencies
   * 
   * @returns Configured SignerReminderTrackingService instance
   */
  static createSignerReminderTrackingService(): SignerReminderTrackingService {
    const signerReminderTrackingRepository = this.createSignerReminderTrackingRepository();
    return new SignerReminderTrackingService(signerReminderTrackingRepository);
  }

  /**
   * Creates a SignerReminderTrackingRepository instance
   * 
   * @returns Configured SignerReminderTrackingRepository instance
   */
  static createSignerReminderTrackingRepository(): SignerReminderTrackingRepository {
    return new SignerReminderTrackingRepository(this.getPrismaClient());
  }

  /**
   * Gets the Prisma client instance
   * 
   * @returns PrismaClient instance
   */
  static getPrismaClient(): PrismaClient {
    return this.prismaClient;
  }

}
