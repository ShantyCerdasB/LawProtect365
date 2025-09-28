/**
 * @fileoverview UpdateEnvelopeHandler - Handler for updating signature envelopes
 * @summary Handles envelope update operations with comprehensive validation
 * @description This handler manages envelope updates including metadata changes,
 * signer additions/removals, and signing order modifications with proper validation.
 */

import { ControllerFactory, VALID_COGNITO_ROLES, SigningOrderType } from '@lawprotect/shared-ts';
import { CompositionRoot } from '../../infrastructure/factories';
import { UpdateEnvelopeSchema, EnvelopeIdSchema } from '../../domain/schemas/EnvelopeSchema';
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
      this.signatureOrchestrator = CompositionRoot.createSignatureOrchestrator();
    }

    /**
     * Executes the envelope update orchestration
     * @param params - Extracted parameters from request
     * @returns Promise resolving to updated envelope
     */
    async execute(params: any) {
      return await this.signatureOrchestrator.updateEnvelope(
        params.envelopeId,
        params.updateData,
        params.userId
      );
    }
  },
  
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
        ...(result.envelope.getOrigin().getType() === 'TEMPLATE' && {
          templateId: result.envelope.getOrigin().getTemplateId(),
          templateVersion: result.envelope.getOrigin().getTemplateVersion()
        }),
        ...(result.signers && {
          signers: result.signers.map((signer: any) => ({
            id: signer.getId().getValue(),
            email: signer.getEmail()?.getValue(),
            fullName: signer.getFullName(),
            isExternal: signer.getIsExternal(),
            order: signer.getOrder(),
            status: signer.getStatus(),
            userId: signer.getUserId()
          }))
        })
      };
  },
  
  requireAuth: true,
  requiredRoles: [...VALID_COGNITO_ROLES],
  includeSecurityContext: true
});
