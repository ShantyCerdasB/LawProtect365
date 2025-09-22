/**
 * @fileoverview ServiceFactory - Infrastructure factory for service instantiation with Prisma
 * @summary Factory for creating service instances with proper dependency injection using Prisma
 * @description This factory creates service instances with proper dependency injection
 * for the new DDD architecture using Prisma repositories instead of DynamoDB.
 */

import { PrismaClient } from '@prisma/client';
import { getPrisma, S3Presigner, S3EvidenceStorage } from '@lawprotect/shared-ts';
import { KMSClient } from '@aws-sdk/client-kms';
import { loadConfig } from '../../config/AppConfig';
import { SignatureEnvelopeService } from '../../services/SignatureEnvelopeService';
import { EnvelopeSignerService } from '../../services/EnvelopeSignerService';
import { InvitationTokenService } from '../../services/InvitationTokenService';
import { SignatureAuditEventService } from '../../services/SignatureAuditEventService';
import { SignatureOrchestrator } from '../../services/SignatureOrchestrator';
import { KmsService } from '../../services/KmsService';
import { S3Service } from '../../services/S3Service';
import { SignatureEnvelopeRepository } from '../../repositories/SignatureEnvelopeRepository';
import { EnvelopeSignerRepository } from '../../repositories/EnvelopeSignerRepository';
import { InvitationTokenRepository } from '../../repositories/InvitationTokenRepository';
import { SignatureAuditEventRepository } from '../../repositories/SignatureAuditEventRepository';

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
    const signatureAuditEventService = this.createSignatureAuditEventService();
    const invitationTokenService = this.createInvitationTokenService();

    return new SignatureEnvelopeService(
      signatureEnvelopeRepository,
      signatureAuditEventService,
      invitationTokenService
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
    const signatureAuditEventService = this.createSignatureAuditEventService();

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
    const signatureAuditEventService = this.createSignatureAuditEventService();

    return new InvitationTokenService(
      invitationTokenRepository,
      envelopeSignerRepository,
      signatureAuditEventService
    );
  }

  /**
   * Creates a SignatureAuditEventService instance with all required dependencies
   * 
   * @returns Configured SignatureAuditEventService instance
   */
  static createSignatureAuditEventService(): SignatureAuditEventService {
    const signatureAuditEventRepository = new SignatureAuditEventRepository(this.prismaClient);
    return new SignatureAuditEventService(signatureAuditEventRepository);
  }

  /**
   * Creates a SignatureOrchestrator instance with all required dependencies
   * 
   * @returns Configured SignatureOrchestrator instance
   */
  static createSignatureOrchestrator(): SignatureOrchestrator {
    const signatureEnvelopeService = this.createSignatureEnvelopeService();

    return new SignatureOrchestrator(
      signatureEnvelopeService
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
    const signatureAuditEventService = this.createSignatureAuditEventService();
    return new S3Service(
      this.s3Presigner,
      this.s3EvidenceStorage,
      this.config.s3.bucketName,
      signatureAuditEventService
    );
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
