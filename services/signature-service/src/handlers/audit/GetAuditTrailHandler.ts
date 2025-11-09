/**
 * @fileoverview GetAuditTrailHandler - Handler for retrieving envelope audit trail
 * @summary Handles audit trail retrieval with complete event history
 * @description This handler processes requests to retrieve complete audit trail
 * for an envelope, including all events in chronological order for frontend display.
 */

import { ControllerFactory, VALID_COGNITO_ROLES, ResponseType } from '@lawprotect/shared-ts';
import { CompositionRoot } from '../../infrastructure/factories';
import { GetAuditTrailQuerySchema, EnvelopeIdSchema } from '../../domain/schemas/EnvelopeSchema';
import { EnvelopeId } from '../../domain/value-objects/EnvelopeId';

/**
 * GetAuditTrailHandler - Production-ready handler using ControllerFactory
 *
 * @description This handler retrieves complete audit trail for an envelope.
 * It supports only authenticated users (owners) and returns all events
 * in chronological order for frontend display.
 *
 * @middleware
 * - JWT Authentication: Validates user identity and token validity
 * - Role validation: Ensures user has appropriate role permissions
 * - Request validation: Validates request parameters using GetAuditTrailQuerySchema
 * - Service orchestration: Coordinates between domain services using SignatureOrchestrator
 * - Response formatting: Transforms domain entities to API response format
 *
 * @flow
 * 1. Validation - Validates request parameters and access
 * 2. Access Control - Validates user access (owner only)
 * 3. Audit Trail Retrieval - Gets all audit events for the envelope
 * 4. Response Assembly - Returns complete audit trail with events
 *
 * @responsibilities
 * - Audit Trail Retrieval: Gets all audit events for an envelope
 * - Access Control: Validates owner access only
 * - Response Formatting: Transforms domain entities to API response format
 *
 * @exclusions
 * - Email Notifications: Handled by NotificationService
 * - Document Storage: Handled by Document Service
 * - Document Processing: Handled by Document Service
 * - Permission Validation: Handled by middleware pipeline
 */
export const getAuditTrailHandler = ControllerFactory.createQuery({
  // Validation schemas
  pathSchema: EnvelopeIdSchema,
  querySchema: GetAuditTrailQuerySchema,
  
  // Service configuration
  appServiceClass: class {
    private signatureOrchestrator: any | undefined;
    
    /**
     * Executes the audit trail retrieval orchestration
     * @param params - Extracted parameters from request
     * @returns Promise resolving to audit trail data
     */
    async execute(params: { envelopeId: EnvelopeId; userId: string }) {
      const orchestrator = this.signatureOrchestrator ?? await CompositionRoot.createSignatureOrchestratorAsync();
      this.signatureOrchestrator = orchestrator;
      return await orchestrator.getAuditTrail(
        params.envelopeId,
        params.userId
      );
    }
  },
  
  // Parameter extraction
  extractParams: (path: { id: string }, _body: any, _query: any, context: { auth: { userId: string } }) => ({
    envelopeId: EnvelopeId.fromString(path.id),
    userId: context.auth.userId
  }),
  
  // Response configuration
  responseType: ResponseType.OK,
  transformResult: async (result: { envelopeId: string; events: Array<{
    id: string;
    eventType: string;
    description: string;
    userEmail?: string;
    userName?: string;
    createdAt: Date;
    metadata?: any;
  }> }) => {
    return {
      envelopeId: result.envelopeId,
      events: result.events.map((event) => ({
        id: event.id,
        eventType: event.eventType,
        description: event.description,
        userEmail: event.userEmail,
        userName: event.userName,
        createdAt: event.createdAt.toISOString(),
        metadata: event.metadata
      }))
    };
  },
  requireAuth: true,
  requiredRoles: [...VALID_COGNITO_ROLES],
  includeSecurityContext: true,
});
