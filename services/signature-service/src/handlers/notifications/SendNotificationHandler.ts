/**
 * @fileoverview SendNotificationHandler - Handler for sending notifications to signers
 * @summary Handles reminder notifications and invitation resends to signers
 * @description This handler processes requests to send notifications to signers,
 * including reminders and invitation resends with proper validation and authorization.
 */

import { ControllerFactory, VALID_COGNITO_ROLES, NotificationType } from '@lawprotect/shared-ts';
import { ServiceFactory } from '../../infrastructure/factories/ServiceFactory';
import { SendNotificationPathSchema, SendNotificationRequestSchema } from '../../domain/schemas/SendNotificationSchema';
import { EnvelopeId } from '../../domain/value-objects/EnvelopeId';

/**
 * Handler for sending notifications to signers
 * 
 * Supports sending reminders and resending invitations to signers.
 * Only the envelope owner can send notifications.
 */
export const sendNotificationHandler = ControllerFactory.createCommand({
  pathSchema: SendNotificationPathSchema,
  bodySchema: SendNotificationRequestSchema,

  appServiceClass: class {
    private readonly signatureOrchestrator: any;

    constructor() {
      this.signatureOrchestrator = ServiceFactory.createSignatureOrchestrator();
    }

    async execute(params: any) {
      try {
        const { envelopeId, request, userId, securityContext } = params;

        // Validate notification type
        if (request.type === NotificationType.REMINDER) {
          return await this.signatureOrchestrator.sendReminders(
            envelopeId,
            request,
            userId,
            securityContext
          );
        } 
      } catch (error) {
        // Re-throw the error to be handled by the error middleware
        throw error;
      }
    }
  },

  extractParams: (path: any, body: any, _query: any, context: any) => ({
    envelopeId: EnvelopeId.fromString(path.envelopeId),
    request: body,
    userId: context.auth.userId,
    securityContext: {
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      country: context.country
    }
  }),

  responseType: 'ok',
  transformResult: async (result: any) => {
    return {
      success: result.success,
      message: result.message,
      envelopeId: result.envelopeId,
      remindersSent: result.remindersSent,
      signersNotified: result.signersNotified.map((signer: any) => ({
        id: signer.id,
        email: signer.email,
        name: signer.name,
        reminderCount: signer.reminderCount,
        lastReminderAt: signer.lastReminderAt.toISOString()
      })),
      skippedSigners: result.skippedSigners
    };
  },
  requireAuth: true,
  requiredRoles: [...VALID_COGNITO_ROLES],
  includeSecurityContext: true,
});