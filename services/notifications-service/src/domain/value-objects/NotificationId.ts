/**
 * @fileoverview NotificationId value object - Represents a unique notification identifier
 * @summary Encapsulates notification ID validation and equality logic
 * @description The NotificationId value object ensures notification identifiers are valid UUIDs
 * and provides type safety for notification identification throughout the system.
 */

import { Identifier, uuid, isUuidV4 } from '@lawprotect/shared-ts';
import { notificationNotFound } from '../../notification-errors';

/**
 * NotificationId value object
 * 
 * Represents a unique identifier for a notification. Ensures the ID is a valid UUID
 * and provides type safety for notification identification.
 */
export class NotificationId extends Identifier<string> {
  constructor(value: string) {
    if (!value || typeof value !== 'string') {
      throw notificationNotFound('NotificationId must be a non-empty string');
    }

    if (!isUuidV4(value)) {
      throw notificationNotFound('NotificationId must be a valid UUID');
    }

    super(value);
  }

  /**
   * @description Creates a new NotificationId with a random UUID
   * @returns {NotificationId} New NotificationId instance
   */
  static generate(): NotificationId {
    return new NotificationId(uuid());
  }

  /**
   * @description Creates a NotificationId from a string value
   * @param {string} value - String value to create NotificationId from
   * @returns {NotificationId} NotificationId instance
   */
  static fromString(value: string): NotificationId {
    return new NotificationId(value);
  }

  /**
   * @description Creates a NotificationId from a string value or returns undefined if null/undefined
   * @param {string | null | undefined} value - String value or null/undefined
   * @returns {NotificationId | undefined} NotificationId instance or undefined
   */
  static fromStringOrUndefined(value: string | null | undefined): NotificationId | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }
    return new NotificationId(value);
  }

  /**
   * @description Checks if this NotificationId equals another NotificationId
   * @param {NotificationId} other - Other NotificationId to compare
   * @returns {boolean} True if equal, false otherwise
   */
  equals(other: NotificationId): boolean {
    return this.getValue() === other.getValue();
  }

  /**
   * @description Returns the string representation of the notification ID
   * @returns {string} String representation
   */
  toString(): string {
    return this.getValue();
  }

  /**
   * @description Returns the JSON representation of the notification ID
   * @returns {string} JSON representation
   */
  toJSON(): string {
    return this.getValue();
  }
}

