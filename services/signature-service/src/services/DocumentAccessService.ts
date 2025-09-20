/**
 * @fileoverview DocumentAccessService - Document view/share link generation for external users
 * @summary Validates tokens, resolves document keys, generates presigned URLs, and records audit
 * @description Encapsulates document view/share link generation for external users.
 * Validates invitation tokens, resolves appropriate S3 keys based on envelope status,
 * generates presigned URLs with TTL bounds, and records comprehensive audit events.
 */

import { InvitationTokenService } from './InvitationTokenService';
import { S3Service } from './S3Service';
import { SignerService } from './SignerService';
import { EnvelopeService } from './EnvelopeService';
import { AuditService } from './AuditService';
import { AuditEventType } from '../domain/enums/AuditEventType';
import { EnvelopeStatus } from '../domain/enums/EnvelopeStatus';
import { SignerId } from '../domain/value-objects/SignerId';
import { EnvelopeSecurityContext } from '../domain/types/envelope/EnvelopeSecurityContext';
import { AccessType, PermissionLevel } from '@lawprotect/shared-ts';
import { SignatureServiceConfig } from '../config/AppConfig';
import { GenerateViewLinkParams, ViewLinkResult, DocumentInfo } from '../domain/types/document-access';

/**
 * Constants for external user access
 */
const EXTERNAL_USER = 'external-user';
const DEFAULT_CONTENT_TYPE = 'application/pdf';

export class DocumentAccessService {
  constructor(
    private readonly invitationTokenService: InvitationTokenService,
    private readonly s3Service: S3Service,
    private readonly signerService: SignerService,
    private readonly envelopeService: EnvelopeService,
    private readonly auditService: AuditService,
    private readonly config: SignatureServiceConfig
  ) {}

  /**
   * Generates a view/share link for an external user using an invitation token
   * @param params - Parameters for view link generation
   * @param params.invitationToken - Invitation token for validation
   * @param params.requestedTtlSeconds - Optional TTL in seconds for the generated URL
   * @param params.securityContext - Security context for the request
   * @returns Promise that resolves to view link result with document, signer, and envelope information
   * @throws BadRequestError when invitation token is invalid
   * @throws NotFoundError when envelope or signer is not found
   * @throws ForbiddenError when user lacks permission to access the document
   * @example
   * const result = await documentAccessService.generateViewLinkForInvitation({
   *   invitationToken: 'abc123',
   *   requestedTtlSeconds: 3600,
   *   securityContext: { userId: 'user123', ipAddress: '192.168.1.1' }
   * });
   */
  async generateViewLinkForInvitation(params: GenerateViewLinkParams): Promise<ViewLinkResult> {
    const { invitationToken, requestedTtlSeconds, securityContext } = params;

    // 1) Validate token and get IDs
    const { envelopeId, signerId } = await this.validateInvitationToken(invitationToken);

    // 2) Load envelope with fallback
    const envelope = await this.loadEnvelopeWithFallback(envelopeId, securityContext);

    // 3) Resolve S3 key based on envelope status
    const s3Key = this.resolveS3Key(envelope, envelopeId);

    // 4) Compute TTL within bounds
    const ttl = this.computeTtl(requestedTtlSeconds);

    // 5) Generate presigned URL and fetch metadata
    const { viewUrl, documentInfo } = await this.generateViewUrlAndMetadata(s3Key, ttl);

    // 6) Mark token usage and load signer
    const signer = await this.markTokenAndLoadSigner(invitationToken, signerId);

    // 7) Record audit events
    await this.recordAuditEvents(envelopeId, signerId, signer, s3Key, documentInfo, ttl, securityContext);

    return {
      document: { viewUrl, ...documentInfo },
      signer,
      envelope
    };
  }

  /**
   * Validates invitation token and extracts IDs
   * @param invitationToken - The invitation token to validate
   * @returns Promise that resolves to token validation result with envelope and signer IDs
   * @throws BadRequestError when invitation token is invalid or expired
   */
  private async validateInvitationToken(invitationToken: string) {
    const tokenValidation = await this.invitationTokenService.validateInvitationToken(invitationToken);
    return {
      envelopeId: tokenValidation.getEnvelopeId(),
      signerId: tokenValidation.getSignerId(),
      tokenValidation
    };
  }

