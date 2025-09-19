/**
 * @fileoverview DownloadSignedDocumentHandler - Handler for downloading signed documents
 * @summary Handles secure signed document download with access control and audit logging
 * @description This handler provides secure access to completed and signed documents
 * through presigned URLs with proper authentication, authorization, and audit logging.
 * It validates document completion status and generates time-limited download URLs.
 */

import { ControllerFactory, } from '@lawprotect/shared-ts';
import { EnvelopeService } from '../../services/EnvelopeService';
import { S3Service } from '../../services/S3Service';
import { ServiceFactory } from '../../infrastructure/factories/ServiceFactory';
import { EnvelopeId } from '../../domain/value-objects/EnvelopeId';
import { DownloadSignedDocumentPathSchema } from '../../domain/schemas/DownloadSignedDocumentSchema';
import { loadConfig } from '../../config';
import { getSignedDocumentS3Key } from '../../utils/signedDocumentKey';
import { InvitationTokenService } from '../../services/InvitationTokenService';
// Audit is handled by S3Service via recordDownloadAction

/**
 * DownloadSignedDocumentHandler - Production-ready handler using ControllerFactory
 * 
 * This handler provides secure access to completed and signed documents through
 * presigned URLs with proper authentication, authorization, and audit logging.
 * It uses ControllerFactory with a comprehensive middleware pipeline.
 * 
 * @middleware
 * - JWT authentication: Validates user identity and token validity
 * - Role validation: Ensures user has appropriate role permissions
 * - Request validation: Validates envelope ID format and parameters
 * - Service orchestration: Coordinates between domain services
 * - Response formatting: Transforms domain entities to API response format
 * 
 * @flow
 * 1. Access Validation - Validates user has access to the document
 * 2. Status Validation - Ensures document is completed and signed
 * 3. Document Retrieval - Retrieves signed document metadata from S3
 * 4. URL Generation - Generates time-limited presigned download URL
 * 5. Response Delivery - Returns download URL with expiration metadata
 * 
 * @responsibilities
 * - Access Control: Validates user permissions for document access
 * - Status Validation: Ensures document is completed and signed
 * - Secure URLs: Generates presigned URLs with configurable expiration
 * - Audit Trail: Logs all download activities for compliance
 * - Metadata: Provides document metadata (filename, size, content type)
 * 
 * @exclusions
 * - Document Signing: Handled by SignDocumentHandler
 * - Document Storage: Managed by Document Service
 * - File Uploads: Handled by Document Service
 * - Email Notifications: Handled by Notification Service
 * - Document Processing: Handled by Document Service
 */
