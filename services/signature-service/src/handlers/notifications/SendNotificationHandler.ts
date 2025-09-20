/**
 * @fileoverview SendNotificationHandler - Handler for sending notifications
 * @summary Handles reminder and invitation resend notifications
 * @description This handler sends reminders to signers who haven't signed yet
 * or resends invitations to specific signers who may not have received them.
 */

import { ControllerFactory, UserRole, VALID_COGNITO_ROLES, BadRequestError } from '@lawprotect/shared-ts';
import { EnvelopeService } from '../../services/EnvelopeService';
import { SignerService } from '../../services/SignerService';
import { InvitationTokenService } from '../../services/InvitationTokenService';
import { ServiceFactory } from '../../infrastructure/factories/ServiceFactory';
import { SendNotificationRequestSchema, SendNotificationPathSchema } from '../../domain/schemas/SendNotificationSchema';
import { EnvelopeId } from '../../domain/value-objects/EnvelopeId';

/**
 * SendNotificationHandler - Production-ready handler using ControllerFactory
 * 
 * This handler sends reminders to signers who haven't signed yet or resends
 * invitations to specific signers. It uses ControllerFactory with a comprehensive
 * middleware pipeline.
 * 
 * @middleware
 * - JWT authentication: Validates user identity and token validity
 * - Role validation: Ensures user has appropriate role permissions
 * - Request validation: Validates request body and parameters
 * - Service orchestration: Coordinates between domain services
 * - Response formatting: Transforms domain entities to API response format
 * 
 * @flow
 * 1. Request Validation - Validates notification type and parameters
 * 2. Envelope Access - Validates user has access to the envelope
 * 3. Status Validation - Ensures envelope is sent (notifications only for sent envelopes)
 * 4. Signer Retrieval - Gets signers to notify based on type
 * 5. Notification Sending - Sends reminders or resends invitations
 * 6. Response Assembly - Returns notification confirmation with details
 * 
 * @responsibilities
 * - Reminder Notifications: Sends reminders to pending signers
 * - Invitation Resend: Resends invitations to specific signers
 * - Access Control: Validates user permissions for notification sending
 * - Status Validation: Ensures envelope is in correct state for notifications
 * - Audit Logging: Logs all notification activities for compliance
 * 
 * @exclusions
 * - Email Delivery: Handled by Notification Service
 * - Template Management: Handled by Notification Service
 * - Rate Limiting: Handled by middleware
 * - User Management: Handled by User Service
 * - Document Processing: Handled by Document Service
 */
export const sendNotificationHandler = ControllerFactory.createCommand({
  // Validation schemas
  pathSchema: SendNotificationPathSchema,
  bodySchema: SendNotificationRequestSchema,
  
  // Parameter extraction
  extractParams: (_path: any, body: any, _query: any, context: any) => ({
    requestBody: body,
    envelopeId: _path.envelopeId,
    userId: context.auth.userId,
    securityContext: context.securityContext
  }),
  
  // Service configuration - use domain services directly
  appServiceClass: class {
    constructor() {
      this.envelopeService = ServiceFactory.createEnvelopeService();
      this.signerService = ServiceFactory.createSignerService();
      this.invitationTokenService = ServiceFactory.createInvitationTokenService();
    }
    
    private readonly envelopeService: EnvelopeService;
    private readonly signerService: SignerService;
    private readonly invitationTokenService: InvitationTokenService;
    
    async execute(params: { requestBody: any; envelopeId: string; userId: string; securityContext: any }) {
      try {
        const { requestBody, envelopeId, userId, securityContext } = params;

        // Get envelope and validate access
        const envelope = await this.envelopeService.getEnvelope(
          new EnvelopeId(envelopeId),
          userId,
          securityContext
        );

        // Validate envelope status: allow reminders for SENT or IN_PROGRESS
        const status = envelope.getStatus();
        if (status !== 'SENT' && status !== 'IN_PROGRESS') {
          throw new BadRequestError(
            'Notifications can only be sent for envelopes that are in SENT or IN_PROGRESS status',
            'ENVELOPE_NOT_READY_FOR_NOTIFICATIONS'
          );
        }

        // Send notifications based on type using existing services
        if (requestBody.type === 'resend') {
          // Use existing InvitationTokenService to resend invitations
          await this.invitationTokenService.publishSignerInvitedEvents(
            new EnvelopeId(envelopeId),
            userId
          );
        } else if (requestBody.type === 'reminder') {
          // Delegate to SignerService to send reminders and publish events
          try {
            await this.signerService.sendReminders(
              new EnvelopeId(envelopeId),
              requestBody.signerIds,
              securityContext
            );
            } catch (e: any) {
            // eslint-disable-next-line no-console
            console.error('[SendNotificationHandler] sendReminders ERROR', { name: e?.name, code: e?.code, message: e?.message });
            throw e;
          }
        }

        return {
          message: 'Notifications sent successfully',
          notifications: {
            type: requestBody.type,
            sent: requestBody.type === 'resend' ? 'all' : 'pending',
            envelopeId: envelopeId,
            timestamp: new Date().toISOString()
          }
        };
      } catch (e: any) {
        // eslint-disable-next-line no-console
        console.error('[SendNotificationHandler] ERROR', { name: e?.name, code: e?.code, message: e?.message });
        throw e;
      }
    }
  },
  
  // Response configuration
  responseType: 'ok',
  
  // Security configuration
  requireAuth: true,
  requiredRoles: [...VALID_COGNITO_ROLES] as UserRole[],
  includeSecurityContext: true
});