/**
 * @fileoverview NotificationDeliveryService - Domain service for notification delivery
 * @summary Coordinates notification delivery across different channels
 * @description Domain service that handles the business logic for delivering
 * notifications via email, SMS, and push channels. It coordinates with infrastructure
 * services and handles channel-specific logic.
 */

import type { EmailService } from '../email';
import type { SmsService } from '../sms';
import type { PushNotificationService } from '../push';
import type { NotificationServiceConfig } from '../../config/types';
import type { SendNotificationResult } from '../../domain/types/delivery';
import { NotificationChannel } from '@prisma/client';
import { DEFAULT_NOTIFICATION_SUBJECT } from '../../domain/constants';
import { channelDisabled, invalidChannel } from '../../notification-errors';

/**
 * Domain service for coordinating notification delivery
 * 
 * Follows Single Responsibility Principle by focusing exclusively on
 * notification delivery coordination across channels.
 */
export class NotificationDeliveryService {
  constructor(
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly pushNotificationService: PushNotificationService,
    private readonly config: NotificationServiceConfig
  ) {}

  /**
   * @description Sends notification via the appropriate channel service
   * @param {NotificationChannel} channel - Notification channel
   * @param {string} recipient - Recipient address
   * @param {string} [subject] - Optional subject/title
   * @param {string} body - Message body
   * @param {string} [htmlBody] - Optional HTML body for email
   * @param {Record<string, unknown>} [metadata] - Optional metadata
   * @returns {Promise<SendNotificationResult>} Send result with messageId and sentAt
   * @throws {invalidChannel} When channel is unsupported
   * @throws {channelDisabled} When channel is disabled
   */
  async sendNotification(
    channel: NotificationChannel,
    recipient: string,
    subject: string | undefined,
    body: string,
    htmlBody?: string,
    metadata?: Record<string, unknown>
  ): Promise<SendNotificationResult> {
    switch (channel) {
      case NotificationChannel.EMAIL:
        return this.sendEmail(recipient, subject, body, htmlBody);
      case NotificationChannel.SMS:
        return this.sendSms(recipient, body);
      case NotificationChannel.PUSH:
        return this.sendPush(recipient, subject, body, metadata);
      default:
        throw invalidChannel({ channel, recipient });
    }
  }

  /**
   * @description Sends email notification
   * @param {string} recipient - Email recipient
   * @param {string} [subject] - Email subject
   * @param {string} body - Email body (text)
   * @param {string} [htmlBody] - Email body (HTML)
   * @returns {Promise<SendNotificationResult>} Send result
   * @throws {channelDisabled} When email notifications are disabled
   */
  private async sendEmail(
    recipient: string,
    subject: string | undefined,
    body: string,
    htmlBody?: string
  ): Promise<SendNotificationResult> {
    if (!this.config.features.enableEmail) {
      throw channelDisabled({ channel: NotificationChannel.EMAIL, recipient });
    }

    const emailResult = await this.emailService.sendEmail({
      to: recipient,
      subject: subject || DEFAULT_NOTIFICATION_SUBJECT,
      body,
      htmlBody
    });

    return {
      messageId: emailResult.messageId,
      sentAt: emailResult.sentAt
    };
  }

  /**
   * @description Sends SMS notification
   * @param {string} recipient - Phone number
   * @param {string} body - SMS message
   * @returns {Promise<SendNotificationResult>} Send result
   * @throws {channelDisabled} When SMS notifications are disabled
   */
  private async sendSms(recipient: string, body: string): Promise<SendNotificationResult> {
    if (!this.config.features.enableSms) {
      throw channelDisabled({ channel: NotificationChannel.SMS, recipient });
    }

    const smsResult = await this.smsService.sendSms({
      phoneNumber: recipient,
      message: body
    });

    return {
      messageId: smsResult.messageId,
      sentAt: smsResult.sentAt
    };
  }

  /**
   * @description Sends push notification
   * @param {string} recipient - Device token
   * @param {string} [subject] - Push title
   * @param {string} body - Push message
   * @param {Record<string, unknown>} [metadata] - Optional metadata
   * @returns {Promise<SendNotificationResult>} Send result
   * @throws {channelDisabled} When push notifications are disabled
   */
  private async sendPush(
    recipient: string,
    subject: string | undefined,
    body: string,
    metadata?: Record<string, unknown>
  ): Promise<SendNotificationResult> {
    if (!this.config.features.enablePush) {
      throw channelDisabled({ channel: NotificationChannel.PUSH, recipient });
    }

    const pushResult = await this.pushNotificationService.sendPush({
      deviceToken: recipient,
      title: subject || DEFAULT_NOTIFICATION_SUBJECT,
      body,
      data: metadata
    });

    return {
      messageId: pushResult.messageId,
      sentAt: pushResult.sentAt
    };
  }
}

