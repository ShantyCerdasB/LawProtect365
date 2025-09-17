/**
 * @fileoverview DeleteEnvelopeHandler - Handler for deleting envelopes
 * @summary Handles envelope deletion with proper cleanup
 * @description This handler deletes envelopes that are in DRAFT status,
 * including cleanup of related signers and audit events.
 */

import { ControllerFactory, UserRole, VALID_COGNITO_ROLES } from '@lawprotect/shared-ts';
import { EnvelopeService } from '../../services/EnvelopeService';
import { ServiceFactory } from '../../infrastructure/factories/ServiceFactory';
import { EnvelopeId } from '../../domain/value-objects/EnvelopeId';
import { DeleteEnvelopePathSchema } from '../../domain/schemas/DeleteEnvelopeSchema';

/**
 * DeleteEnvelopeHandler - Production-ready handler using ControllerFactory
 * 
 * @description This handler deletes envelopes that are in DRAFT status with proper cleanup.
 * It ensures that only draft envelopes can be deleted and performs comprehensive cleanup
 * of related entities including signers and invitation tokens.
 *
 * @middleware
 * - JWT Authentication: Validates user identity and token validity
 * - Role validation: Ensures user has appropriate role permissions
 * - Signature permission validation: Validates MANAGE permissions for envelope deletion
 * - Request validation: Validates envelope ID format and parameters
 * - Service orchestration: Coordinates between domain services
 * - Response formatting: Transforms domain entities to API response format
 *
 * @flow
 * 1. Status Validation - Validates envelope exists and is in DRAFT status
 * 2. Permission Validation - Validates user has permission to delete envelope
 * 3. Entity Cleanup - Deletes related signers and invitation tokens
 * 4. Envelope Deletion - Deletes envelope from database
 * 5. Audit Logging - Generates audit events for deletion
 * 6. Response Delivery - Returns success confirmation
 *
 * @responsibilities
 * - Status Validation: Ensures envelope is in DRAFT status (only draft envelopes can be deleted)
 * - Entity Cleanup: Deletes related signers and invitation tokens
 * - Envelope Deletion: Removes envelope from database
 * - Audit Trail: Generates audit events for deletion tracking
 * - Permission Validation: Validates user has permission to delete
 * - Response Formatting: Transforms domain entities to API response format
 *
 * @exclusions
 * - Sent/Completed Envelopes: Business rule prevents deletion of sent or completed envelopes
 * - Document Deletion: Handled by Document Service
 * - Email Notifications: Not needed for deletion operations
 * - Permission Validation: Handled by middleware pipeline
 * - Business Rule Validation: Handled by EnvelopeService
 *
 * @businessRules
 * - Only DRAFT envelopes can be deleted
 * - SENT, COMPLETED, or CANCELLED envelopes cannot be deleted
 * - All related entities (signers, tokens) are automatically cleaned up
 * - Deletion is permanent and cannot be undone
 */
export const deleteEnvelopeHandler = ControllerFactory.createCommand({
  // Validation schemas
  pathSchema: DeleteEnvelopePathSchema,
  
  // Service configuration - use domain services directly
  appServiceClass: class {
    private readonly envelopeService: EnvelopeService;

    constructor() {
      // Create domain services with proper dependencies using ServiceFactory
      this.envelopeService = ServiceFactory.createEnvelopeService();
    }

    /**
     * Executes the envelope deletion orchestration
     * 
     * @param params - Extracted parameters from request
     * @returns Promise resolving to deletion confirmation
     */
    async execute(params: any) {
      const envelopeId = new EnvelopeId(params.envelopeId);

      // 1. Delete envelope (includes validation and cleanup)
      await this.envelopeService.deleteEnvelope(
        envelopeId,
        params.userId,
        params.securityContext
      );

      return {
        deletedAt: new Date()
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
    // Transform domain entities to API response format
    return {
      message: 'Envelope deleted successfully',
      deletedAt: result.deletedAt.toISOString()
    };
  },
  
  // Security configuration
  requireAuth: true,
  requiredRoles: [...VALID_COGNITO_ROLES] as UserRole[],
  includeSecurityContext: true
});