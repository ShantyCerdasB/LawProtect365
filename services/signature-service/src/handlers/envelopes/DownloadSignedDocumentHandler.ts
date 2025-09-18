/**
 * @fileoverview DownloadSignedDocumentHandler - Handler for downloading signed documents
 * @summary Handles secure signed document download with access control and audit logging
 * @description This handler provides secure access to completed and signed documents
 * through presigned URLs with proper authentication, authorization, and audit logging.
 * It validates document completion status and generates time-limited download URLs.
 */

import { ControllerFactory, UserRole, VALID_COGNITO_ROLES, ConflictError } from '@lawprotect/shared-ts';
import { EnvelopeService } from '../../services/EnvelopeService';
import { S3Service } from '../../services/S3Service';
import { ServiceFactory } from '../../infrastructure/factories/ServiceFactory';
import { EnvelopeId } from '../../domain/value-objects/EnvelopeId';
import { DownloadSignedDocumentPathSchema } from '../../domain/schemas/DownloadSignedDocumentSchema';
import { loadConfig } from '../../config';
import { getSignedDocumentS3Key } from '../../utils/signedDocumentKey';
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

    constructor() {
      // Create domain services with proper dependencies using ServiceFactory
      this.envelopeService = ServiceFactory.createEnvelopeService();
      this.s3Service = ServiceFactory.createS3Service();
    }

    /**
     * Executes the signed document download orchestration
     * 
     * @param params - Extracted parameters from request
     * @returns Promise resolving to download URL and metadata
     */
    async execute(params: any) {
      const envelopeId = new EnvelopeId(params.envelopeId);

      // 1. Get envelope and validate it's completed
      const envelope = await this.envelopeService.getEnvelope(
        envelopeId,
        params.userId,
        params.securityContext
      );

      // 2. Validate document is completed and signed
      if (envelope.getStatus() !== 'COMPLETED') {
        throw new ConflictError('Document is not completed and signed yet', 'DOCUMENT_NOT_READY');
      }

      // 3. Resolve signed S3 key: prefer envelope metadata, fallback to canonical key
      const meta = (envelope as any)?.getMetadata?.() || {};
      const s3Key = typeof meta.signedS3Key === 'string' && meta.signedS3Key.length > 0
        ? meta.signedS3Key
        : getSignedDocumentS3Key(envelopeId.getValue());
      
      // 4. Generate presigned download URL using configured TTL
      const config = loadConfig();
      const downloadUrl = await this.s3Service.generatePresignedDownloadUrl({
        s3Key,
        expiresIn: params.expiresIn || config.s3.presignTtlSeconds,
        contentType: 'application/pdf'
      });

      // 5. Get document metadata
      const documentInfo = await this.s3Service.getDocumentInfo(s3Key);

      // 6. Audit: document downloaded (delegated to S3Service)
      await this.s3Service.recordDownloadAction({
        envelopeId: envelopeId.getValue(),
        userId: params.securityContext?.userId,
        userEmail: params.authEmail || params.securityContext?.email,
        s3Key,
        ipAddress: params.securityContext?.ipAddress,
        userAgent: params.securityContext?.userAgent,
        country: params.securityContext?.country
      });

      return {
        downloadUrl,
        documentInfo,
        envelope
      };
    }
  },
  
  // Parameter extraction - transforms HTTP request to domain parameters
  extractParams: (path: any, _body: any, query: any, context: any) => ({
    envelopeId: path.envelopeId,
    expiresIn: query.expiresIn ? parseInt(query.expiresIn) : 3600,
    userId: context.auth.userId,
    securityContext: context.securityContext,
    authEmail: context.auth?.email
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
  requiredRoles: [...VALID_COGNITO_ROLES] as UserRole[],
  includeSecurityContext: true
});