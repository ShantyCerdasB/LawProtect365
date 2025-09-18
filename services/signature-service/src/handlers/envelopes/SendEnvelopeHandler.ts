/**
 * @fileoverview SendEnvelopeHandler - Handler for sending envelopes to signers
 * @summary Handles envelope sending and triggers email notifications via events
 * @description This handler changes envelope status from DRAFT to SENT and publishes
 * signer.invited events to trigger email notifications via NotificationService.
 */

import { ControllerFactory, UserRole, VALID_COGNITO_ROLES } from '@lawprotect/shared-ts';
import { EnvelopeService } from '../../services/EnvelopeService';
import { InvitationTokenService } from '../../services/InvitationTokenService';
import { ServiceFactory } from '../../infrastructure/factories/ServiceFactory';
import { EnvelopeId } from '../../domain/value-objects/EnvelopeId';
import { EnvelopeStatus } from '../../domain/enums';
import { SendEnvelopePathSchema } from '../../domain/schemas/SendEnvelopeSchema';

/**
 * SendEnvelopeHandler - Production-ready handler using ControllerFactory
 * 
 * @description This handler orchestrates envelope sending by changing status and publishing events.
 * It transitions envelopes from DRAFT to SENT status and triggers email notifications through
 * event publishing to the NotificationService.
 *
 * @middleware
 * - JWT Authentication: Validates user identity and token validity
 * - Role validation: Ensures user has appropriate role permissions
 * - Signature permission validation: Validates MANAGE permissions for envelope sending
 * - Request validation: Validates envelope ID format and parameters
 * - Service orchestration: Coordinates between domain services
 * - Response formatting: Transforms domain entities to API response format
 *
 * @flow
 * 1. Status Validation - Validates envelope exists and is in DRAFT status
 * 2. Status Transition - Changes envelope status from DRAFT to SENT
 * 3. Event Publishing - Publishes signer.invited events (triggers email notifications)
 * 4. Audit Logging - Generates audit events for envelope sending
 * 5. Response Delivery - Returns updated envelope status and metadata
 *
 * @responsibilities
 * - Status Management: Changes envelope status from DRAFT to SENT
 * - Event Publishing: Publishes signer.invited events for email notifications
 * - Audit Trail: Generates audit events for envelope sending
 * - Timestamp Updates: Updates envelope sent timestamp
 * - Business Validation: Validates envelope is ready to be sent
 * - Response Formatting: Transforms domain entities to API response format
 *
 * @exclusions
 * - Email Sending: Handled by NotificationService via event consumption
 * - Token Creation: Handled by CreateEnvelopeHandler
 * - Signer Responses: Handled by SignDocumentHandler
 * - Document Processing: Handled by Document Service
 * - Permission Validation: Handled by middleware pipeline
 *
 * @signingOrder
 * - OWNER_FIRST: Owner signs first (order 1), then all invited signers (no specific order)
 * - INVITEES_FIRST: All invited signers sign first (no specific order), then owner signs last
 * - Email notifications are sent to all signers regardless of signing order
 */
export const sendEnvelopeHandler = ControllerFactory.createCommand({
  // Validation schemas
  pathSchema: SendEnvelopePathSchema,
  
  // Service configuration - use domain services directly
  appServiceClass: class {
    private readonly envelopeService: EnvelopeService;
    private readonly invitationTokenService: InvitationTokenService;

    constructor() {
      // Create domain services with proper dependencies using ServiceFactory
      this.envelopeService = ServiceFactory.createEnvelopeService();
      this.invitationTokenService = ServiceFactory.createInvitationTokenService();
    }

    /**
     * Executes the envelope sending orchestration
     * 
     * @param params - Extracted parameters from request
     * @returns Promise resolving to updated envelope
     */
    async execute(params: any) {
      const envelopeId = new EnvelopeId(params.envelopeId);

      // 1. Send envelope (changes status DRAFT → SENT and publishes envelope.sent event)
      let envelope;
      try {
        envelope = await this.envelopeService.changeEnvelopeStatus(
          envelopeId,
          EnvelopeStatus.SENT,
          params.userId,
          params.securityContext
        );
      } catch (e: any) {
        // eslint-disable-next-line no-console
        console.error('[SendEnvelopeHandler] changeEnvelopeStatus error', { name: e?.name, code: e?.code, message: e?.message });
        throw e;
      }

      // 2. Publish signer.invited events (triggers email notifications via NotificationService)
      try {
        await this.invitationTokenService.publishSignerInvitedEvents(
          envelopeId,
          params.userId
        );
      } catch (e: any) {
        // eslint-disable-next-line no-console
        console.error('[SendEnvelopeHandler] publishSignerInvitedEvents error', { name: e?.name, code: e?.code, message: e?.message });
        // Do not fail the primary flow if notifications fail; outbox/worker will retry
      }

      return {
        envelope
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
      message: 'Envelope sent successfully',
      envelope: {
        id: result.envelope.getId().getValue(),
        status: result.envelope.getStatus(),
        sentAt: result.envelope.getStatus() === 'SENT' ? result.envelope.getUpdatedAt() : undefined,
        title: result.envelope.getMetadata().title
      }
    };
  },
  
  // Security configuration
  requireAuth: true,
  requiredRoles: [...VALID_COGNITO_ROLES] as UserRole[],
  includeSecurityContext: true
});