/**
 * @fileoverview UpdateEnvelopeHandler - Handler for updating signature envelopes
 * @summary Handles envelope update operations with comprehensive validation
 * @description This handler manages envelope updates including metadata changes,
 * signer additions/removals, and signing order modifications with proper validation.
 */

import { ControllerFactory, VALID_COGNITO_ROLES, SigningOrderType } from '@lawprotect/shared-ts';
import { ServiceFactory } from '../../infrastructure/factories/ServiceFactory';
import { UpdateEnvelopeSchema } from '../../domain/schemas/EnvelopeSchema';
import { EnvelopeIdSchema } from '../../domain/schemas/EnvelopeSchema';
import { EnvelopeId } from '../../domain/value-objects/EnvelopeId';
import { UpdateEnvelopeData } from '../../domain/rules/EnvelopeUpdateValidationRule';

export const updateEnvelopeHandler = ControllerFactory.createCommand({
  // Validation schemas
  pathSchema: EnvelopeIdSchema,
  bodySchema: UpdateEnvelopeSchema,
  
  // Service configuration - use new DDD architecture
  appServiceClass: class {
    private readonly signatureOrchestrator: any;

    constructor() {
      // Create SignatureOrchestrator using ServiceFactory
      this.signatureOrchestrator = ServiceFactory.createSignatureOrchestrator();
    }

    /**
     * Executes the envelope update orchestration
     * 
     * @param params - Extracted parameters from request
     * @returns Promise resolving to updated envelope
     */
    async execute(params: any) {
      // Use SignatureOrchestrator to update envelope
      const result = await this.signatureOrchestrator.updateEnvelope(
        params.envelopeId,
        params.updateData,
        params.userId
      );

      return {
        envelope: result
      };
    }
  },
  
  // Parameter extraction - transforms HTTP request to domain parameters
  extractParams: (path: any, body: any, _query: any, context: any) => ({
    envelopeId: EnvelopeId.fromString(path.id),
    updateData: {
      title: body.title,
      description: body.description,
      expiresAt: body.expiresAt,
      signingOrderType: body.signingOrderType as SigningOrderType,
      sourceKey: body.sourceKey,
      metaKey: body.metaKey,
      addSigners: body.addSigners,
      removeSignerIds: body.removeSignerIds
    } as UpdateEnvelopeData,
    userId: context.auth.userId,
    securityContext: context.auth
  }),
  
  // Response configuration
  responseType: 'ok',
  transformResult: async (result: any) => {
    // Transform domain entities to API response format
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
      // Template-specific fields (only present for TEMPLATE origin)
      ...(result.envelope.getOrigin().getType() === 'TEMPLATE' && {
        templateId: result.envelope.getOrigin().getTemplateId(),
        templateVersion: result.envelope.getOrigin().getTemplateVersion()
      })
    };
  },
  
  // Security configuration
  requireAuth: true, // Requires JWT authentication
  requiredRoles: [...VALID_COGNITO_ROLES], // Allowed user roles
  includeSecurityContext: true // Include security context in request
});
