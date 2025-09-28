/**
 * @fileoverview DownloadDocumentHandler - Handler for downloading documents
 * @summary Handles secure download of documents with proper access validation
 * @description This handler processes requests to download documents,
 * including access validation, S3 presigned URL generation, and audit logging.
 * Supports both authenticated users (JWT) and external users (invitation tokens).
 */

import { ControllerFactory } from '@lawprotect/shared-ts';
import { CompositionRoot } from '../../infrastructure/factories';
import { DownloadDocumentPathSchema, DownloadDocumentQuerySchema, DownloadDocumentResponse } from '../../domain/schemas/DownloadSignedDocumentSchema';
import { EnvelopeId } from '../../domain/value-objects/EnvelopeId';

export const downloadDocumentHandler = ControllerFactory.createQuery({
  pathSchema: DownloadDocumentPathSchema,
  querySchema: DownloadDocumentQuerySchema,
  
  includeSecurityContext: true,
  requireAuth: true, // Allow external users via invitation token
  requiredRoles: undefined, // Will be determined by invitation token or JWT
  
  appServiceClass: class {
    private readonly signatureOrchestrator: any;

    constructor() {
      this.signatureOrchestrator = CompositionRoot.createSignatureOrchestrator();
    }

    async execute(params: {
      envelopeId: EnvelopeId;
      userId?: string;
      invitationToken?: string;
      expiresIn?: number;
      securityContext: any;
    }) {
      return await this.signatureOrchestrator.downloadDocument(
        params.envelopeId,
        params.userId,
        params.invitationToken,
        params.expiresIn,
        params.securityContext
      );
    }
  },
  
  extractParams: (path: any, _body: any, query: any, context: any) => ({
    envelopeId: EnvelopeId.fromString(path.envelopeId),
    userId: context.auth?.userId === 'external-user' ? undefined : context.auth?.userId,
    invitationToken: query.invitationToken,
    expiresIn: query.expiresIn,
    securityContext: {
      ipAddress: context.auth?.ipAddress || context.securityContext?.ipAddress,
      userAgent: context.auth?.userAgent || context.securityContext?.userAgent,
      country: context.auth?.country || context.securityContext?.country
    }
  }),
  
  responseType: 'ok',
  transformResult: async (result: any): Promise<DownloadDocumentResponse> => {
    // Handle error responses
    if (result.error) {
      return {
        success: false,
        message: result.error.message || 'Download failed',
        downloadUrl: '',
        expiresIn: 0,
        expiresAt: new Date().toISOString()
      };
    }
    
    const expiresAt = new Date(Date.now() + result.expiresIn * 1000);
    
    return {
      success: true,
      message: 'Document download URL generated successfully',
      downloadUrl: result.downloadUrl,
      expiresIn: result.expiresIn,
      expiresAt: expiresAt.toISOString()
    };
  }
});