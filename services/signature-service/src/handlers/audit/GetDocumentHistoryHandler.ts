/**
 * @fileoverview GetDocumentHistoryHandler - Handler for document history
 * @summary Handles document history retrieval for audit trail
 * @description This handler retrieves the complete audit trail for a document
 * including all events, signer actions, and status changes.
 * 
 * ## Security Features:
 * - JWT authentication and role-based access control
 * - Envelope ownership validation
 * - Audit trail access permissions
 * - IP address and user agent tracking
 * 
 * ## Business Rules:
 * - Only envelope owners can view complete history
 * - Signers can view their own actions only
 * - All access attempts are logged for compliance
 * - Events are returned in chronological order
 */

import { ControllerFactory, UserRole, VALID_COGNITO_ROLES } from '@lawprotect/shared-ts';
import { EnvelopeService } from '../../services/EnvelopeService';
import { AuditService } from '../../services/AuditService';
import { ServiceFactory } from '../../infrastructure/factories/ServiceFactory';
import { EnvelopeId } from '../../domain/value-objects/EnvelopeId';
import { DocumentHistoryPathSchema, DocumentHistoryQuerySchema } from '../../domain/schemas/AuditSchema';

/**
 * GetDocumentHistoryHandler - Production-ready handler using ControllerFactory
 * 
 * This handler retrieves the complete audit trail for a document including
 * all events, signer actions, and status changes. It uses ControllerFactory
 * with a comprehensive middleware pipeline.
 * 
 * @middleware
 * - JWT authentication: Validates user identity and token validity
 * - Role validation: Ensures user has appropriate role permissions
 * - Request validation: Validates envelope ID format and query parameters
 * - Service orchestration: Coordinates between domain services
 * - Response formatting: Transforms domain entities to API response format
 * 
 * @flow
 * 1. Access Validation - Validates user has access to the envelope
 * 2. Audit Retrieval - Retrieves audit trail for the envelope
 * 3. Envelope Metadata - Gets envelope status and metadata
 * 4. Response Formatting - Formats events for frontend display
 * 5. Response Delivery - Returns chronological timeline with metadata
 * 
 * @responsibilities
 * - Access Control: Validates user permissions for envelope history access
 * - Audit Trail: Retrieves complete audit trail for compliance
 * - Data Formatting: Transforms audit events for frontend consumption
 * - Metadata: Includes envelope status and document information
 * - Pagination: Supports cursor-based pagination for large audit trails
 * 
 * @exclusions
 * - Document Signing: Handled by SignDocumentHandler
 * - Document Storage: Managed by Document Service
 * - Email Notifications: Handled by Notification Service
 * - Document Processing: Handled by Document Service
 */
export const getDocumentHistoryHandler = ControllerFactory.createCommand({
  pathSchema: DocumentHistoryPathSchema,
  querySchema: DocumentHistoryQuerySchema,
  extractParams: (path: any, _body: any, query: any, context: any) => ({
    envelopeId: path.envelopeId,
    limit: query?.limit ? parseInt(query.limit) : 25,
    cursor: query?.cursor,
    securityContext: context.securityContext,
    userId: context.auth.userId
  }),
  
  // Service configuration - use domain services directly
  appServiceClass: class {
    constructor() {
      this.envelopeService = ServiceFactory.createEnvelopeService();
      this.auditService = ServiceFactory.createAuditService();
    }
    
    private envelopeService: EnvelopeService;
    private auditService: AuditService;
    
    async execute(params: { envelopeId: string; limit: number; cursor?: string; userId: string; securityContext: any }) {
      const { envelopeId, limit, cursor, userId, securityContext } = params;

      // Get envelope and validate access
      const envelope = await this.envelopeService.getEnvelope(
        new EnvelopeId(envelopeId),
        userId,
        securityContext
      );

      // Get audit trail for the envelope
      const auditTrail = await this.auditService.getAuditTrail(envelopeId, limit, cursor);

      // Format events for frontend display
      const formattedEvents = auditTrail.items.map(event => ({
        id: event.id,
        type: event.type,
        timestamp: event.timestamp.toISOString(),
        userId: event.userId,
        description: event.description || 'No description available',
        metadata: event.metadata,
        entityId: event.envelopeId,
        entityType: 'envelope'
      }));

      return {
        envelopeId: envelopeId,
        history: {
          events: formattedEvents,
          totalEvents: auditTrail.items.length,
          hasMore: auditTrail.hasNext,
          nextCursor: auditTrail.nextCursor,
          envelopeStatus: envelope.getStatus(),
          envelopeTitle: envelope.getMetadata().title || 'Document',
          documentId: envelopeId,
          createdAt: envelope.getCreatedAt().toISOString(),
          updatedAt: envelope.getUpdatedAt().toISOString(),
          expiresAt: envelope.getMetadata().expiresAt?.toISOString()
        }
      };
    }
  },
  
  // Response configuration
  responseType: 'ok',
  requireAuth: true,
  requiredRoles: [...VALID_COGNITO_ROLES] as UserRole[],
  includeSecurityContext: true
});