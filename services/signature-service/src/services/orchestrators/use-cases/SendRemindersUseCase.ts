/**
 * @fileoverview SendRemindersUseCase - Use case for sending reminder notifications to pending signers
 * @summary Handles reminder notifications with rate limiting and audit tracking
 * @description This use case manages the sending of reminder notifications to pending signers,
 * including access validation, signer filtering, reminder rate limiting, token management,
 * notification dispatch, and comprehensive audit tracking. It ensures proper workflow
 * orchestration and maintains compliance with reminder policies for envelope management.
 */

import { EnvelopeSigner } from '@/domain/entities/EnvelopeSigner';
import { EnvelopeCrudService } from '@/services/envelopeCrud/EnvelopeCrudService';
import { EnvelopeSignerService } from '@/services/EnvelopeSignerService';
import { InvitationTokenService } from '@/services/InvitationTokenService';
import { SignerReminderTrackingService } from '@/services/SignerReminderTrackingService';
import { AuditEventService } from '@/services/audit/AuditEventService';
import { EnvelopeNotificationService } from '@/services/notification/EnvelopeNotificationService';
import { EnvelopeAccessValidationRule } from '@/domain/rules/EnvelopeAccessValidationRule';
import { createNetworkSecurityContext, rethrow } from '@lawprotect/shared-ts';
import { loadConfig } from '@/config/AppConfig';
import { envelopeNotFound } from '@/signature-errors';
import { filterSignersByIds } from '@/services/orchestrators/utils/signerSelection';
import { SendRemindersInput, SendRemindersResult } from '@/domain/types/usecase/orchestrator/SendRemindersUseCase';

/**
 * Sends reminder notifications to pending signers while enforcing limits and auditing.
 */
export class SendRemindersUseCase {
  constructor(
    private readonly envelopeCrudService: EnvelopeCrudService,
    private readonly envelopeSignerService: EnvelopeSignerService,
    private readonly invitationTokenService: InvitationTokenService,
    private readonly signerReminderTrackingService: SignerReminderTrackingService,
    private readonly signatureAuditEventService: AuditEventService,
    private readonly envelopeNotificationService: EnvelopeNotificationService
  ) {}

  /**
   * Sends reminder notifications to pending signers with rate limiting and audit tracking
   * @param input - The reminder request containing envelope ID, signer filters, and security context
   * @returns Promise that resolves to the reminder operation result with tracking information
   * @throws NotFoundError when envelope is not found
   * @throws AccessDeniedError when user lacks permission to send reminders
   * @throws BadRequestError when reminder policies are violated
   * @example
   * const result = await useCase.execute({
   *   envelopeId: EnvelopeId.fromString('envelope-123'),
   *   request: { signerIds: ['signer-1'], message: 'Please sign', type: NotificationType.REMINDER },
   *   userId: 'user-456',
   *   securityContext: { ipAddress: '192.168.1.1', userAgent: 'Mozilla/5.0', country: 'US' }
   * });
   */
  async execute(input: SendRemindersInput): Promise<SendRemindersResult> {
    const { envelopeId, request, userId, securityContext } = input;

    try {
      // 1) Envelope existence and access
      const envelope = await this.envelopeCrudService.getEnvelopeWithSigners(envelopeId);
      if (!envelope) {
        throw envelopeNotFound(`Envelope with ID ${envelopeId.getValue()} not found`);
      }

      EnvelopeAccessValidationRule.validateEnvelopeModificationAccess(envelope, userId);

      // 2) Pending signers
      const pendingSigners = await this.envelopeSignerService.getPendingSigners(envelopeId);
      if (pendingSigners.length === 0) {
        return {
          success: true,
          message: 'No pending signers to remind',
          envelopeId: envelopeId.getValue(),
          remindersSent: 0,
          signersNotified: [],
          skippedSigners: []
        };
      }

      // 3) Optional filter by signerIds
      const signersToRemind: EnvelopeSigner[] = request.signerIds?.length
        ? filterSignersByIds(pendingSigners, request.signerIds)
        : pendingSigners;

      if (signersToRemind.length === 0) {
        return {
          success: true,
          message: 'No matching pending signers found',
          envelopeId: envelopeId.getValue(),
          remindersSent: 0,
          signersNotified: [],
          skippedSigners: []
        };
      }

      // 4) Reminder limits from config
      const config = loadConfig();
      const maxReminders = config.reminders.maxRemindersPerSigner;
      const minHoursBetween = config.reminders.minHoursBetweenReminders;

      const signersNotified: SendRemindersResult['signersNotified'] = [];
      const skippedSigners: SendRemindersResult['skippedSigners'] = [];

      // 5) Process each signer
      for (const signer of signersToRemind) {
        const signerId = signer.getId();
        const email = signer.getEmail()?.getValue() || 'Unknown';
        const name = signer.getFullName() || email;

        // 5.a) Check allowance to send reminder
        const { canSend, reason } = await this.signerReminderTrackingService.canSendReminder(
          signerId,
          envelopeId,
          maxReminders,
          minHoursBetween
        );

        if (!canSend) {
          skippedSigners.push({
            id: signerId.getValue(),
            email,
            reason: reason || 'Reminder policy restriction'
          });
          continue;
        }

        // 5.b) Record reminder
        const tracking = await this.signerReminderTrackingService.recordReminderSent(
          signerId,
          envelopeId,
          request.message
        );

        // 5.c) Ensure there is an active invitation token
        const tokens = await this.invitationTokenService.getTokensBySigner(signerId);
        const activeToken = tokens.find(t => !t.isExpired());
        if (!activeToken) {
          skippedSigners.push({
            id: signerId.getValue(),
            email,
            reason: 'No active invitation token found'
          });
          continue;
        }

        // 5.d) Update token resend metadata
        await this.invitationTokenService.updateTokenSent(activeToken.getId());

        // 5.e) Publish reminder notification
        await this.envelopeNotificationService.publishReminder(
          envelopeId,
          signerId,
          request.message,
          tracking.getReminderCount()
        );

        // 5.f) Audit
        await this.signatureAuditEventService.create({
          envelopeId: envelopeId.getValue(),
          signerId: signerId.getValue(),
          eventType: 'SIGNER_REMINDER_SENT' as any,
          description: `Reminder sent to signer ${name} (${email})`,
          userId,
          networkContext: createNetworkSecurityContext(
            securityContext.ipAddress,
            securityContext.userAgent,
            securityContext.country
          ),
          metadata: {
            reminderCount: tracking.getReminderCount(),
            message: request.message,
            lastReminderAt: tracking.getLastReminderAt()?.toISOString()
          }
        });

        signersNotified.push({
          id: signerId.getValue(),
          email,
          name,
          reminderCount: tracking.getReminderCount(),
          lastReminderAt: tracking.getLastReminderAt() || new Date()
        });
      }

      return {
        success: true,
        message: `Reminders sent to ${signersNotified.length} signers`,
        envelopeId: envelopeId.getValue(),
        remindersSent: signersNotified.length,
        signersNotified,
        skippedSigners
      };
    } catch (error) {
      rethrow(error);
    }
  }
}
