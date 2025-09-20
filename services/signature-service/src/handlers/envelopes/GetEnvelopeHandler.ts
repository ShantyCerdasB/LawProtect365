/**
 * @fileoverview GetEnvelopeHandler - Handler for retrieving envelope details
 * @summary Handles envelope retrieval with signer status and progress
 * @description This handler retrieves envelope details including signer status,
 * progress tracking, and metadata for the frontend dashboard.
 */

import { ControllerFactory, UserRole, VALID_COGNITO_ROLES } from '@lawprotect/shared-ts';
import { EnvelopeService } from '../../services/EnvelopeService';
import { SignerService } from '../../services/SignerService';
import { ServiceFactory } from '../../infrastructure/factories/ServiceFactory';
import { EnvelopeId } from '../../domain/value-objects/EnvelopeId';
import { GetEnvelopePathSchema } from '../../domain/schemas/GetEnvelopeSchema';
import { calculateEnvelopeProgress } from '../../utils/envelope-progress';

/**
 * GetEnvelopeHandler - Production-ready handler using ControllerFactory
 * 
 * @description This handler retrieves envelope details with signer status and progress
 * for the frontend dashboard. It provides comprehensive envelope information including
 * metadata, signer details, and signing progress statistics.
 * 
 * @middleware
 * - JWT Authentication: Validates user identity and token validity
 * - Role validation: Ensures user has appropriate role permissions
 * - Signature permission validation: Validates READ permissions for envelope access
 * - Request validation: Validates envelope ID format and parameters
 * - Service orchestration: Coordinates between domain services
 * - Response formatting: Transforms domain entities to API response format
 * 
 * @flow
 * 1. Access Validation - Validates user has access to the envelope
 * 2. Envelope Retrieval - Retrieves envelope details from database
 * 3. Signer Retrieval - Retrieves related signers and their status
 * 4. Progress Calculation - Calculates signing progress using utility functions
 * 5. Response Formatting - Returns formatted response for frontend
 * 
 * @responsibilities
 * - Data Retrieval: Retrieves envelope details from database
 * - Signer Information: Includes signer status and progress
 * - Metadata Access: Includes document metadata and timestamps
 * - Access Control: Validates user has access to envelope
 * - Progress Statistics: Calculates and returns signing progress
 * - Response Formatting: Transforms domain entities to API format
 * 
 * @exclusions
 * - Data Modification: Handled by UpdateEnvelopeHandler
 * - Document Content: Handled by Document Service
 * - Audit Events: Not generated for read-only operations
 * - Email Notifications: Handled by Notification Service
 * - Document Processing: Handled by Document Service
 * 
 * @signingOrder
 * - OWNER_FIRST: Owner signs first (order 1), then all invited signers (no specific order)
 * - INVITEES_FIRST: All invited signers sign first (no specific order), then owner signs last
 */
export const getEnvelopeHandler = ControllerFactory.createCommand({
  // Validation schemas
  pathSchema: GetEnvelopePathSchema,
  
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
     * Executes the envelope retrieval orchestration
     * 
     * @param params - Extracted parameters from request
     * @returns Promise resolving to envelope details with signers and progress
     */
    async execute(params: any) {
      const envelopeId = new EnvelopeId(params.envelopeId);

      // 1. Get envelope details
      const envelope = await this.envelopeService.getEnvelope(
        envelopeId,
        params.userId,
        params.securityContext
      );

      // 2. Get signers for this envelope
      const signers = await this.signerService.getSignersByEnvelope(envelopeId);

      // 3. Calculate progress using utility function
      const progress = calculateEnvelopeProgress(signers);

      return {
        envelope,
        signers,
        progress
      };
    }
  },
  
  // Parameter extraction - transforms HTTP request to domain parameters
  extractParams: (path: any, _body: any, _query: any, context: any) => ({
    envelopeId: path.envelopeId,
    userId: context.auth.userId,
    securityContext: context.securityContext
  }),
  
  // Response configuration
  responseType: 'ok',
  transformResult: async (result: any) => {
    try {
      // Transform domain entities to API response format
      return {
        envelope: {
          id: result.envelope.getId().getValue(),
          status: result.envelope.getStatus(),
          title: result.envelope.getMetadata().title,
          description: result.envelope.getMetadata().description,
          expiresAt: result.envelope.getMetadata().expiresAt?.toISOString?.() ?? undefined,
          createdAt: result.envelope.getCreatedAt?.().toISOString?.() ?? new Date(result.envelope.getCreatedAt()).toISOString?.(),
          sentAt: result.envelope.getSentAt?.()?.toISOString?.(),
          completedAt: result.envelope.getCompletedAt?.()?.toISOString?.(),
          customFields: result.envelope.getMetadata().customFields,
          tags: result.envelope.getMetadata().tags,
          signers: Array.isArray(result.signers)
            ? result.signers.map((s: any) => ({
                id: s.getId().getValue(),
                email: s.getEmail().getValue(),
                fullName: s.getFullName(),
                status: s.getStatus(),
                order: s.getOrder(),
                signedAt: s.getSignedAt()?.toISOString(),
                declinedAt: s.getDeclinedAt()?.toISOString()
              }))
            : [],
          progress: result.progress
        }
      };
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.error('[GetEnvelopeHandler.transformResult] ERROR', { name: e?.name, message: e?.message, stack: e?.stack });
      throw e;
    }
  },
  
  // Security configuration
  requireAuth: true,
  requiredRoles: [...VALID_COGNITO_ROLES] as UserRole[],
  includeSecurityContext: true
});