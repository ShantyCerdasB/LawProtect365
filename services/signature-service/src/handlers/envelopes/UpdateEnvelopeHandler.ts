/**
 * @fileoverview UpdateEnvelopeHandler - Handler for updating existing envelopes
 * @summary Handles envelope updates including signer modifications
 * @description This handler updates envelope metadata and manages signer additions/removals
 * when the envelope is in DRAFT status.
 */

import { ControllerFactory, UserRole, VALID_COGNITO_ROLES } from '@lawprotect/shared-ts';
import { EnvelopeService } from '../../services/EnvelopeService';
import { SignerService } from '../../services/SignerService';
import { ServiceFactory } from '../../infrastructure/factories/ServiceFactory';
import { EnvelopeId } from '../../domain/value-objects/EnvelopeId';
import { UpdateEnvelopePathSchema, UpdateEnvelopeBodySchema } from '../../domain/schemas/UpdateEnvelopeSchema';

/**
 * UpdateEnvelopeHandler - Production-ready handler using ControllerFactory
 * 
 * @description This handler updates envelope metadata and manages signer modifications
 * when the envelope is in DRAFT status. It provides comprehensive envelope update
 * functionality including metadata changes and signer management operations.
 *
 * @middleware
 * - JWT Authentication: Validates user identity and token validity
 * - Role validation: Ensures user has appropriate role permissions
 * - Signature permission validation: Validates MANAGE permissions for envelope updates
 * - Request validation: Validates envelope ID and request body format
 * - Service orchestration: Coordinates between domain services
 * - Response formatting: Transforms domain entities to API response format
 *
 * @flow
 * 1. Status Validation - Validates envelope exists and is in DRAFT status
 * 2. Metadata Update - Updates envelope metadata if provided
 * 3. Signer Management - Handles signer additions, removals, and updates
 * 4. Token Generation - Generates invitation tokens for new external signers
 * 5. Database Update - Persists all changes to database
 * 6. Audit Logging - Generates audit events for all changes
 * 7. Response Delivery - Returns updated envelope with all modifications
 *
 * @responsibilities
 * - Metadata Updates: Updates envelope title, description, expiration, custom fields
 * - Signer Management: Adds, removes, and updates signers in the envelope
 * - Token Generation: Generates invitation tokens for new external signers
 * - Status Validation: Ensures envelope is in DRAFT status for updates
 * - Audit Trail: Generates audit events for all modification tracking
 * - Business Validation: Validates business rules and constraints
 * - Response Formatting: Transforms domain entities to API response format
 *
 * @exclusions
 * - Email Notifications: Handled by SendEnvelopeHandler when envelope is sent
 * - Status Changes: Handled by SendEnvelopeHandler
 * - Signer Consent: Handled by SignDocumentHandler
 * - Document Changes: Handled by Document Service
 * - Permission Validation: Handled by middleware pipeline
 *
 * @businessRules
 * - Only DRAFT envelopes can be updated
 * - SENT, COMPLETED, or CANCELLED envelopes cannot be modified
 * - Signer additions require valid email addresses and order assignment
 * - Signer removals are only allowed for non-signed signers
 * - All changes are atomic and must succeed together
 *
 * @signingOrder
 * - OWNER_FIRST: Owner signs first (order 1), then all invited signers (no specific order)
 * - INVITEES_FIRST: All invited signers sign first (no specific order), then owner signs last
 * - New signers are assigned appropriate order based on signing order type
 */
export const updateEnvelopeHandler = ControllerFactory.createCommand({
  // Validation schemas
  pathSchema: UpdateEnvelopePathSchema,
  bodySchema: UpdateEnvelopeBodySchema,
  
  // Service configuration - use domain services directly
  appServiceClass: class {
    private readonly envelopeService: EnvelopeService;
    private readonly signerService: SignerService;

    constructor() {
      // Create domain services with proper dependencies using ServiceFactory
      this.envelopeService = ServiceFactory.createEnvelopeService();
      this.signerService = ServiceFactory.createSignerService();
    }

    /**
     * Executes the envelope update orchestration
     * 
     * @param params - Extracted parameters from request
     * @returns Promise resolving to updated envelope with all modifications
     */
    async execute(params: any) {
      const envelopeId = new EnvelopeId(params.envelopeId);

      // 1. Update envelope metadata if provided
      let envelope = await this.envelopeService.getEnvelope(
        envelopeId,
        params.userId,
        params.securityContext
      );

      if (params.metadata) {
        envelope = await this.envelopeService.updateEnvelope(
          envelopeId,
          params.metadata,
          params.userId,
          params.securityContext
        );
      }

      // 2. Handle signer updates if provided
      let updatedSigners = await this.signerService.getSignersByEnvelope(envelopeId);
      
      if (params.signerUpdates && params.signerUpdates.length > 0) {
        for (const signerUpdate of params.signerUpdates) {
          switch (signerUpdate.action) {
            case 'add':
              if (signerUpdate.signerData) {
                const newSigner = await this.signerService.addSigner(
                  envelopeId,
                  signerUpdate.signerData,
                  params.securityContext
                );
                updatedSigners.push(newSigner);
              }
              break;
            case 'remove':
              if (signerUpdate.signerId) {
                const { SignerId } = await import('../../domain/value-objects/SignerId');
                await this.signerService.removeSigner(
                  new SignerId(signerUpdate.signerId),
                  params.securityContext
                );
                updatedSigners = updatedSigners.filter(s => s.getId().getValue() !== signerUpdate.signerId);
              }
              break;
            case 'update':
              if (signerUpdate.signerId && signerUpdate.signerData) {
                const { SignerId } = await import('../../domain/value-objects/SignerId');
                const updatedSigner = await this.signerService.updateSigner(
                  new SignerId(signerUpdate.signerId),
                  signerUpdate.signerData,
                  params.securityContext
                );
                const index = updatedSigners.findIndex(s => s.getId().getValue() === signerUpdate.signerId);
                if (index !== -1) {
                  updatedSigners[index] = updatedSigner;
                }
              }
              break;
          }
        }
      }

      return {
        envelope,
        signers: updatedSigners
      };
    }
  },
  
  // Parameter extraction - transforms HTTP request to domain parameters
  extractParams: (path: any, body: any, _query: any, context: any) => ({
    envelopeId: path.envelopeId,
    metadata: body.metadata,
    signerUpdates: body.signerUpdates,
    userId: context.auth.userId,
    securityContext: context.securityContext
  }),
  
  // Response configuration
  responseType: 'ok',
  transformResult: async (result: any) => {
    // Transform domain entities to API response format
    return {
      message: 'Envelope updated successfully',
      envelope: {
        id: result.envelope.getId().getValue(),
        status: result.envelope.getStatus(),
        title: result.envelope.getMetadata().title,
        description: result.envelope.getMetadata().description,
        expiresAt: result.envelope.getMetadata().expiresAt?.toISOString(),
        updatedAt: result.envelope.getUpdatedAt().toISOString(),
        signers: result.signers.map((s: any) => ({
          id: s.getId().getValue(),
          email: s.getEmail().getValue(),
          fullName: s.getFullName(),
          status: s.getStatus(),
          order: s.getOrder()
        }))
      }
    };
  },
  
  // Security configuration
  requireAuth: true,
  requiredRoles: [...VALID_COGNITO_ROLES] as UserRole[],
  includeSecurityContext: true
});  