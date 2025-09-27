/**
 * @fileoverview ServiceFactory - Infrastructure factory for instantiating services and use cases
 * @summary Composition root for DDD services, use cases, and orchestrator (Prisma + AWS)
 * @description Builds the object graph: repositories → services → use cases → orchestrator.
 * Uses Prisma-backed repositories and AWS clients. The orchestrator is constructed with a
 * single deps object containing all services and use cases (no internal instantiation).
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
  EventBridgeClientAdapter,
  OutboxEventPublisher,
} from '@lawprotect/shared-ts';
import { KMSClient } from '@aws-sdk/client-kms';
import { EventBridgeClient } from '@aws-sdk/client-eventbridge';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

import { loadConfig } from '../../../config/AppConfig';

import { SignatureEnvelopeRepository } from '../../../repositories/SignatureEnvelopeRepository';
import { EnvelopeSignerRepository } from '../../../repositories/EnvelopeSignerRepository';
import { InvitationTokenRepository } from '../../../repositories/InvitationTokenRepository';
import { SignatureAuditEventRepository } from '../../../repositories/SignatureAuditEventRepository';
import { ConsentRepository } from '../../../repositories/ConsentRepository';
import { SignerReminderTrackingRepository } from '../../../repositories/SignerReminderTrackingRepository';

import { SignatureEnvelopeService } from '../../../services/SignatureEnvelopeService';
import { EnvelopeSignerService } from '../../../services/EnvelopeSignerService';
import { InvitationTokenService } from '../../../services/InvitationTokenService';
import { AuditEventService } from '@/services/audit/AuditEventService';
import { EnvelopeNotificationService } from '../../../services/events/EnvelopeNotificationService';
import { KmsService } from '../../../services/KmsService';
import { S3Service } from '../../../services/S3Service';
import { ConsentService } from '../../../services/ConsentService';
import { SignerReminderTrackingService } from '../../../services/SignerReminderTrackingService';

import {
  CreateEnvelopeUseCase,
  CancelEnvelopeUseCase,
  UpdateEnvelopeUseCase,
  SendEnvelopeUseCase,
  ShareDocumentViewUseCase,
  SendRemindersUseCase,
  DeclineSignerUseCase,
  DownloadDocumentUseCase,
  GetAuditTrailUseCase,
  GetEnvelopeUseCase,
  ListEnvelopesByUserUseCase,
  SignDocumentUseCase,
} from '../../../services/orchestrators';

import { SignatureOrchestrator } from '../../../services/orchestrators/SignatureOrchestrator';
import { IntegrationEventFactory } from '../events/IntegrationEventFactory';

/**
 * ServiceFactory composes repositories, services, and use cases.
 * It exposes helpers to create individual services and a top-level
 * orchestrator wired with a single deps object (services + use cases).
 */
export class ServiceFactory {
  private static readonly config = loadConfig();

  /** Singleton Prisma client */
  private static readonly prismaClient: PrismaClient = getPrisma({
    url: this.config.database.url,
  });

  /** Singleton AWS clients */
  private static readonly kmsClient = new KMSClient({
    region: this.config.kms.region,
    credentials: {
      accessKeyId: this.config.kms.accessKeyId,
      secretAccessKey: this.config.kms.secretAccessKey,
    },
  });

  private static readonly s3Presigner = new S3Presigner({
    region: this.config.s3.region,
    accessKeyId: this.config.s3.accessKeyId,
    secretAccessKey: this.config.s3.secretAccessKey,
  });

  private static readonly s3EvidenceStorage = new S3EvidenceStorage({
    defaultBucket: this.config.s3.bucketName,
    region: this.config.s3.region,
    accessKeyId: this.config.s3.accessKeyId,
    secretAccessKey: this.config.s3.secretAccessKey,
  });

