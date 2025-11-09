/**
 * @fileoverview GetEnvelopeHandler - Handler for retrieving envelope details
 * @summary Handles envelope retrieval with complete signer information and access validation
 * @description This handler processes requests to retrieve envelope details including
 * complete signer information, progress tracking, and access validation for both
 * authenticated users (owners) and external users (via invitation tokens).
 */

import { ControllerFactory } from '@lawprotect/shared-ts';
import { CompositionRoot } from '../../infrastructure/factories';
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
    private signatureOrchestrator: any | undefined;
    
    /**
     * Executes the envelope retrieval orchestration
     * @param params - Extracted parameters from request
     * @returns Promise resolving to envelope with complete signer information
     */
    async execute(params: any) {
      const orchestrator = this.signatureOrchestrator ?? await CompositionRoot.createSignatureOrchestratorAsync();
      this.signatureOrchestrator = orchestrator;
      return await orchestrator.getEnvelope(
        params.envelopeId,
        params.userId,
        params.invitationToken,
        params.securityContext
      );
    }
  },
  
  extractParams: (path: any, _body: any, query: any, context: any) => ({
    envelopeId: EnvelopeId.fromString(path.id),
    userId: context.auth?.userId === 'external-user' ? undefined : context.auth?.userId,
    invitationToken: query.invitationToken,
    securityContext: context.securityContext
  }),
  
  responseType: 'ok',
  transformResult: async (result: any) => {
    return {
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
        ...(result.envelope.getOrigin().getType() === 'TEMPLATE' && {
          templateId: result.envelope.getOrigin().getTemplateId(),
          templateVersion: result.envelope.getOrigin().getTemplateVersion()
        }),
        signers: result.signers.map((signer: any) => ({
          id: signer.getId().getValue(),
          email: signer.getEmail()?.getValue(),
          fullName: signer.getFullName(),
          isExternal: signer.getIsExternal(),
          order: signer.getOrder(),
          status: signer.getStatus(),
          userId: signer.getUserId(),
          signedAt: signer.getSignedAt(),
          declinedAt: signer.getDeclinedAt(),
          declineReason: signer.getDeclineReason(),
          consentGiven: signer.getConsentGiven(),
          consentTimestamp: signer.getConsentTimestamp()
        }))
      };
  },
  
  requireAuth: true,
  requiredRoles: undefined,
  includeSecurityContext: true
});