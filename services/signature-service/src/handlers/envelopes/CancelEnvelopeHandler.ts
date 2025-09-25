/**
 * @fileoverview CancelEnvelopeHandler - Handler for envelope cancellation operations
 * @summary Handles envelope cancellation with proper validation and status updates
 * @description This handler processes envelope cancellation requests including
 * validation of user permissions, envelope state, and proper status updates.
 * Only authenticated users (app users) can cancel envelopes they created.
 */

import { ControllerFactory, UuidV4 } from '@lawprotect/shared-ts';
import { ServiceFactory } from '../../infrastructure/factories/ServiceFactory';
import { CancelEnvelopeRequestSchema, CancelEnvelopeResponse } from '../../domain/schemas/CancelEnvelopeSchema';
import { EnvelopeId } from '../../domain/value-objects/EnvelopeId';
import { z } from 'zod';

/**
 * CancelEnvelopeHandler - Production-ready handler using ControllerFactory
 *
 * @description This handler processes envelope cancellation with comprehensive validation and orchestration.
 * It supports only authenticated users (app users) who created the envelope.
 * Uses SignatureOrchestrator to handle the complete cancellation workflow.
 *
 * @middleware
 * - JWT Authentication: Validates user identity and token validity (required)
 * - Request validation: Validates request body using CancelEnvelopeRequestSchema
 * - Service orchestration: Coordinates cancellation workflow using SignatureOrchestrator
 * - Response formatting: Transforms domain entities to API response format
 *
 * @flow
 * 1. Validation - Validates request body and access
 * 2. Access Control - Validates user is the envelope creator
 * 3. Envelope Cancellation - Orchestrates complete cancellation workflow
 * 4. Notification - Publishes cancellation notification event
 * 5. Response Assembly - Returns cancellation result with updated envelope
 */
export const cancelEnvelopeHandler = ControllerFactory.createCommand({
  // Validation schemas
  pathSchema: z.object({ id: UuidV4 }), // Only envelopeId in path
  bodySchema: CancelEnvelopeRequestSchema, // Empty body
  
  // Authentication required
  requireAuth: true,
  
  // Service configuration - use new DDD architecture
  appServiceClass: class {
    private readonly signatureOrchestrator: any;

    constructor() {
      this.signatureOrchestrator = ServiceFactory.createSignatureOrchestrator();
    }

    /**
     * Executes the envelope cancellation orchestration
     * 
     * @param params - Extracted parameters from request
     * @returns Promise resolving to cancellation result
     */
    async execute(params: {
      envelopeId: EnvelopeId;
      userId: string;
      securityContext: any;
    }) {
      try {
        return await this.signatureOrchestrator.cancelEnvelope(
          params.envelopeId,
          params.userId,
          params.securityContext
        );
      } catch (error) {
        // Re-throw the error to be handled by the error middleware
        throw error;
      }
    }
  },
  
  // Parameter extraction - transforms HTTP request to domain parameters
  extractParams: (path: any, _body: any, _query: any, context: any) => ({
    envelopeId: EnvelopeId.fromString(path.id),
    userId: context.auth.userId, // Only authenticated app users
    securityContext: {
      ipAddress: context.auth.ipAddress,
      userAgent: context.auth.userAgent,
      country: context.auth.country
    }
  }),
  
  // Response configuration
  responseType: 'ok',
  transformResult: async (result: any): Promise<CancelEnvelopeResponse> => {
    return {
      success: true,
      message: 'Envelope cancelled successfully',
      envelope: {
        id: result.envelope.getId().getValue(),
        status: result.envelope.getStatus().getValue(),
        title: result.envelope.getTitle(),
        cancelledAt: result.envelope.getUpdatedAt().toISOString()
      }
    };
  }
});