  /**
   * Loads envelope with fallback for permission issues
   * @param envelopeId - The envelope ID to load
   * @param securityContext - Security context for the request
   * @returns Promise that resolves to envelope entity
   * @throws NotFoundError when envelope is not found
   */
  private async loadEnvelopeWithFallback(envelopeId: any, securityContext: EnvelopeSecurityContext) {
    const safeContext = this.buildSafeContext(securityContext);
    
    try {
      return await this.envelopeService.getEnvelope(envelopeId, 'external-user', safeContext);
    } catch (err) {
      // Fallback to direct repository access
      const repo = (this.envelopeService as any)?.envelopeRepository;
      if (repo?.getById) {
        return await repo.getById(envelopeId);
      } else {
        throw err;
      }
    }
  }

  /**
   * Builds safe context for external users
   * @param securityContext - Original security context
   * @returns Safe security context for external user access
   */
  private buildSafeContext(securityContext: EnvelopeSecurityContext): EnvelopeSecurityContext {
    return {
      userId: securityContext?.userId || EXTERNAL_USER,
      accessType: AccessType.INVITATION,
      permission: PermissionLevel.PARTICIPANT,
      ipAddress: securityContext?.ipAddress || '',
      userAgent: securityContext?.userAgent || '',
      country: securityContext?.country || '',
      timestamp: new Date()
    };
  }

  /**
   * Resolves the appropriate S3 key based on envelope status
   * @param envelope - The envelope entity
   * @param envelopeId - The envelope ID
   * @returns S3 key for the document
   */
  private resolveS3Key(envelope: any, envelopeId: any): string {
    const meta: any = (envelope as any)?.getMetadata?.() || {};
    const isCompleted = envelope.getStatus && envelope.getStatus() === EnvelopeStatus.COMPLETED;
    
    if (isCompleted) {
      return this.getSignedS3Key(meta, envelopeId);
    } else {
      return this.getFlattenedS3Key(meta, envelope);
    }
  }

  /**
   * Gets signed S3 key
   * @param meta - Envelope metadata
   * @param envelopeId - The envelope ID
   * @returns S3 key for signed document
   */
  private getSignedS3Key(meta: any, envelopeId: any): string {
    return typeof meta.signedS3Key === 'string' && meta.signedS3Key.length > 0
      ? meta.signedS3Key
      : `envelopes/${envelopeId.getValue()}/signed.pdf`;
  }

  /**
   * Gets flattened S3 key
   * @param meta - Envelope metadata
   * @param envelope - The envelope entity
   * @returns S3 key for flattened document
   */
  private getFlattenedS3Key(meta: any, envelope: any): string {
    return typeof meta.flattenedS3Key === 'string' && meta.flattenedS3Key.length > 0
      ? meta.flattenedS3Key
      : `envelopes/${(envelope as any)?.getDocumentId?.() || meta.documentId || ''}/flattened.pdf`;
  }

  /**
   * Computes TTL within bounds
   * @param requestedTtlSeconds - Optional requested TTL in seconds
   * @returns TTL in seconds within configured bounds
   */
  private computeTtl(requestedTtlSeconds?: number): number {
    const defaultTtl = this.config.s3.documentViewTtlSeconds;
    const maxTtl = this.config.s3.maxPresignTtlSeconds || defaultTtl;
    
    return typeof requestedTtlSeconds === 'number' && requestedTtlSeconds > 0
      ? Math.min(requestedTtlSeconds, maxTtl)
      : defaultTtl;
  }

  /**
   * Generates view URL and fetches document metadata
   * @param s3Key - S3 key for the document
   * @param ttl - TTL in seconds for the presigned URL
   * @returns Promise that resolves to view URL and document metadata
   */
  private async generateViewUrlAndMetadata(s3Key: string, ttl: number): Promise<{ viewUrl: string; documentInfo: DocumentInfo }> {
    const viewUrl = await this.s3Service.generatePresignedDownloadUrl({ 
      s3Key, 
      expiresIn: ttl, 
      contentType: DEFAULT_CONTENT_TYPE 
    });
    const documentInfo = await this.s3Service.getDocumentInfo(s3Key);
    
    return { viewUrl, documentInfo };
  }