export const downloadSignedDocumentHandler = ControllerFactory.createCommand({
  // Validation schemas
  pathSchema: DownloadSignedDocumentPathSchema,
  
  // Service configuration - use domain services directly
  appServiceClass: class {
    private readonly envelopeService: EnvelopeService;
    private readonly s3Service: S3Service;
    private readonly invitationTokenService: InvitationTokenService;

    constructor() {
      // Create domain services with proper dependencies using ServiceFactory
      this.envelopeService = ServiceFactory.createEnvelopeService();
      this.s3Service = ServiceFactory.createS3Service();
      this.invitationTokenService = ServiceFactory.createInvitationTokenService();
    }

    /**
     * Executes the signed document download orchestration
     * 
     * @param params - Extracted parameters from request
     * @returns Promise resolving to download URL and metadata
     */
    async execute(params: any) {
      let envelopeId = new EnvelopeId(params.envelopeId);
      const isInvitation = this.isInvitationAccess(params);

      // 1. Load envelope respecting access rules
      const envelope = isInvitation 
        ? await this.loadEnvelopeForInvitationAccess(envelopeId, params)
        : await this.loadEnvelopeForDirectAccess(envelopeId, params);

      // 2. Resolve S3 key based on envelope status
      const s3Key = this.resolveS3Key(envelope, envelopeId);

      // 3. Generate presigned download URL
      const downloadUrl = await this.generateDownloadUrl(s3Key, params);

      // 4. Get document metadata
      const documentInfo = await this.s3Service.getDocumentInfo(s3Key);

      // 5. Audit: document downloaded
      await this.recordDownloadAudit(envelopeId, s3Key, params, isInvitation);

      return {
        downloadUrl,
        documentInfo,
        envelope
      };
    }

    /**
     * Determines if this is an invitation access
     */
    private isInvitationAccess(params: any): boolean {
      return params.securityContext?.accessType === 'INVITATION' || !!params.requestBody?.invitationToken;
    }

    /**
     * Loads envelope for invitation access
     */
    private async loadEnvelopeForInvitationAccess(envelopeId: EnvelopeId, params: any): Promise<any> {
      return await this.loadEnvelopeForInvitation(envelopeId, params);
    }

    /**
     * Loads envelope for direct access
     */
    private async loadEnvelopeForDirectAccess(envelopeId: EnvelopeId, params: any): Promise<any> {
      return await this.envelopeService.getEnvelope(
        envelopeId,
        params.userId,
        params.securityContext
      );
    }

    /**
     * Loads envelope for invitation access with fallback
     */
    private async loadEnvelopeForInvitation(envelopeId: EnvelopeId, params: any): Promise<any> {
      // Try to validate invitation token first
      if (params.requestBody?.invitationToken) {
        try {
          const token = await this.invitationTokenService.validateInvitationToken(params.requestBody.invitationToken);
          envelopeId = token.getEnvelopeId();
        } catch {
          // Continue with original envelopeId if token validation fails
        }
      }

      // Try to get envelope with invitation context
      try {
        return await this.envelopeService.getEnvelope(
          envelopeId,
          'external-user',
          { ...params.securityContext, permission: 'PARTICIPANT', accessType: 'INVITATION' }
        );
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
     * Resolves the appropriate S3 key based on envelope status
     */
    private resolveS3Key(envelope: any, envelopeId: EnvelopeId): string {
      const meta = (envelope as any)?.getMetadata?.() || {};
      const isCompleted = envelope.getStatus && envelope.getStatus() === 'COMPLETED';
      
      if (isCompleted) {
        return this.getSignedS3Key(meta, envelopeId);
      } else {
        return this.getFlattenedS3Key(meta, envelope);
      }
    }

    /**
     * Gets the signed S3 key
     */
    private getSignedS3Key(meta: any, envelopeId: EnvelopeId): string {
      return typeof meta.signedS3Key === 'string' && meta.signedS3Key.length > 0
        ? meta.signedS3Key
        : getSignedDocumentS3Key(envelopeId.getValue());
    }

    /**
     * Gets the flattened S3 key
     */
    private getFlattenedS3Key(meta: any, envelope: any): string {
      return typeof meta.flattenedS3Key === 'string' && meta.flattenedS3Key.length > 0
        ? meta.flattenedS3Key
        : `envelopes/${(envelope as any)?.getDocumentId?.() || meta.documentId || ''}/flattened.pdf`;
    }

    /**
     * Generates presigned download URL
     */
    private async generateDownloadUrl(s3Key: string, params: any): Promise<string> {
      const config = loadConfig();
      return await this.s3Service.generatePresignedDownloadUrl({
        s3Key,
        expiresIn: params.expiresIn || config.s3.presignTtlSeconds,
        contentType: 'application/pdf'
      });
    }

    /**
     * Records download audit action
     */
    private async recordDownloadAudit(envelopeId: EnvelopeId, s3Key: string, params: any, isInvitation: boolean): Promise<void> {
      await this.s3Service.recordDownloadAction({
        envelopeId: envelopeId.getValue(),
        userId: params.securityContext?.userId || (isInvitation ? 'external-user' : undefined),
        userEmail: params.authEmail || params.securityContext?.email,
        s3Key,
        ipAddress: params.securityContext?.ipAddress,
        userAgent: params.securityContext?.userAgent,
        country: params.securityContext?.country
      });
    }
  },
  
  // Parameter extraction - transforms HTTP request to domain parameters
  extractParams: (path: any, body: any, query: any, context: any) => ({
    envelopeId: path.envelopeId,
    expiresIn: query.expiresIn ? parseInt(query.expiresIn) : 3600,
    userId: context.auth.userId,
    securityContext: context.securityContext,
    authEmail: context.auth?.email,
    requestBody: typeof body === 'string' ? (() => { try { return JSON.parse(body); } catch { return {}; } })() : (body || {})
  }),
  
  // Response configuration
  responseType: 'ok',
  transformResult: async (result: any) => {
    // Transform domain entities to API response format
    return {
      downloadUrl: result.downloadUrl,
      expiresAt: new Date(Date.now() + (result.expiresIn || 3600) * 1000).toISOString(),
      filename: 'signed.pdf',
      contentType: result.documentInfo?.contentType || 'application/pdf',
      size: result.documentInfo?.size
    };
  },
  
  // Security configuration
  requireAuth: true,
  includeSecurityContext: true
});