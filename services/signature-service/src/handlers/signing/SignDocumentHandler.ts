/**
 * @fileoverview SignDocumentHandler - Handler for document signing
 * @summary Handles document signing with consent and signature creation
 * @description This handler processes document signing including consent validation,
 * signature creation, and status updates for both envelope and signer. It supports
 * both authenticated users (with JWT tokens) and external users (with invitation tokens).
 */

import { ControllerFactory } from '@lawprotect/shared-ts';
import { ServiceFactory } from '../../infrastructure/factories/ServiceFactory';
import { SignDocumentRequestSchema } from '../../domain/schemas/SigningHandlersSchema';

/**
 * SignDocumentHandler - Production-ready handler using ControllerFactory
 *
 * @description This handler processes document signing with comprehensive validation and orchestration.
 * It supports both authenticated users (owners) and external users (via invitation tokens).
 * Uses SignatureOrchestrator to handle the complete signing workflow.
 *
 * @middleware
 * - Optional JWT Authentication: Allows access without auth for external users
 * - Request validation: Validates request body using SignDocumentRequestSchema
 * - Service orchestration: Coordinates signing workflow using SignatureOrchestrator
 * - Response formatting: Transforms domain entities to API response format
 *
 * @flow
 * 1. Validation - Validates request body and access
 * 2. Access Control - Validates user access (owner or external via token)
 * 3. Document Signing - Orchestrates complete signing workflow
 * 4. Audit Tracking - Creates comprehensive audit events
 * 5. Response Assembly - Returns signing result with updated envelope
 *
 * @responsibilities
 * - Document Signing: Orchestrates complete signing workflow
 * - Access Control: Validates owner access or external user access via invitation token
 * - Audit Tracking: Creates comprehensive audit events for signing
 * - Response Formatting: Transforms domain entities to API response format
 *
 * @exclusions
 * - Document Processing: Handled by Document Service
 * - Email Notifications: Handled by NotificationService
 * - Permission Validation: Handled by middleware pipeline
 */
export const signDocumentHandler = ControllerFactory.createCommand({
  // Validation schemas
  bodySchema: SignDocumentRequestSchema,
  
  // Service configuration - use new DDD architecture
  appServiceClass: class {
    private readonly signatureOrchestrator: any;
    
    constructor() {
      this.signatureOrchestrator = ServiceFactory.createSignatureOrchestrator();
    }
    
    /**
     * Executes the document signing orchestration
     * 
     * @param params - Extracted parameters from request
     * @returns Promise resolving to signing result
     */
    async execute(params: any) {
      try {
        return await this.signatureOrchestrator.signDocument(
          params.request,
          params.userId,
          params.securityContext
        );
      } catch (error) {
        throw error;
      }
    }
  },
  
  // Parameter extraction - transforms HTTP request to domain parameters
  extractParams: (_path: any, body: any, _query: any, context: any) => ({
    request: body,
    userId: context.auth?.userId === 'external-user' ? undefined : context.auth?.userId, // ✅ Distinguir entre usuarios reales y external users
    securityContext: context.securityContext // ✅ Usar securityContext del middleware
  }),
  
  // Response configuration
  responseType: 'ok',
  transformResult: async (result: any) => {

      const response = {
        message: result.message,
        signature: {
          id: result.signature.id,
          signerId: result.signature.signerId,
          envelopeId: result.signature.envelopeId,
          signedAt: result.signature.signedAt,
          algorithm: result.signature.algorithm,
          hash: result.signature.hash
        },
        envelope: {
          id: result.envelope.id,
          status: result.envelope.status,
          progress: result.envelope.progress
        }
      };
      
      return response;

  },
  
  // Security configuration
  requireAuth: true, // ✅ Permite tanto usuarios autenticados como external users con invitation tokens
  requiredRoles: undefined, // No requiere roles específicos
  includeSecurityContext: true
});