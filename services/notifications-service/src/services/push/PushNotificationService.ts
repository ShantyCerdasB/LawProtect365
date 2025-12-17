/**
 * @fileoverview PushNotificationService - Service for push notification operations
 * @summary Handles push notification sending via FCM/APNS
 * @description This service is responsible ONLY for push notification sending operations.
 * It does not handle persistence, validation, or business logic - those are handled by other services.
 * This service focuses solely on the push notification API interactions and error handling.
 */

import type { SendPushRequest, SendPushResult } from '../../domain/types/push';
import type { FcmMessage } from '../../domain/types/push';
import type { ApnsNotification } from '../../domain/types/push';
import { Platform, PushPriority } from '../../domain/enums';
import { pushSendFailed } from '../../notification-errors';
import { DeviceToken } from '../../domain/value-objects/DeviceToken';
import { NotificationValidationRules } from '../../domain/rules';
import { PlatformDetectionRule } from '../../domain/rules/PlatformDetectionRule';
import type { FcmClient } from '../../infrastructure/clients/fcm';
import type { ApnsClient } from '../../infrastructure/clients/apns';
import { mapPushServiceError } from '../../infrastructure/error-mappers';

/**
 * PushNotificationService - Service for push notification operations only
 * 
 * This service handles ONLY push notification sending operations.
 * It does not handle:
 * - Persistence (handled by repositories)
 * - Business logic validation (handled by entities and other services)
 * - Template rendering (handled by template services)
 * - Retry logic (handled by application services)
 * 
 * Responsibilities:
 * - Send push notifications via FCM/APNS
 * - Handle push notification-specific errors
 * - Validate device tokens
 * - Detect platform (Android/iOS) from device token
 */
export class PushNotificationService {
  constructor(
    private readonly fcmClient?: FcmClient,
    private readonly apnsClient?: ApnsClient
  ) {}

  /**
   * @description Sends a push notification
   * @param {SendPushRequest} request - The push notification request
   * @returns {Promise<SendPushResult>} Promise with message ID and sent timestamp
   * @throws {BadRequestError} When request validation fails
   * @throws {pushSendFailed} When push notification operation fails
   */
  async sendPush(request: SendPushRequest): Promise<SendPushResult> {
    try {
      const deviceToken = this.validatePushRequest(request);
      const platform = PlatformDetectionRule.detectPlatform(deviceToken.getValue());
      
      if (platform === Platform.ANDROID) {
        return await this.sendViaFcm(deviceToken.getValue(), request);
      } else {
        return await this.sendViaApns(deviceToken.getValue(), request);
      }
    } catch (error) {
      this.handlePushError(error, 'sendPush', request.deviceToken);
    }
  }

  /**
   * @description Sends bulk push notifications
   * @param {SendPushRequest[]} requests - Array of push notification requests
   * @returns {Promise<SendPushResult[]>} Promise with array of results
   * @throws {BadRequestError} When request validation fails
   * @throws {pushSendFailed} When push notification operation fails
   */
  async sendBulkPush(requests: SendPushRequest[]): Promise<SendPushResult[]> {
    NotificationValidationRules.validateRequestArray(requests, 'Push notification request');

    const results: SendPushResult[] = [];

    for (const request of requests) {
      try {
        const result = await this.sendPush(request);
        results.push(result);
      } catch (error) {
        results.push({
          messageId: `failed-${request.deviceToken}`,
          sentAt: new Date(),
          deviceToken: request.deviceToken,
        });
      }
    }

    return results;
  }

  /**
   * @description Validates push notification request using value objects and domain rules
   * @param {SendPushRequest} request - Push request to validate
   * @returns {DeviceToken} Validated device token value object
   * @throws {recipientRequired} When device token is missing
   * @throws {invalidRecipient} When device token is invalid
   * @throws {BadRequestError} When title or body is missing
   */
  private validatePushRequest(request: SendPushRequest): DeviceToken {
    NotificationValidationRules.validateRecipient(request.deviceToken, 'Device token');
    NotificationValidationRules.validateTitleAndBody(request.title, request.body);
    
    return DeviceToken.fromString(request.deviceToken);
  }

  /**
   * @description Sends push notification via FCM
   * @param {string} deviceToken - Device token
   * @param {SendPushRequest} request - Push request
   * @returns {Promise<SendPushResult>} Send result
   * @throws {pushSendFailed} When FCM client not configured or send fails
   */
  private async sendViaFcm(deviceToken: string, request: SendPushRequest): Promise<SendPushResult> {
    if (!this.fcmClient) {
      throw pushSendFailed('FCM client is not configured');
    }

    const fcmMessage: FcmMessage = {
      token: deviceToken,
      notification: {
        title: request.title,
        body: request.body,
        sound: request.sound,
      },
      data: request.data ? this.convertDataToFcmFormat(request.data) : undefined,
      android: {
        priority: request.priority === PushPriority.HIGH ? 'high' : 'normal',
      },
    };

    const result = await this.fcmClient.send(fcmMessage);

    if (!result.success) {
      throw pushSendFailed(result.error?.message || 'FCM send failed');
    }

    return {
      messageId: result.messageId,
      sentAt: new Date(),
      deviceToken,
    };
  }

  /**
   * @description Sends push notification via APNS
   * @param {string} deviceToken - Device token
   * @param {SendPushRequest} request - Push request
   * @returns {Promise<SendPushResult>} Send result
   * @throws {pushSendFailed} When APNS client not configured or send fails
   */
  private async sendViaApns(deviceToken: string, request: SendPushRequest): Promise<SendPushResult> {
    if (!this.apnsClient) {
      throw pushSendFailed('APNS client is not configured');
    }

    const apnsNotification: ApnsNotification = {
      deviceToken,
      aps: {
        alert: {
          title: request.title,
          body: request.body,
        },
        badge: request.badge,
        sound: request.sound,
        'content-available': 1,
      },
      data: request.data,
    };

    const result = await this.apnsClient.send(apnsNotification);

    if (!result.sent) {
      throw pushSendFailed(result.response?.reason || 'APNS send failed');
    }

    return {
      messageId: `apns-${Date.now()}-${deviceToken.substring(0, 8)}`,
      sentAt: new Date(),
      deviceToken,
    };
  }

  /**
   * @description Converts data object to FCM format (all values must be strings)
   * @param {Record<string, unknown>} data - Data object
   * @returns {Record<string, string>} FCM-formatted data
   */
  private convertDataToFcmFormat(data: Record<string, unknown>): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = typeof value === 'string' ? value : JSON.stringify(value);
    }
    return result;
  }

  /**
   * @description Handles push notification-specific errors and maps them to domain errors
   * @param {unknown} error - The error to handle
   * @param {string} operation - The operation that failed (for context)
   * @param {string} recipient - The recipient involved in the operation
   */
  private handlePushError(error: unknown, operation: string, recipient: string): never {
    return mapPushServiceError(error, operation, recipient);
  }
}

