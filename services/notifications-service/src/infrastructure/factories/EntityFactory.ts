/**
 * @fileoverview EntityFactory - Abstract factory for creating domain entities and value objects
 * @summary Centralized factory for creating all domain entities with proper validation
 * @description This factory encapsulates the creation logic for all domain entities and value objects,
 * ensuring consistent creation patterns, proper validation, and type safety across the application.
 * It follows the Abstract Factory pattern to create different types of entities based on input data.
 */

import { NotificationId } from '../../domain/value-objects/NotificationId';
import { Notification } from '../../domain/entities/Notification';
import { NotificationStatus } from '@prisma/client';
import { uuid } from '@lawprotect/shared-ts';
import type { CreateNotificationData } from '../../domain/types/notification';
import { invalidEntity } from '../../notification-errors';

/**
 * Abstract factory for creating domain entities and value objects
 * 
 * This factory provides a centralized way to create all domain entities,
 * ensuring consistent creation patterns and proper validation.
 * It can create different types of entities based on the input data provided.
 */
export abstract class EntityFactory {
  /**
   * @description Creates a domain entity based on the entity type and data provided
   * @param {string} entityType - The type of entity to create
   * @param {unknown} data - The data for creating the entity
   * @returns {T} The created entity instance
   * @throws {Error} When entity type is not supported or data is invalid
   */
  static create<T>(entityType: string, data: unknown): T {
    switch (entityType) {
      case 'Notification':
        return this.createNotification(data as CreateNotificationData) as T;
      default:
        throw invalidEntity({ entityType });
    }
  }

  /**
   * @description Creates a new Notification entity
   * @param {CreateNotificationData} data - The notification creation data
   * @returns {Notification} New Notification instance
   */
  static createNotification(data: CreateNotificationData): Notification {
    const now = new Date();
    const notificationId = data.notificationId || uuid();
    
    return new Notification(
      NotificationId.generate(),
      notificationId,
      data.eventId,
      data.eventType,
      data.channel,
      data.recipient,
      data.recipientType,
      NotificationStatus.PENDING,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      0,
      data.maxRetries ?? 3,
      data.subject,
      data.body,
      data.templateId,
      data.metadata,
      undefined,
      undefined,
      data.userId,
      data.envelopeId,
      data.signerId,
      now,
      now
    );
  }

  /**
   * @description Factory methods for creating value objects from primitive types
   */
  static readonly createValueObjects = {
    /**
     * @description Creates NotificationId from string or generates new one
     * @param {string} [value] - Optional string value to convert
     * @returns {NotificationId} NotificationId instance
     */
    notificationId: (value?: string): NotificationId =>
      value ? NotificationId.fromString(value) : NotificationId.generate(),
  };
}
