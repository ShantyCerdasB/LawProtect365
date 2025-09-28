/**
 * @fileoverview SignatureEnvelopeService - Business logic service for signature envelope operations
 * @summary Provides business logic for envelope management using new architecture
 * @description This service handles all business logic for signature envelope operations
 * including CRUD operations, basic validations, and coordination with audit services using
 * the new Prisma-based architecture with proper separation of concerns.
 */

import { SignatureEnvelope } from '../domain/entities/SignatureEnvelope';
import { EnvelopeId } from '../domain/value-objects/EnvelopeId';
import { S3Key, S3Operation } from '@lawprotect/shared-ts';
import { SignerId } from '../domain/value-objects/SignerId';
import { SignatureEnvelopeRepository } from '../repositories/SignatureEnvelopeRepository';
import { S3Service } from './S3Service';
import { NetworkSecurityContext } from '@lawprotect/shared-ts';
import { loadConfig } from '../config/AppConfig';
import { 
  envelopeNotFound,
  envelopeExpirationInvalid
} from '../signature-errors';


/**
 * SignatureEnvelopeService implementation
 * 
 * Provides business logic for signature envelope operations including CRUD operations,
 * basic validations, and coordination with audit services. Uses the new Prisma-based
 * architecture with proper separation of concerns between entities, repositories, and services.
 * 
 * This service focuses on basic envelope management and delegates complex operations
 * to specialized services (DocumentSigningOrchestrator, EnvelopeProgressService, etc.).
 */
export class SignatureEnvelopeService {
  constructor(
    private readonly signatureEnvelopeRepository: SignatureEnvelopeRepository,
    private readonly s3Service: S3Service
  ) {}

  /**
   * Creates a new signature envelope
   * @param data - The envelope creation data
   * @param userId - The user creating the envelope
   * @returns The created signature envelope
   */










  /**
   * Downloads the latest signed document for an envelope
   * @param envelopeId - The envelope ID
   * @param userId - The user ID (for authenticated users)
   * @param invitationToken - The invitation token (for external users)
   * @param securityContext - Security context for audit tracking
   * @returns Download URL and expiration information
   */
  async downloadDocument(
    envelopeId: EnvelopeId,
    userId?: string,
    invitationToken?: string,
    expiresIn?: number,
    securityContext?: NetworkSecurityContext
  ): Promise<{ downloadUrl: string; expiresIn: number }> {
    try {
      // TODO: Move access validation to Use Case
      // const envelope = await this.validateUserAccess(envelopeId, userId, invitationToken);
      // TEMPORARY: Get envelope directly until Use Case is updated
      const envelope = await this.signatureEnvelopeRepository.findById(envelopeId);
      if (!envelope) {
        throw envelopeNotFound(`Envelope with ID ${envelopeId.getValue()} not found`);
      }
      const documentKey = this.getDocumentKeyForDownload(envelope, envelopeId);
      const finalExpiresIn = this.validateAndGetExpirationTime(expiresIn);
      const signerIdForS3 = this.getSignerIdForS3(envelope, userId, envelopeId);
      
      const downloadUrl = await this.generateDownloadUrl(envelopeId, signerIdForS3, documentKey, finalExpiresIn);
      await this.recordDownloadAudit(envelope, userId, invitationToken, documentKey, securityContext);

      return {
        downloadUrl,
        expiresIn: finalExpiresIn
      };
    } catch (error) {
      this.handleDownloadError(error, envelopeId);
    }
  }

  /**
   * Gets the document key for download
   * @param envelope - The envelope entity
   * @param envelopeId - The envelope ID
   * @returns Document key
   */
  private getDocumentKeyForDownload(envelope: SignatureEnvelope, envelopeId: EnvelopeId): S3Key {
    const documentKey = envelope.getLatestSignedDocumentKey();
    if (!documentKey) {
      throw envelopeNotFound(`No document available for download in envelope ${envelopeId.getValue()}`);
    }
    return documentKey;
  }

  /**
   * Validates and gets the expiration time for download URL
   * @param expiresIn - Requested expiration time
   * @returns Validated expiration time
   */
  private validateAndGetExpirationTime(expiresIn?: number): number {
    const config = loadConfig();
    const finalExpiresIn = expiresIn || config.documentDownload.defaultExpirationSeconds;
    
    if (finalExpiresIn < config.documentDownload.minExpirationSeconds || 
        finalExpiresIn > config.documentDownload.maxExpirationSeconds) {
      throw envelopeExpirationInvalid(
        `Document download expiration time must be between ${config.documentDownload.minExpirationSeconds} and ${config.documentDownload.maxExpirationSeconds} seconds, got ${finalExpiresIn}`
      );
    }
    
    return finalExpiresIn;
  }