  /**
   * Creates SignatureEnvelopeService with Prisma-backed repository.
   */
  static createSignatureEnvelopeService(): SignatureEnvelopeService {
    const signatureEnvelopeRepository = new SignatureEnvelopeRepository(this.prismaClient);
    const auditEventService = this.createAuditEventService();
    const invitationTokenService = this.createInvitationTokenService();
    const s3Service = this.createS3Service();

    return new SignatureEnvelopeService(
      signatureEnvelopeRepository,
      auditEventService,
      invitationTokenService,
      s3Service
    );
  }

  /**
   * Creates EnvelopeSignerService with repositories and audit service.
   */
  static createEnvelopeSignerService(): EnvelopeSignerService {
    const signerRepo = new EnvelopeSignerRepository(this.prismaClient);
    const envelopeRepo = new SignatureEnvelopeRepository(this.prismaClient);
    const auditEventService = this.createAuditEventService();

    return new EnvelopeSignerService(signerRepo, envelopeRepo, auditEventService);
  }

  /**
   * Creates InvitationTokenService with repositories and audit service.
   */
  static createInvitationTokenService(): InvitationTokenService {
    const tokenRepo = new InvitationTokenRepository(this.prismaClient);
    const signerRepo = new EnvelopeSignerRepository(this.prismaClient);
    const auditEventService = this.createAuditEventService();

    return new InvitationTokenService(tokenRepo, signerRepo, auditEventService);
  }

  /**
   * Creates AuditEventService with Prisma-backed repository.
   */
  static createAuditEventService(): AuditEventService {
    const auditRepo = new SignatureAuditEventRepository(this.prismaClient);
    return new AuditEventService(auditRepo);
  }

  /**
   * Creates ConsentService with repositories and audit service.
   */
  static createConsentService(): ConsentService {
    const consentRepo = new ConsentRepository(this.prismaClient);
    const signerRepo = new EnvelopeSignerRepository(this.prismaClient);
    const auditEventService = this.createAuditEventService();

    return new ConsentService(consentRepo, signerRepo, auditEventService);
  }

  /**
   * Creates KmsService for cryptographic operations.
   */
  static createKmsService(): KmsService {
    return new KmsService(this.kmsClient);
  }

  /**
   * Creates S3Service for presigned URLs and evidence storage.
   */
  static createS3Service(): S3Service {
    const auditEventService = this.createAuditEventService();
    return new S3Service(
      this.s3Presigner,
      this.s3EvidenceStorage,
      this.config.s3.bucketName,
      auditEventService
    );
  }

  /**
   * Creates outbox repository for event publishing.
   */
  static createOutboxRepository(): OutboxRepository {
    const dynamoDbClient = new DynamoDBClient({
      region: this.config.aws.region,
      credentials: {
        accessKeyId: this.config.aws.accessKeyId,
        secretAccessKey: this.config.aws.secretAccessKey,
      },
    });

    const ddbAdapter = new DynamoDBClientAdapter(dynamoDbClient);

    return EventServiceFactory.createOutboxRepository(this.config.outbox.tableName, ddbAdapter);
  }

