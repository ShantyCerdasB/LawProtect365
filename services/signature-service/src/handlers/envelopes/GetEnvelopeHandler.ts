/**
 * @fileoverview GetEnvelopeHandler - Handler for retrieving envelope details
 * @summary Handles envelope retrieval with complete signer information and access validation
 * @description This handler processes requests to retrieve envelope details including
 * complete signer information, progress tracking, and access validation for both
 * authenticated users (owners) and external users (via invitation tokens).
 */

import { ControllerFactory } from '@lawprotect/shared-ts';
import { ServiceFactory } from '../../infrastructure/factories/services/ServiceFactory';
import { GetEnvelopeQuerySchema, EnvelopeIdSchema } from '../../domain/schemas/EnvelopeSchema';
import { EnvelopeId } from '../../domain/value-objects/EnvelopeId';

/**
 * GetEnvelopeHandler - Production-ready handler using ControllerFactory
 *
 * @description This handler retrieves envelope details with complete signer information.
 * It supports both authenticated users (owners) and external users (via invitation tokens).
 * Always includes complete signer information for comprehensive envelope details.
 *
 * @middleware
 * - Optional JWT Authentication: Allows access without auth for external users
 * - Request validation: Validates request parameters using GetEnvelopeQuerySchema
 * - Service orchestration: Coordinates between domain services using SignatureOrchestrator
 * - Response formatting: Transforms domain entities to API response format
 *
 * @flow
 * 1. Validation - Validates request parameters and access
 * 2. Access Control - Validates user access (owner or external via token)
 * 3. Envelope Retrieval - Gets envelope with complete signer information
 * 4. Audit Tracking - Creates audit events for external user access
 * 5. Response Assembly - Returns complete envelope details with signers
 *
 * @responsibilities
 * - Envelope Retrieval: Gets envelope with complete signer information
 * - Access Control: Validates owner access or external user access via invitation token
 * - Audit Tracking: Creates audit events for external user document access
 * - Response Formatting: Transforms domain entities to API response format
 *
 * @exclusions
 * - Email Notifications: Handled by NotificationService
 * - Document Storage: Handled by Document Service
 * - Document Processing: Handled by Document Service
 * - Permission Validation: Handled by middleware pipeline
 */
export const getEnvelopeHandler = ControllerFactory.createQuery({
  // Validation schemas
  pathSchema: EnvelopeIdSchema,
  querySchema: GetEnvelopeQuerySchema,
  
  // Service configuration - use new DDD architecture
  appServiceClass: class {
    private readonly signatureOrchestrator: any;
    
    constructor() {
      this.signatureOrchestrator = ServiceFactory.createSignatureOrchestrator();
    }
    
    /**
     * Executes the envelope retrieval orchestration
     * 
     * @param params - Extracted parameters from request
     * @returns Promise resolving to envelope with complete signer information
     */
    async execute(params: any) {
      try {
        return await this.signatureOrchestrator.getEnvelope(
          params.envelopeId,
          params.userId,
          params.invitationToken,
          params.securityContext
        );
      } catch (error) {
        // Re-throw the error to be handled by the error middleware
        throw error;
      }
    }
  },
  
  // Parameter extraction - transforms HTTP request to domain parameters
  extractParams: (path: any, _body: any, query: any, context: any) => ({
    envelopeId: EnvelopeId.fromString(path.id),
    userId: context.auth?.userId === 'external-user' ? undefined : context.auth?.userId, // ✅ Distinguir entre usuarios reales y external users
    invitationToken: query.invitationToken, // Para external users
    securityContext: context.securityContext // ✅ Usar securityContext del middleware
  }),
  
  // Response configuration
  responseType: 'ok',
  transformResult: async (result: any) => {
    try {
      // Transform domain entities to API response format with complete signer information
      const response = {
        id: result.envelope.getId().getValue(),
        title: result.envelope.getTitle(),
        description: result.envelope.getDescription(),
        status: result.envelope.getStatus().getValue(),
        signingOrderType: result.envelope.getSigningOrder().getType(),
        originType: result.envelope.getOrigin().getType(),
        createdBy: result.envelope.getCreatedBy(),
        sourceKey: result.envelope.getSourceKey()?.getValue(),
        metaKey: result.envelope.getMetaKey()?.getValue(),
        expiresAt: result.envelope.getExpiresAt(),
        createdAt: result.envelope.getCreatedAt(),
        updatedAt: result.envelope.getUpdatedAt(),
        accessType: result.accessType,
        // Template-specific fields (only present for TEMPLATE origin)
        ...(result.envelope.getOrigin().getType() === 'TEMPLATE' && {
          templateId: result.envelope.getOrigin().getTemplateId(),
          templateVersion: result.envelope.getOrigin().getTemplateVersion()
        }),
        // ✅ SIEMPRE incluir signers con información completa
        signers: result.signers.map((signer: any) => ({
          id: signer.getId().getValue(),
          email: signer.getEmail()?.getValue(),
          fullName: signer.getFullName(),
          isExternal: signer.getIsExternal(),
          order: signer.getOrder(),
          status: signer.getStatus(),
          userId: signer.getUserId(), // Para tracking de external users
          signedAt: signer.getSignedAt(),
          declinedAt: signer.getDeclinedAt(),
          declineReason: signer.getDeclineReason(),
          consentGiven: signer.getConsentGiven(),
          consentTimestamp: signer.getConsentTimestamp()
        }))
      };
      
      return response;
    } catch (error) {
      console.error('❌ GetEnvelopeHandler.transformResult ERROR:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        result: {
          hasEnvelope: !!result.envelope,
          hasSigners: !!result.signers,
          signersCount: result.signers?.length || 0,
          accessType: result.accessType
        }
      });
      throw error;
    }
  },
  
  // Security configuration
  requireAuth: true, // ✅ Permite tanto usuarios autenticados como external users con invitation tokens
  requiredRoles: undefined, // No requiere roles específicos
  includeSecurityContext: true
});