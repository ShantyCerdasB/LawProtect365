/**
 * @fileoverview DeclineSignerHandler - Handler for signer decline operations
 * @summary Handles signer decline requests with proper validation and status updates
 * @description This handler processes requests from signers to decline signing,
 * including validation, status updates, and notification dispatch.
 */

import { ControllerFactory } from '@lawprotect/shared-ts';
import { ServiceFactory } from '../../infrastructure/factories/ServiceFactory';
import { DeclineSignerRequestSchema } from '../../domain/schemas/SigningHandlersSchema';
import { EnvelopeIdSchema } from '../../domain/schemas/EnvelopeSchema';
import { SignerIdSchema } from '../../domain/schemas/SignerSchema';
import { EnvelopeId } from '../../domain/value-objects/EnvelopeId';
import { SignerId } from '../../domain/value-objects/SignerId';
import { z } from 'zod';

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
    id: EnvelopeIdSchema,
    signerId: SignerIdSchema
  }),
  bodySchema: DeclineSignerRequestSchema,
  
  // Service configuration - use new DDD architecture
  appServiceClass: class {
    private signatureOrchestrator = ServiceFactory.createSignatureOrchestrator();
    
    async execute(params: any) {
      try {
        return await this.signatureOrchestrator.declineSigner(
          params.envelopeId,
          params.signerId,
          params.request,
          params.securityContext
        );
      } catch (error) {
        throw error;
      }
    }
  },
  
  // Parameter extraction
  extractParams: (path: any, body: any, _query: any, context: any) => ({
    envelopeId: EnvelopeId.fromString(path.id),
    signerId: SignerId.fromString(path.signerId),
    request: body,
    securityContext: context.securityContext
  }),
  
  // Middleware configuration
  includeSecurityContext: true,
  requireAuth: true, // Allow external users via invitation token
  requiredRoles: undefined // Will be determined by invitation token or JWT
});