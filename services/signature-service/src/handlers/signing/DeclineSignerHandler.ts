/**
 * @fileoverview DeclineSignerHandler - Handler for signer decline operations
 * @summary Handles signer decline requests with proper validation and status updates
 * @description This handler processes requests from signers to decline signing,
 * including validation, status updates, and notification dispatch.
 */

import { ControllerFactory, UuidV4 } from '@lawprotect/shared-ts';
import { ServiceFactory } from '../../infrastructure/factories/services/ServiceFactory';
import { DeclineSignerRequestSchema, DeclineSignerResponse } from '../../domain/schemas/SigningHandlersSchema';
import { z } from 'zod';
import { EnvelopeId } from '../../domain/value-objects/EnvelopeId';
import { SignerId } from '../../domain/value-objects/SignerId';

/**
 * DeclineSignerHandler - Production-ready handler using ControllerFactory
 *
 * @description This handler processes signer decline with comprehensive validation and orchestration.
 * It supports both authenticated users (owners) and external users (via invitation tokens).
 * Uses SignatureOrchestrator to handle the complete decline workflow.
 *
 * @middleware
 * - Optional JWT Authentication: Allows access without auth for external users
 * - Request validation: Validates request body using DeclineSignerRequestSchema
 * - Service orchestration: Coordinates decline workflow using SignatureOrchestrator
 * - Response formatting: Transforms domain entities to API response format
 *
 * @flow
 * 1. Validation - Validates request body and access
 * 2. Access Control - Validates user access (owner or external via token)
 * 3. Signer Decline - Orchestrates complete decline workflow
 * 4. Notification - Publishes decline notification event
 * 5. Response Assembly - Returns decline result with updated envelope
 */
export const declineSignerHandler = ControllerFactory.createCommand({
  // Validation schemas
  pathSchema: z.object({
    id: UuidV4,
    signerId: UuidV4
  }),
  bodySchema: DeclineSignerRequestSchema,
  
  // Service configuration - use new DDD architecture
  appServiceClass: class {
    private readonly signatureOrchestrator: any;
    
    constructor() {
      this.signatureOrchestrator = ServiceFactory.createSignatureOrchestrator();
    }
    
    /**
     * Executes the signer decline orchestration
     * 
     * @param params - Extracted parameters from request
     * @returns Promise resolving to decline result
     */
    async execute(params: {
      envelopeId: EnvelopeId;
      signerId: SignerId;
      request: any;
      securityContext: any;
    }) {
      try {
        return await this.signatureOrchestrator.declineSigner(
          params.envelopeId,
          params.signerId,
          params.request,
          params.securityContext
        );
      } catch (error) {
        // Re-throw the error to be handled by the error middleware
        throw error;
      }
    }
  },
  
  // Parameter extraction
  extractParams: (path: any, body: any, _query: any, context: any) => ({
    envelopeId: EnvelopeId.fromString(path.id),
    signerId: SignerId.fromString(path.signerId),
    request: body,
    securityContext: {
      ipAddress: context.auth?.ipAddress || context.securityContext?.ipAddress,
      userAgent: context.auth?.userAgent || context.securityContext?.userAgent,
      country: context.auth?.country || context.securityContext?.country
    }
  }),
  
  // Response configuration
  responseType: 'ok',
  transformResult: async (result: any): Promise<DeclineSignerResponse> => {
    return {
      message: result.message,
      decline: {
        signerId: result.declineInfo.signerId,
        envelopeId: result.envelope.id,
        reason: result.declineInfo.reason,
        declinedAt: result.declineInfo.declinedAt,
        envelopeStatus: result.envelope.status
      }
    };
  },
  
  // Middleware configuration
  includeSecurityContext: true,
  requireAuth: true, // Allow external users via invitation token
  requiredRoles: undefined // Will be determined by invitation token or JWT
});