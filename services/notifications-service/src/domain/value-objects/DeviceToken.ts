/**
 * @fileoverview DeviceToken value object - Represents a validated device token
 * @summary Encapsulates device token validation for push notifications
 * @description The DeviceToken value object ensures device tokens are valid
 * for FCM/APNS push notification operations.
 */

import { StringValueObject } from '@lawprotect/shared-ts';
import { invalidRecipient } from '../../notification-errors';

/**
 * DeviceToken value object
 * 
 * Represents a validated device token for push notifications.
 * Ensures device tokens meet minimum length requirements for FCM/APNS.
 */
export class DeviceToken extends StringValueObject {
  constructor(value: string) {
    if (!value || typeof value !== 'string') {
      throw invalidRecipient('Device token must be a non-empty string');
    }

    const trimmed = value.trim();
    
    if (!DeviceToken.isValid(trimmed)) {
      throw invalidRecipient(`Invalid device token: ${value}`);
    }

    super(trimmed);
  }

  /**
   * @description Creates a DeviceToken from a string value
   * @param {string} value - The device token string to convert
   * @returns {DeviceToken} A new DeviceToken instance
   */
  static fromString(value: string): DeviceToken {
    return new DeviceToken(value);
  }

  /**
   * @description Creates a DeviceToken from a string value or returns undefined if null/undefined
   * @param {string | null | undefined} value - String value or null/undefined
   * @returns {DeviceToken | undefined} DeviceToken instance or undefined
   */
  static fromStringOrUndefined(value: string | null | undefined): DeviceToken | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }
    return new DeviceToken(value);
  }

  /**
   * @description Validates if a string is a valid device token
   * @param {string} deviceToken - Device token to validate
   * @returns {boolean} True if valid format, false otherwise
   */
  static isValid(deviceToken: string): boolean {
    return deviceToken.length >= 32 && deviceToken.length <= 200;
  }
}

