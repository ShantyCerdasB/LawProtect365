/**
 * @fileoverview PlatformDetectionRule - Domain rule for detecting mobile platform
 * @summary Determines platform (Android/iOS) from device token
 * @description Encapsulates logic for detecting mobile platform based on device token format.
 * This rule helps determine which push notification service (FCM or APNS) to use.
 */

import { Platform } from '../enums';
import { recipientRequired } from '../../notification-errors';

/**
 * PlatformDetectionRule - Domain rule for platform detection
 * 
 * Detects mobile platform from device token format:
 * - Android/FCM tokens: typically 152+ characters, base64-like
 * - iOS/APNS tokens: typically 64 characters, hexadecimal
 */
export class PlatformDetectionRule {
  /**
   * @description Detects platform from device token
   * @param {string} deviceToken - Device token to analyze
   * @returns {Platform} Detected platform (Android or iOS)
   * @throws {Error} When token format is unrecognized
   */
  static detectPlatform(deviceToken: string): Platform {
    if (!deviceToken || deviceToken.trim().length === 0) {
      throw recipientRequired('Device token cannot be empty');
    }

    const trimmed = deviceToken.trim();

    if (PlatformDetectionRule.isIosToken(trimmed)) {
      return Platform.IOS;
    }

    if (PlatformDetectionRule.isAndroidToken(trimmed)) {
      return Platform.ANDROID;
    }

    return Platform.ANDROID;
  }

  /**
   * @description Checks if token appears to be iOS/APNS format
   * @param {string} token - Device token
   * @returns {boolean} True if likely iOS token
   */
  private static isIosToken(token: string): boolean {
    if (token.length === 64 && /^[0-9a-fA-F]{64}$/.test(token)) {
      return true;
    }

    if (token.length === 32 && /^[0-9a-fA-F]{32}$/.test(token)) {
      return true;
    }

    return false;
  }

  /**
   * @description Checks if token appears to be Android/FCM format
   * @param {string} token - Device token
   * @returns {boolean} True if likely Android token
   */
  private static isAndroidToken(token: string): boolean {
    if (token.length >= 152) {
      return true;
    }

    if (/^[A-Za-z0-9_-]+$/.test(token) && token.length > 100) {
      return true;
    }

    return false;
  }
}

