/**
 * @fileoverview ServiceFactory - Infrastructure factory for service instantiation
 * @summary Factory for creating service instances with proper dependency injection
 * @description This factory creates service instances with proper dependency injection
 * for serverless environments without container overhead. Lives in infrastructure layer.
 */

import { loadConfig } from '../../config';
import { createDynamoDBClient } from '../../utils/dynamodb-client';
import { S3Client } from '@aws-sdk/client-s3';
import { KMSClient } from '@aws-sdk/client-kms';
import { KmsSigner } from '@lawprotect/shared-ts';
import { EnvelopeService } from '../../services/EnvelopeService';
import { SignerService } from '../../services/SignerService';
import { InvitationTokenService } from '../../services/InvitationTokenService';
import { AuditService } from '../../services/AuditService';
import { S3Service } from '../../services/S3Service';
import { SignatureService } from '../../services/SignatureService';
import { ConsentService } from '../../services/ConsentService';
import { KmsService } from '../../services/KmsService';
import { SignatureEventService } from '../../services/events/SignatureEventService';
import { ConsentEventService } from '../../services/events/ConsentEventService';
import { EnvelopeEventService } from '../../services/events/EnvelopeEventService';
import { SignerEventService } from '../../services/events/SignerEventService';
import { EnvelopeRepository } from '../../repositories/EnvelopeRepository';
import { SignerRepository } from '../../repositories/SignerRepository';
import { SignatureRepository } from '../../repositories/SignatureRepository';
import { InvitationTokenRepository } from '../../repositories/InvitationTokenRepository';
import { OutboxRepository } from '../../repositories/OutboxRepository';
import { AuditRepository } from '../../repositories/AuditRepository';
import { ConsentRepository } from '../../repositories/ConsentRepository';
import { DocumentRepository } from '../../repositories/DocumentRepository';

/**
 * ServiceFactory - Infrastructure factory for service instantiation
 * 
 * This factory creates service instances with proper dependency injection
 * for serverless environments without container overhead.
 * 
 * Responsibilities:
 * - Create service instances with proper dependencies
 * - Manage repository instantiation
 * - Handle configuration loading
 * - Provide consistent service creation across handlers
 */
export class ServiceFactory {
  private static config = loadConfig();
  private static ddbClient = createDynamoDBClient(this.config.dynamodb);
  private static s3Client = new S3Client({
    region: this.config.region
  });
  private static kmsClient = new KMSClient({
    region: this.config.region
  });
  private static kmsSigner = new KmsSigner(this.kmsClient, {
    defaultKeyId: this.config.kms.signerKeyId,
    defaultSigningAlgorithm: this.config.kms.signingAlgorithm
  });

  /**
   * Creates an EnvelopeService instance with all required dependencies
   * 
   * @returns Configured EnvelopeService instance
   */
  static createEnvelopeService(): EnvelopeService {
    const envelopeRepository = new EnvelopeRepository(
      this.config.ddb.envelopesTable,
      this.ddbClient,
      {
        indexName: this.config.ddb.envelopesGsi1Name,
        gsi2IndexName: this.config.ddb.envelopesGsi2Name
      }
    );
    const signerRepository = new SignerRepository(this.config.ddb.signersTable, this.ddbClient);
    const signatureRepository = new SignatureRepository(this.config.ddb.signaturesTable, this.ddbClient);
    const auditRepository = new AuditRepository(this.config.ddb.auditTable, this.ddbClient);
    const auditService = new AuditService(auditRepository);
    const outboxRepository = new OutboxRepository(this.config.ddb.outboxTable, this.ddbClient);
    const envelopeEventService = new EnvelopeEventService({
      outboxRepository,
      serviceName: 'signature-service',
      defaultTraceId: undefined
    });

    // Wire shared Documents table (read-only) for business rule validation
    const documentRepository = new DocumentRepository(this.config.ddb.documentsTable, this.ddbClient);

    return new EnvelopeService(
      envelopeRepository,
      signerRepository,
      signatureRepository,
      auditService,
      envelopeEventService,
      this.config,
      {
        getDocument: async (documentId: string) => {
          return await documentRepository.getByDocumentId(documentId);
        }
      }
    );
  }

