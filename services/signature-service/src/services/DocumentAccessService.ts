/**
 * @file DocumentAccessService.ts
 * @description Encapsulates document view/share link generation for external users.
 * @summary Validates tokens, resolves document keys, generates presigned URLs, and records audit.
 */

import { InvitationTokenService } from './InvitationTokenService';
import { S3Service } from './S3Service';
import { SignerService } from './SignerService';
import { EnvelopeService } from './EnvelopeService';
import { AuditService } from './AuditService';
import { AuditEventType } from '../domain/enums/AuditEventType';
import { EnvelopeStatus } from '../domain/enums/EnvelopeStatus';
import { SignerId } from '../domain/value-objects/SignerId';

export class DocumentAccessService {
  constructor(
    private readonly invitationTokenService: InvitationTokenService,
    private readonly s3Service: S3Service,
    private readonly signerService: SignerService,
    private readonly envelopeService: EnvelopeService,
    private readonly auditService: AuditService,
    private readonly config: any
  ) {}

  /**
   * Generates a view/share link for an external user using an invitation token.
   * Applies TTL bounds, resolves the appropriate S3 key, and records audit via underlying services.
   */
  async generateViewLinkForInvitation(params: {
    invitationToken: string;
    requestedTtlSeconds?: number;
    securityContext: any;
  }): Promise<{ document: any; signer: any; envelope: any }> {
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
   */
  private async loadEnvelopeWithFallback(envelopeId: any, securityContext: any) {
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
   */
  private buildSafeContext(securityContext: any) {
    return {
      userId: securityContext?.userId || 'external-user',
      accessType: 'INVITATION',
      permission: 'PARTICIPANT',
      ipAddress: securityContext?.ipAddress,
      userAgent: securityContext?.userAgent,
      timestamp: new Date()
    } as any;
  }

  /**
   * Resolves the appropriate S3 key based on envelope status
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
   */
  private getSignedS3Key(meta: any, envelopeId: any): string {
    return typeof meta.signedS3Key === 'string' && meta.signedS3Key.length > 0
      ? meta.signedS3Key
      : `envelopes/${envelopeId.getValue()}/signed.pdf`;
  }

  /**
   * Gets flattened S3 key
   */
  private getFlattenedS3Key(meta: any, envelope: any): string {
    return typeof meta.flattenedS3Key === 'string' && meta.flattenedS3Key.length > 0
      ? meta.flattenedS3Key
      : `envelopes/${(envelope as any)?.getDocumentId?.() || meta.documentId || ''}/flattened.pdf`;
  }

  /**
   * Computes TTL within bounds
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
   */
  private async generateViewUrlAndMetadata(s3Key: string, ttl: number) {
    const viewUrl = await this.s3Service.generatePresignedDownloadUrl({ 
      s3Key, 
      expiresIn: ttl, 
      contentType: 'application/pdf' 
    });
    const documentInfo = await this.s3Service.getDocumentInfo(s3Key);
    
    return { viewUrl, documentInfo };
  }

  /**
   * Marks token as used and loads signer
   */
  private async markTokenAndLoadSigner(invitationToken: string, signerId: any) {
    await this.invitationTokenService.markTokenAsUsed(invitationToken, 'external-user');
    return await this.signerService.getSigner(new SignerId(signerId.getValue()));
  }

  /**
   * Records audit events for document access
   */
  private async recordAuditEvents(
    envelopeId: any,
    signerId: any,
    signer: any,
    s3Key: string,
    documentInfo: any,
    ttl: number,
    securityContext: any
  ) {
    await this.recordDocumentAccessAudit(envelopeId, signerId, signer, s3Key, documentInfo, ttl, securityContext);
    await this.recordLinkSharedAudit(envelopeId, signerId, securityContext);
  }

  /**
   * Records document access audit event
   */
  private async recordDocumentAccessAudit(
    envelopeId: any,
    signerId: any,
    signer: any,
    s3Key: string,
    documentInfo: any,
    ttl: number,
    securityContext: any
  ) {
    try {
      await this.auditService.createEvent({
        type: AuditEventType.DOCUMENT_ACCESSED,
        envelopeId: envelopeId.getValue(),
        signerId: signerId.getValue(),
        userId: 'external-user',
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
          accessType: 'INVITATION',
          expiresAt: new Date(Date.now() + ttl * 1000).toISOString(),
        }
      });
    } catch {
      // Ignore audit failures
    }
  }

  /**
   * Records link shared audit event if applicable
   */
  private async recordLinkSharedAudit(envelopeId: any, _signerId: any, securityContext: any) {
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
      } catch {
        // Ignore audit failures
      }
    }
  }

  /**
   * Determines if link shared audit should be recorded
   */
  private shouldRecordLinkSharedAudit(securityContext: any): boolean {
    return !!(securityContext?.userId && 
      (securityContext?.accessType === 'DIRECT' || 
       securityContext?.permission === 'OWNER' || 
       securityContext?.permission === 'ADMIN'));
  }
}


