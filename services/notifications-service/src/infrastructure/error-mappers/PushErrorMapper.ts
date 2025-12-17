/**
 * @fileoverview PushErrorMapper - Error mapper for push notification services
 * @summary Maps FCM and APNS errors to domain errors
 * @description Provides centralized error mapping for push notification services,
 * following the same pattern as mapAwsError in shared-ts for consistency.
 */

import { BadRequestError, mapAwsError } from '@lawprotect/shared-ts';
import { pushSendFailed, invalidRecipient } from '../../notification-errors';

/**
 * Maps FCM-specific errors to domain errors
 * @param {unknown} error - The error to map
 * @param {string} deviceToken - Device token involved in the operation
 * @param {string} context - Context string for error messages
 * @returns {never} Never returns, always throws
 */
export function mapFcmError(error: unknown, deviceToken: string, context: string): never {
  if (error instanceof BadRequestError) {
    throw error;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('invalid-registration-token') || message.includes('invalid registration token')) {
      throw invalidRecipient(`Invalid FCM device token: ${deviceToken}`);
    }
    if (message.includes('registration-token-not-registered')) {
      throw pushSendFailed(`Device token not registered: ${deviceToken}`);
    }
    if (message.includes('authentication-error') || message.includes('permission-denied')) {
      throw pushSendFailed('FCM authentication failed');
    }
    if (message.includes('invalid-argument')) {
      throw pushSendFailed(`Invalid FCM message: ${error.message}`);
    }
  }

  throw mapAwsError(error, context);
}

/**
 * Maps APNS-specific errors to domain errors
 * @param {unknown} error - The error to map
 * @param {string} deviceToken - Device token involved in the operation
 * @param {string} context - Context string for error messages
 * @returns {never} Never returns, always throws
 */
export function mapApnsError(error: unknown, deviceToken: string, context: string): never {
  if (error instanceof BadRequestError) {
    throw error;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('invalidtoken') || message.includes('baddevicetoken')) {
      throw invalidRecipient(`Invalid APNS device token: ${deviceToken}`);
    }
    if (message.includes('unregistered')) {
      throw pushSendFailed(`Device token not registered: ${deviceToken}`);
    }
    if (message.includes('forbidden') || message.includes('unauthorized')) {
      throw pushSendFailed('APNS authentication failed');
    }
    if (message.includes('badtopic') || message.includes('topicdisallowed')) {
      throw pushSendFailed(`Invalid bundle ID for device token: ${deviceToken}`);
    }
  }

  throw mapAwsError(error, context);
}

/**
 * Maps push notification service errors to domain errors
 * @param {unknown} error - The error to map
 * @param {string} operation - Operation context
 * @param {string} recipient - Recipient involved in the operation
 * @returns {never} Never returns, always throws
 */
export function mapPushServiceError(error: unknown, operation: string, recipient: string): never {
  if (error instanceof BadRequestError) {
    throw error;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('invalidparameter') || message.includes('invalid') || message.includes('invalid device token')) {
      throw pushSendFailed(`Invalid device token: ${recipient}`);
    }
    if (message.includes('notfound') || message.includes('not found')) {
      throw pushSendFailed('Push notification service not configured');
    }
    if (message.includes('unauthorized') || message.includes('unauthorized')) {
      throw pushSendFailed('Push notification service authentication failed');
    }
  }

  throw mapAwsError(error, `PushNotificationService.${operation}`);
}