  /**
   * Creates a SignerService instance with all required dependencies
   * 
   * @returns Configured SignerService instance
   */
  static createSignerService(): SignerService {
    const signerRepository = new SignerRepository(this.config.ddb.signersTable, this.ddbClient);
    const envelopeRepository = new EnvelopeRepository(this.config.ddb.envelopesTable, this.ddbClient);
    const auditRepository = new AuditRepository(this.config.ddb.auditTable, this.ddbClient);
    const auditService = new AuditService(auditRepository);
    const outboxRepository = new OutboxRepository(this.config.ddb.outboxTable, this.ddbClient);
    const signerEventService = new SignerEventService({
      outboxRepository,
      serviceName: 'signature-service',
      defaultTraceId: undefined
    });
    const envelopeEventService = new EnvelopeEventService({
      outboxRepository,
      serviceName: 'signature-service',
      defaultTraceId: undefined
    });

    return new SignerService(
      signerRepository,
      envelopeRepository,
      auditService,
      signerEventService,
      envelopeEventService
    );
  }

  /**
   * Creates an InvitationTokenService instance with all required dependencies
   * 
   * @returns Configured InvitationTokenService instance
   */
  static createInvitationTokenService(): InvitationTokenService {
    const invitationTokenRepository = new InvitationTokenRepository(this.config.ddb.invitationTokensTable, this.ddbClient);
    const auditRepository = new AuditRepository(this.config.ddb.auditTable, this.ddbClient);
    const auditService = new AuditService(auditRepository);
    const outboxRepository = new OutboxRepository(this.config.ddb.outboxTable, this.ddbClient);
    const signerEventService = new SignerEventService({
      outboxRepository,
      serviceName: 'signature-service',
      defaultTraceId: undefined
    });

    return new InvitationTokenService(
      invitationTokenRepository,
      signerEventService,
      auditService
    );
  }

  static createAuditService(): AuditService {
    const auditRepository = new AuditRepository(this.config.ddb.auditTable, this.ddbClient);
    return new AuditService(auditRepository);
  }

  static createS3Service(): S3Service {
    const auditRepository = new AuditRepository(this.config.ddb.auditTable, this.ddbClient);
    const auditService = new AuditService(auditRepository);
    
    return new S3Service(
      this.s3Client,
      this.config.s3.signedBucket,
      auditService,
      this.config
    );
  }

  /**
   * Creates a SignatureService instance with all required dependencies
   * 
   * @returns Configured SignatureService instance
   */
  static createSignatureService(): SignatureService {
    const signatureRepository = new SignatureRepository(this.config.ddb.signaturesTable, this.ddbClient);
    const consentRepository = new ConsentRepository(this.config.ddb.consentTable, this.ddbClient);
    const signerRepository = new SignerRepository(this.config.ddb.signersTable, this.ddbClient);
    const outboxRepository = new OutboxRepository(this.config.ddb.outboxTable, this.ddbClient);
    const auditRepository = new AuditRepository(this.config.ddb.auditTable, this.ddbClient);
    
    const auditService = new AuditService(auditRepository);
    const consentEventService = new ConsentEventService({ outboxRepository, serviceName: 'ConsentService' });
    const consentService = new ConsentService(consentRepository, signerRepository, auditService, consentEventService);
    
    const signatureEventService = new SignatureEventService({ outboxRepository, serviceName: 'SignatureService' });
    const s3Service = this.createS3Service();
    const kmsService = new KmsService(
      this.kmsSigner,
      signatureRepository,
      auditService,
      signatureEventService,
      s3Service,
      this.config.kms.signerKeyId
    );
    
    return new SignatureService(
      signatureRepository,
      consentService,
      kmsService,
      signatureEventService,
      auditService
    );
  }
}