  /**
   * Marks token as used and loads signer
   * @param invitationToken - The invitation token to mark as used
   * @param signerId - The signer ID
   * @returns Promise that resolves to signer entity
   * @throws NotFoundError when signer is not found
   */
  private async markTokenAndLoadSigner(invitationToken: string, signerId: any) {
    await this.invitationTokenService.markTokenAsUsed(invitationToken, EXTERNAL_USER);
    return await this.signerService.getSigner(new SignerId(signerId.getValue()));
  }

  /**
   * Records audit events for document access
   * @param envelopeId - The envelope ID
   * @param signerId - The signer ID
   * @param signer - The signer entity
   * @param s3Key - S3 key for the document
   * @param documentInfo - Document metadata information
   * @param ttl - TTL in seconds for the URL
   * @param securityContext - Security context for the request
   */
  private async recordAuditEvents(
    envelopeId: any,
    signerId: any,
    signer: any,
    s3Key: string,
    documentInfo: DocumentInfo,
    ttl: number,
    securityContext: EnvelopeSecurityContext
  ): Promise<void> {
    await this.recordDocumentAccessAudit(envelopeId, signerId, signer, s3Key, documentInfo, ttl, securityContext);
    await this.recordLinkSharedAudit(envelopeId, signerId, securityContext);
  }

  /**
   * Records document access audit event
   * @param envelopeId - The envelope ID
   * @param signerId - The signer ID
   * @param signer - The signer entity
   * @param s3Key - S3 key for the document
   * @param documentInfo - Document metadata information
   * @param ttl - TTL in seconds for the URL
   * @param securityContext - Security context for the request
   */
  private async recordDocumentAccessAudit(
    envelopeId: any,
    signerId: any,
    signer: any,
    s3Key: string,
    documentInfo: DocumentInfo,
    ttl: number,
    securityContext: EnvelopeSecurityContext
  ): Promise<void> {
    try {
      await this.auditService.createEvent({
        type: AuditEventType.DOCUMENT_ACCESSED,
        envelopeId: envelopeId.getValue(),
        signerId: signerId.getValue(),
        userId: EXTERNAL_USER,
        userEmail: signer?.getEmail()?.getValue() || 'unknown',
        ipAddress: securityContext?.ipAddress,
        userAgent: securityContext?.userAgent,
        country: securityContext?.country,
        description: `Document accessed via invitation link by ${signer?.getFullName?.() || 'external user'}`,
        metadata: {
          s3Key,
          filename: documentInfo.filename,
          contentType: documentInfo.contentType,
          size: documentInfo.size,
          accessType: AccessType.INVITATION,
          expiresAt: new Date(Date.now() + ttl * 1000).toISOString(),
        }
      });
    } catch (error) {
      // Log audit failure but don't break the main flow
      console.warn('Failed to record document access audit event:', error);
    }
  }

  /**
   * Records link shared audit event if applicable
   * @param envelopeId - The envelope ID
   * @param _signerId - The signer ID (unused)
   * @param securityContext - Security context for the request
   */
  private async recordLinkSharedAudit(envelopeId: any, _signerId: any, securityContext: EnvelopeSecurityContext): Promise<void> {
    if (this.shouldRecordLinkSharedAudit(securityContext)) {
      try {
        await this.auditService.createEvent({
          type: AuditEventType.LINK_SHARED,
          envelopeId: envelopeId.getValue(),
          userId: securityContext.userId,
          description: 'Share link generated for external viewing',
          metadata: {
            ipAddress: securityContext?.ipAddress,
            userAgent: securityContext?.userAgent
          }
        });
      } catch (error) {
        // Log audit failure but don't break the main flow
        console.warn('Failed to record link shared audit event:', error);
      }
    }
  }

  /**
   * Determines if link shared audit should be recorded
   * @param securityContext - Security context for the request
   * @returns True if link shared audit should be recorded
   */
  private shouldRecordLinkSharedAudit(securityContext: EnvelopeSecurityContext): boolean {
    return !!(securityContext?.userId && 
      (securityContext?.accessType === AccessType.DIRECT || 
       securityContext?.permission === PermissionLevel.OWNER || 
       securityContext?.permission === PermissionLevel.ADMIN));
  }
}