  /**
   * Gets the signer ID for S3 operations
   * @param envelope - The envelope entity
   * @param userId - User ID (if authenticated)
   * @param envelopeId - The envelope ID
   * @returns Signer ID for S3
   */
  private getSignerIdForS3(envelope: SignatureEnvelope, userId?: string, envelopeId?: EnvelopeId): SignerId {
    if (userId) {
      return SignerId.fromString(userId);
    }
    
    const signers = envelope.getSigners();
    if (signers.length === 0) {
      throw envelopeNotFound(`No signers found in envelope ${envelopeId?.getValue()}`);
    }
    
    return signers[0].getId();
  }

  /**
   * Generates the download URL
   * @param envelopeId - The envelope ID
   * @param signerId - The signer ID
   * @param documentKey - The document key
   * @param expiresIn - Expiration time
   * @returns Download URL
   */
  private async generateDownloadUrl(
    envelopeId: EnvelopeId,
    signerId: SignerId,
    documentKey: S3Key,
    expiresIn: number
  ): Promise<string> {
    return await this.s3Service.generatePresignedUrl({
      envelopeId,
      signerId,
      documentKey,
      operation: S3Operation.get(),
      expiresIn
    });
  }

  /**
   * Records download audit event
   * @param envelope - The envelope entity
   * @param userId - User ID (if authenticated)
   * @param invitationToken - Invitation token (if external user)
   * @param documentKey - The document key
   * @param securityContext - Security context
   */
  private async recordDownloadAudit(
    envelope: SignatureEnvelope,
    userId?: string,
    invitationToken?: string,
    documentKey?: S3Key,
    securityContext?: NetworkSecurityContext
  ): Promise<void> {
    const { auditUserId, auditUserEmail } = this.getAuditUserInfo(envelope, userId, invitationToken);
    
    await this.s3Service.recordDownloadAction({
      envelopeId: envelope.getId().getValue(),
      userId: auditUserId,
      userEmail: auditUserEmail,
      s3Key: documentKey?.getValue() || '',
      ipAddress: securityContext?.ipAddress,
      userAgent: securityContext?.userAgent,
      country: securityContext?.country
    });
  }

  /**
   * Gets audit user information
   * @param envelope - The envelope entity
   * @param userId - User ID (if authenticated)
   * @param invitationToken - Invitation token (if external user)
   * @returns Audit user information
   */
  private getAuditUserInfo(
    envelope: SignatureEnvelope,
    userId?: string,
    invitationToken?: string
  ): { auditUserId: string; auditUserEmail: string | undefined } {
    if (userId) {
      return {
        auditUserId: userId,
        auditUserEmail: undefined
      };
    }
    
    const signers = envelope.getSigners();
    if (signers.length > 0) {
      const signer = signers[0];
      const signerName = signer.getFullName() || signer.getEmail()?.getValue() || 'Unknown';
      return {
        auditUserId: `external-user:${signerName}`,
        auditUserEmail: signer.getEmail()?.getValue()
      };
    }
    
    return {
      auditUserId: `external-user:${invitationToken}`,
      auditUserEmail: undefined
    };
  }

  /**
   * Handles download errors
   * @param error - The error to handle
   * @param envelopeId - The envelope ID
   */
  private handleDownloadError(error: unknown, envelopeId: EnvelopeId): never {
    if (error && typeof error === 'object' && 'code' in error) {
      const errorCode = (error as any).code;
      if (this.isBusinessValidationError(errorCode)) {
        throw error;
      }
    }
    
    throw envelopeNotFound(
      `Failed to download document for envelope ${envelopeId.getValue()}: ${error instanceof Error ? error.message : error}`
    );
  }

  /**
   * Checks if error is a business validation error
   * @param errorCode - The error code
   * @returns True if business validation error
   */
  private isBusinessValidationError(errorCode: string): boolean {
    const businessErrorCodes = [
      'ENVELOPE_ACCESS_DENIED',
      'INVITATION_TOKEN_INVALID',
      'INVITATION_TOKEN_EXPIRED',
      'INVITATION_TOKEN_ALREADY_USED',
      'INVITATION_TOKEN_REVOKED'
    ];
    return businessErrorCodes.includes(errorCode);
  }
}