  /**
   * Creates EventBridge adapter for integration events.
   */
  static createEventBridgeAdapter(): EventBridgeAdapter {
    const eventBridgeClient = new EventBridgeClient({
      region: this.config.aws.region,
      credentials: {
        accessKeyId: this.config.aws.accessKeyId,
        secretAccessKey: this.config.aws.secretAccessKey,
      },
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
   * Creates EventPublisherService using Outbox and EventBridge.
   */
  static createEventPublisherService(): EventPublisherService {
    return EventServiceFactory.createEventPublisherService({
      outboxRepository: this.createOutboxRepository(),
      eventBridgeAdapter: this.createEventBridgeAdapter(),
    });
  }

  /**
   * Creates SignerReminderTrackingService with Prisma-backed repository.
   */
  static createSignerReminderTrackingService(): SignerReminderTrackingService {
    const repo = this.createSignerReminderTrackingRepository();
    return new SignerReminderTrackingService(repo);
  }

  /**
   * Creates SignerReminderTrackingRepository.
   */
  static createSignerReminderTrackingRepository(): SignerReminderTrackingRepository {
    return new SignerReminderTrackingRepository(this.getPrismaClient());
  }

  /**
   * Returns the shared Prisma client.
   */
  static getPrismaClient(): PrismaClient {
    return this.prismaClient;
  }

  /**
   * Creates the orchestrator with a single deps object:
   * - services: all domain/application services
   * - useCases: all orchestrator use cases
   */
  static createSignatureOrchestrator(): SignatureOrchestrator {
    // Services
    const signatureEnvelopeService = this.createSignatureEnvelopeService();
    const envelopeSignerService = this.createEnvelopeSignerService();
    const invitationTokenService = this.createInvitationTokenService();
    const auditEventService = this.createAuditEventService();
    const s3Service = this.createS3Service();
    const consentService = this.createConsentService();
    const kmsService = this.createKmsService();
    const signerReminderTrackingService = this.createSignerReminderTrackingService();

    // Notifications infra
    const outboxRepository = this.createOutboxRepository();
    const eventFactory = new IntegrationEventFactory();
    const eventPublisher = new OutboxEventPublisher(outboxRepository);
    const envelopeNotificationService = new EnvelopeNotificationService(
      eventFactory,
      eventPublisher
    );

    // Use cases
    const createEnvelopeUseCase = new CreateEnvelopeUseCase(signatureEnvelopeService);
    const cancelEnvelopeUseCase = new CancelEnvelopeUseCase(
      signatureEnvelopeService,
      envelopeNotificationService
    );
    const updateEnvelopeUseCase = new UpdateEnvelopeUseCase(
      signatureEnvelopeService,
      envelopeSignerService,
      s3Service
    );
    const sendEnvelopeUseCase = new SendEnvelopeUseCase(
      signatureEnvelopeService,
      invitationTokenService,
      auditEventService,
      envelopeNotificationService
    );
    const shareDocumentViewUseCase = new ShareDocumentViewUseCase(
      signatureEnvelopeService,
      envelopeSignerService,
      invitationTokenService,
      auditEventService,
      envelopeNotificationService
    );
    const sendRemindersUseCase = new SendRemindersUseCase(
      signatureEnvelopeService,
      envelopeSignerService,
      invitationTokenService,
      signerReminderTrackingService,
      auditEventService,
      envelopeNotificationService
    );
    const declineSignerUseCase = new DeclineSignerUseCase(
      signatureEnvelopeService,
      envelopeSignerService,
      envelopeNotificationService
    );
    const downloadDocumentUseCase = new DownloadDocumentUseCase(signatureEnvelopeService);
    const getAuditTrailUseCase = new GetAuditTrailUseCase(
      signatureEnvelopeService,
      auditEventService
    );
    const getEnvelopeUseCase = new GetEnvelopeUseCase(
      signatureEnvelopeService,
      invitationTokenService
    );
    const listEnvelopesByUserUseCase = new ListEnvelopesByUserUseCase(signatureEnvelopeService);
    const signDocumentUseCase = new SignDocumentUseCase(
      signatureEnvelopeService,
      envelopeSignerService,
      invitationTokenService,
      consentService,
      s3Service,
      kmsService,
      auditEventService
    );

    // Orchestrator with deps object
    return new SignatureOrchestrator({
      services: {
        signatureEnvelopeService,
        envelopeSignerService,
        invitationTokenService,
        auditEventService,
        s3Service,
        consentService,
        kmsService,
        signerReminderTrackingService,
        envelopeNotificationService,
      },
      useCases: {
        createEnvelopeUseCase,
        cancelEnvelopeUseCase,
        updateEnvelopeUseCase,
        sendEnvelopeUseCase,
        shareDocumentViewUseCase,
        sendRemindersUseCase,
        declineSignerUseCase,
        downloadDocumentUseCase,
        getAuditTrailUseCase,
        getEnvelopeUseCase,
        listEnvelopesByUserUseCase,
        signDocumentUseCase,
      },
    });
  }
}
