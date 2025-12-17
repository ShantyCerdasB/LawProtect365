/**
 * @fileoverview Notification entity - Represents a notification sent to a recipient
 * @summary Manages notification lifecycle, status tracking, and retry logic
 * @description The Notification entity encapsulates all notification-related information including
 * channel, recipient, status, retry counts, and provider responses for tracking and audit purposes.
 */

import { NotificationId } from '../value-objects/NotificationId';
import { NotificationChannel, NotificationStatus, RecipientType } from '@prisma/client';
import {
  notificationInvalidState,
} from '../../notification-errors';

/**
 * Notification entity representing a notification sent to a recipient.
 *
 * Tracks the complete lifecycle of a notification including creation, sending,
 * delivery status, failures, and retry attempts. Supports multiple channels
 * (email, SMS, push) and maintains provider-specific metadata.
 */
export class Notification {
  constructor(
    private readonly id: NotificationId,
    private readonly notificationId: string,
    private readonly eventId: string | undefined,
    private readonly eventType: string,
    private readonly channel: NotificationChannel,
    private readonly recipient: string,
    private readonly recipientType: RecipientType,
    private status: NotificationStatus,
    private sentAt: Date | undefined,
    private deliveredAt: Date | undefined,
    private failedAt: Date | undefined,
    private bouncedAt: Date | undefined,
    private errorMessage: string | undefined,
    private errorCode: string | undefined,
    private retryCount: number,
    private readonly maxRetries: number,
    private readonly subject: string | undefined,
    private readonly body: string | undefined,
    private readonly templateId: string | undefined,
    private readonly metadata: Record<string, unknown> | undefined,
    private readonly providerMessageId: string | undefined,
    private readonly providerResponse: Record<string, unknown> | undefined,
    private readonly userId: string | undefined,
    private readonly envelopeId: string | undefined,
    private readonly signerId: string | undefined,
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {}

  /**
   * @description Gets the notification unique identifier
   * @returns {NotificationId} The notification identifier value object
   */
  getId(): NotificationId {
    return this.id;
  }

  /**
   * @description Gets the notification ID string (for deduplication)
   * @returns {string} Notification ID string
   */
  getNotificationId(): string {
    return this.notificationId;
  }

  /**
   * @description Gets the event ID that triggered this notification
   * @returns {string | undefined} Event ID or undefined
   */
  getEventId(): string | undefined {
    return this.eventId;
  }

  /**
   * @description Gets the event type
   * @returns {string} Event type
   */
  getEventType(): string {
    return this.eventType;
  }

  /**
   * @description Gets the notification channel
   * @returns {NotificationChannel} Notification channel
   */
  getChannel(): NotificationChannel {
    return this.channel;
  }

  /**
   * @description Gets the recipient address
   * @returns {string} Recipient address
   */
  getRecipient(): string {
    return this.recipient;
  }

  /**
   * @description Gets the recipient type
   * @returns {RecipientType} Recipient type
   */
  getRecipientType(): RecipientType {
    return this.recipientType;
  }

  /**
   * @description Gets the current status
   * @returns {NotificationStatus} Current status
   */
  getStatus(): NotificationStatus {
    return this.status;
  }

  /**
   * @description Gets the sent timestamp
   * @returns {Date | undefined} Sent timestamp or undefined
   */
  getSentAt(): Date | undefined {
    return this.sentAt;
  }

  /**
   * @description Gets the delivered timestamp
   * @returns {Date | undefined} Delivered timestamp or undefined
   */
  getDeliveredAt(): Date | undefined {
    return this.deliveredAt;
  }

  /**
   * @description Gets the failed timestamp
   * @returns {Date | undefined} Failed timestamp or undefined
   */
  getFailedAt(): Date | undefined {
    return this.failedAt;
  }

  /**
   * @description Gets the bounced timestamp
   * @returns {Date | undefined} Bounced timestamp or undefined
   */
  getBouncedAt(): Date | undefined {
    return this.bouncedAt;
  }

  /**
   * @description Gets the error message
   * @returns {string | undefined} Error message or undefined
   */
  getErrorMessage(): string | undefined {
    return this.errorMessage;
  }

  /**
   * @description Gets the error code
   * @returns {string | undefined} Error code or undefined
   */
  getErrorCode(): string | undefined {
    return this.errorCode;
  }

  /**
   * @description Gets the retry count
   * @returns {number} Retry count
   */
  getRetryCount(): number {
    return this.retryCount;
  }

  /**
   * @description Gets the maximum retries
   * @returns {number} Maximum retries
   */
  getMaxRetries(): number {
    return this.maxRetries;
  }

  /**
   * @description Gets the subject
   * @returns {string | undefined} Subject or undefined
   */
  getSubject(): string | undefined {
    return this.subject;
  }

  /**
   * @description Gets the body
   * @returns {string | undefined} Body or undefined
   */
  getBody(): string | undefined {
    return this.body;
  }

  /**
   * @description Gets the template ID
   * @returns {string | undefined} Template ID or undefined
   */
  getTemplateId(): string | undefined {
    return this.templateId;
  }

  /**
   * @description Gets the metadata
   * @returns {Record<string, unknown> | undefined} Metadata or undefined
   */
  getMetadata(): Record<string, unknown> | undefined {
    return this.metadata;
  }

  /**
   * @description Gets the provider message ID
   * @returns {string | undefined} Provider message ID or undefined
   */
  getProviderMessageId(): string | undefined {
    return this.providerMessageId;
  }

  /**
   * @description Gets the provider response
   * @returns {Record<string, unknown> | undefined} Provider response or undefined
   */
  getProviderResponse(): Record<string, unknown> | undefined {
    return this.providerResponse;
  }

  /**
   * @description Gets the user ID
   * @returns {string | undefined} User ID or undefined
   */
  getUserId(): string | undefined {
    return this.userId;
  }

  /**
   * @description Gets the envelope ID
   * @returns {string | undefined} Envelope ID or undefined
   */
  getEnvelopeId(): string | undefined {
    return this.envelopeId;
  }

  /**
   * @description Gets the signer ID
   * @returns {string | undefined} Signer ID or undefined
   */
  getSignerId(): string | undefined {
    return this.signerId;
  }

  /**
   * @description Gets the creation timestamp
   * @returns {Date} Creation timestamp
   */
  getCreatedAt(): Date {
    return this.createdAt;
  }

  /**
   * @description Gets the last update timestamp
   * @returns {Date} Last update timestamp
   */
  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  /**
   * @description Marks the notification as sent
   * @param {Date} [timestamp] - Optional timestamp, defaults to now
   * @returns {Notification} New Notification instance with updated status
   */
  markAsSent(timestamp?: Date): Notification {
    if (this.status !== NotificationStatus.PENDING) {
      throw notificationInvalidState(`Cannot mark as sent: notification is in ${this.status} status`);
    }

    const now = timestamp || new Date();
    return new Notification(
      this.id,
      this.notificationId,
      this.eventId,
      this.eventType,
      this.channel,
      this.recipient,
      this.recipientType,
      NotificationStatus.SENT,
      now,
      this.deliveredAt,
      this.failedAt,
      this.bouncedAt,
      this.errorMessage,
      this.errorCode,
      this.retryCount,
      this.maxRetries,
      this.subject,
      this.body,
      this.templateId,
      this.metadata,
      this.providerMessageId,
      this.providerResponse,
      this.userId,
      this.envelopeId,
      this.signerId,
      this.createdAt,
      now
    );
  }

  /**
   * @description Marks the notification as delivered
   * @param {Date} [timestamp] - Optional timestamp, defaults to now
   * @returns {Notification} New Notification instance with updated status
   */
  markAsDelivered(timestamp?: Date): Notification {
    if (this.status !== NotificationStatus.SENT) {
      throw notificationInvalidState(`Cannot mark as delivered: notification is in ${this.status} status`);
    }

    const now = timestamp || new Date();
    return new Notification(
      this.id,
      this.notificationId,
      this.eventId,
      this.eventType,
      this.channel,
      this.recipient,
      this.recipientType,
      NotificationStatus.DELIVERED,
      this.sentAt,
      now,
      this.failedAt,
      this.bouncedAt,
      this.errorMessage,
      this.errorCode,
      this.retryCount,
      this.maxRetries,
      this.subject,
      this.body,
      this.templateId,
      this.metadata,
      this.providerMessageId,
      this.providerResponse,
      this.userId,
      this.envelopeId,
      this.signerId,
      this.createdAt,
      now
    );
  }

  /**
   * @description Marks the notification as failed
   * @param {string} errorMessage - Error message
   * @param {string} [errorCode] - Optional error code
   * @param {Date} [timestamp] - Optional timestamp, defaults to now
   * @returns {Notification} New Notification instance with updated status
   */
  markAsFailed(errorMessage: string, errorCode?: string, timestamp?: Date): Notification {
    if (this.status === NotificationStatus.DELIVERED) {
      throw notificationInvalidState('Cannot mark as failed: notification is already delivered');
    }

    const now = timestamp || new Date();
    return new Notification(
      this.id,
      this.notificationId,
      this.eventId,
      this.eventType,
      this.channel,
      this.recipient,
      this.recipientType,
      NotificationStatus.FAILED,
      this.sentAt,
      this.deliveredAt,
      now,
      this.bouncedAt,
      errorMessage,
      errorCode,
      this.retryCount + 1,
      this.maxRetries,
      this.subject,
      this.body,
      this.templateId,
      this.metadata,
      this.providerMessageId,
      this.providerResponse,
      this.userId,
      this.envelopeId,
      this.signerId,
      this.createdAt,
      now
    );
  }

  /**
   * @description Marks the notification as bounced
   * @param {Date} [timestamp] - Optional timestamp, defaults to now
   * @returns {Notification} New Notification instance with updated status
   */
  markAsBounced(timestamp?: Date): Notification {
    const now = timestamp || new Date();
    return new Notification(
      this.id,
      this.notificationId,
      this.eventId,
      this.eventType,
      this.channel,
      this.recipient,
      this.recipientType,
      NotificationStatus.BOUNCED,
      this.sentAt,
      this.deliveredAt,
      this.failedAt,
      now,
      this.errorMessage,
      this.errorCode,
      this.retryCount,
      this.maxRetries,
      this.subject,
      this.body,
      this.templateId,
      this.metadata,
      this.providerMessageId,
      this.providerResponse,
      this.userId,
      this.envelopeId,
      this.signerId,
      this.createdAt,
      now
    );
  }

  /**
   * @description Updates provider information
   * @param {string} providerMessageId - Provider message ID
   * @param {Record<string, unknown>} [providerResponse] - Optional provider response
   * @returns {Notification} New Notification instance with updated provider info
   */
  updateProviderInfo(providerMessageId: string, providerResponse?: Record<string, unknown>): Notification {
    return new Notification(
      this.id,
      this.notificationId,
      this.eventId,
      this.eventType,
      this.channel,
      this.recipient,
      this.recipientType,
      this.status,
      this.sentAt,
      this.deliveredAt,
      this.failedAt,
      this.bouncedAt,
      this.errorMessage,
      this.errorCode,
      this.retryCount,
      this.maxRetries,
      this.subject,
      this.body,
      this.templateId,
      this.metadata,
      providerMessageId,
      providerResponse,
      this.userId,
      this.envelopeId,
      this.signerId,
      this.createdAt,
      new Date()
    );
  }

  /**
   * @description Checks if the notification can be retried
   * @returns {boolean} True if can be retried, false otherwise
   */
  canRetry(): boolean {
    return this.status === NotificationStatus.FAILED && this.retryCount < this.maxRetries;
  }

  /**
   * @description Creates a Notification instance from persistence data
   * @param {any} data - Raw database row
   * @returns {Notification} Notification instance with mapped and typed fields
   */
  static fromPersistence(data: any): Notification {
    return new Notification(
      NotificationId.fromString(data.id),
      data.notificationId,
      data.eventId || undefined,
      data.eventType,
      data.channel,
      data.recipient,
      data.recipientType,
      data.status,
      data.sentAt ? new Date(data.sentAt) : undefined,
      data.deliveredAt ? new Date(data.deliveredAt) : undefined,
      data.failedAt ? new Date(data.failedAt) : undefined,
      data.bouncedAt ? new Date(data.bouncedAt) : undefined,
      data.errorMessage || undefined,
      data.errorCode || undefined,
      data.retryCount,
      data.maxRetries,
      data.subject || undefined,
      data.body || undefined,
      data.templateId || undefined,
      data.metadata ? (data.metadata as Record<string, unknown>) : undefined,
      data.providerMessageId || undefined,
      data.providerResponse ? (data.providerResponse as Record<string, unknown>) : undefined,
      data.userId || undefined,
      data.envelopeId || undefined,
      data.signerId || undefined,
      new Date(data.createdAt),
      new Date(data.updatedAt)
    );
  }
}

