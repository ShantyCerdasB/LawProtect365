/**
 * @fileoverview Notification Test Builders - Reusable test data builders for notification repository tests
 * @summary Provides builders for creating test data related to notification entities
 * @description This module provides builders for creating notification-related test data including
 * entities, persistence rows, DTOs, and specifications. It follows the builder pattern
 * for creating test data with sensible defaults and override capabilities.
 */

import { Notification } from '../../../src/domain/entities/Notification';
import { NotificationId } from '../../../src/domain/value-objects/NotificationId';
import { NotificationChannel, NotificationStatus, RecipientType } from '@prisma/client';
import { TestUtils } from '../testUtils';
import type { NotificationSpec } from '../../../src/domain/types/notification';

/**
 * Creates a persistence row for notification with sensible defaults
 * @param overrides - Partial data to override defaults
 * @returns Notification persistence row
 */
export function notificationPersistenceRow(overrides: any = {}) {
  const id = overrides.id || TestUtils.generateUuid();
  const notificationId = overrides.notificationId || TestUtils.generateUuid();
  const now = new Date('2024-01-01T00:00:00Z');
  
  return {
    id,
    notificationId,
    eventId: overrides.eventId || TestUtils.generateUuid(),
    eventType: overrides.eventType || 'ENVELOPE_INVITATION',
    channel: overrides.channel || NotificationChannel.EMAIL,
    recipient: overrides.recipient || 'test@example.com',
    recipientType: overrides.recipientType || RecipientType.EMAIL,
    status: overrides.status || NotificationStatus.PENDING,
    sentAt: overrides.sentAt || null,
    deliveredAt: overrides.deliveredAt || null,
    failedAt: overrides.failedAt || null,
    bouncedAt: overrides.bouncedAt || null,
    errorMessage: overrides.errorMessage || null,
    errorCode: overrides.errorCode || null,
    retryCount: overrides.retryCount ?? 0,
    maxRetries: overrides.maxRetries ?? 3,
    subject: overrides.subject || 'Test Subject',
    body: overrides.body || 'Test Body',
    templateId: overrides.templateId || null,
    metadata: overrides.metadata || null,
    providerMessageId: overrides.providerMessageId || null,
    providerResponse: overrides.providerResponse || null,
    userId: overrides.userId || null,
    envelopeId: overrides.envelopeId || null,
    signerId: overrides.signerId || null,
    createdAt: overrides.createdAt || now,
    updatedAt: overrides.updatedAt || now,
    ...overrides
  };
}

/**
 * Creates a Notification domain entity with sensible defaults
 * @param overrides - Partial data to override defaults
 * @returns Notification domain entity
 */
export function notificationEntity(overrides: any = {}) {
  const id = overrides.id || NotificationId.generate();
  const notificationId = overrides.notificationId || TestUtils.generateUuid();
  const now = new Date('2024-01-01T00:00:00Z');
  
  return new Notification(
    id,
    notificationId,
    overrides.hasOwnProperty('eventId') ? overrides.eventId : TestUtils.generateUuid(),
    overrides.eventType || 'ENVELOPE_INVITATION',
    overrides.channel || NotificationChannel.EMAIL,
    overrides.recipient || 'test@example.com',
    overrides.recipientType || RecipientType.EMAIL,
    overrides.status || NotificationStatus.PENDING,
    overrides.hasOwnProperty('sentAt') ? overrides.sentAt : undefined,
    overrides.hasOwnProperty('deliveredAt') ? overrides.deliveredAt : undefined,
    overrides.hasOwnProperty('failedAt') ? overrides.failedAt : undefined,
    overrides.hasOwnProperty('bouncedAt') ? overrides.bouncedAt : undefined,
    overrides.hasOwnProperty('errorMessage') ? overrides.errorMessage : undefined,
    overrides.hasOwnProperty('errorCode') ? overrides.errorCode : undefined,
    overrides.retryCount ?? 0,
    overrides.maxRetries ?? 3,
    overrides.hasOwnProperty('subject') ? overrides.subject : 'Test Subject',
    overrides.hasOwnProperty('body') ? overrides.body : 'Test Body',
    overrides.hasOwnProperty('templateId') ? overrides.templateId : undefined,
    overrides.hasOwnProperty('metadata') ? overrides.metadata : undefined,
    overrides.hasOwnProperty('providerMessageId') ? overrides.providerMessageId : undefined,
    overrides.hasOwnProperty('providerResponse') ? overrides.providerResponse : undefined,
    overrides.hasOwnProperty('userId') ? overrides.userId : undefined,
    overrides.hasOwnProperty('envelopeId') ? overrides.envelopeId : undefined,
    overrides.hasOwnProperty('signerId') ? overrides.signerId : undefined,
    overrides.createdAt || now,
    overrides.updatedAt || now
  );
}

/**
 * Creates a NotificationSpec for querying
 * @param overrides - Partial spec to override defaults
 * @returns NotificationSpec object
 */
export function notificationSpec(overrides: Partial<NotificationSpec> = {}): NotificationSpec {
  return {
    status: overrides.status,
    channel: overrides.channel,
    recipient: overrides.recipient,
    eventType: overrides.eventType,
    eventId: overrides.eventId,
    notificationId: overrides.notificationId,
    userId: overrides.userId,
    envelopeId: overrides.envelopeId,
    signerId: overrides.signerId,
    createdAfter: overrides.createdAfter,
    createdBefore: overrides.createdBefore,
    sentAfter: overrides.sentAfter,
    sentBefore: overrides.sentBefore,
  };
}

/**
 * Creates a partial notification entity for updates
 * @param overrides - Partial data to override defaults
 * @returns Partial notification entity with getters
 */
export function partialNotificationEntity(overrides: any = {}) {
  return {
    getStatus: () => overrides.status || NotificationStatus.SENT,
    getSentAt: () => overrides.sentAt || new Date(),
    getDeliveredAt: () => overrides.deliveredAt,
    getFailedAt: () => overrides.failedAt,
    getBouncedAt: () => overrides.bouncedAt,
    getErrorMessage: () => overrides.errorMessage,
    getErrorCode: () => overrides.errorCode,
    getRetryCount: () => overrides.retryCount ?? 0,
    getProviderMessageId: () => overrides.providerMessageId,
    getProviderResponse: () => overrides.providerResponse,
    ...overrides
  };
}

