/**
 * @fileoverview FcmClient - Client for Firebase Cloud Messaging
 * @summary Handles FCM API interactions for push notifications
 * @description Wraps Firebase Admin SDK to send push notifications to Android and iOS devices.
 * This client handles FCM-specific operations and error mapping.
 */

import * as admin from 'firebase-admin';
import type { FcmMessage, FcmData, FcmSendResult } from '../../../domain/types/push';
import { pushSendFailed, invalidRecipient } from '../../../notification-errors';
import { mapFcmError } from '../../error-mappers';

/**
 * FCM client for sending push notifications
 * 
 * Handles initialization of Firebase Admin SDK and sending messages
 * to Android and iOS devices via Firebase Cloud Messaging.
 */
export class FcmClient {
  private readonly messaging: admin.messaging.Messaging;

  constructor(serviceAccountKey: string | object, projectId?: string) {
    try {
      const credential = typeof serviceAccountKey === 'string'
        ? admin.credential.cert(JSON.parse(serviceAccountKey))
        : admin.credential.cert(serviceAccountKey);

      if (!admin.apps.length) {
        admin.initializeApp({
          credential,
          projectId,
        });
      }

      this.messaging = admin.messaging();
    } catch (error) {
      throw pushSendFailed(`Failed to initialize FCM client: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * @description Sends a push notification via FCM
   * @param {FcmMessage} message - FCM message to send
   * @returns {Promise<FcmSendResult>} Send result with message ID
   * @throws {BadRequestError} When message validation fails
   * @throws {pushSendFailed} When FCM operation fails
   */
  async send(message: FcmMessage): Promise<FcmSendResult> {
    try {
      if (!message.token || message.token.trim().length === 0) {
        throw invalidRecipient('FCM device token is required');
      }

      const fcmMessage: admin.messaging.Message = {
        token: message.token,
        notification: message.notification ? {
          title: message.notification.title,
          body: message.notification.body,
          imageUrl: message.notification.imageUrl,
        } : undefined,
        data: message.data ? this.convertDataToFcmFormat(message.data) : undefined,
        android: message.android ? {
          priority: message.android.priority === 'high' ? 'high' : 'normal',
          ttl: message.android.ttl,
          collapseKey: message.android.collapseKey,
        } : undefined,
        apns: message.apns ? {
          headers: message.apns.headers,
          payload: message.apns.payload ? {
            aps: message.apns.payload.aps || {},
          } : undefined,
        } : undefined,
      };

      const response = await this.messaging.send(fcmMessage);

      return {
        messageId: response,
        success: true,
      };
    } catch (error) {
      return this.handleFcmError(error, message.token);
    }
  }

  /**
   * @description Sends bulk push notifications via FCM
   * @param {FcmMessage[]} messages - Array of FCM messages
   * @returns {Promise<FcmSendResult[]>} Array of send results
   */
  async sendBulk(messages: FcmMessage[]): Promise<FcmSendResult[]> {
    const results: FcmSendResult[] = [];

    for (const message of messages) {
      try {
        const result = await this.send(message);
        results.push(result);
      } catch (error) {
        results.push({
          messageId: '',
          success: false,
          error: {
            code: 'UNKNOWN',
            message: error instanceof Error ? error.message : String(error),
          },
        });
      }
    }

    return results;
  }

  /**
   * @description Converts data object to FCM format (all values must be strings)
   * @param {FcmData} data - Data object
   * @returns {Record<string, string>} FCM-formatted data
   */
  private convertDataToFcmFormat(data: FcmData): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = String(value);
    }
    return result;
  }

  /**
   * @description Handles FCM-specific errors and maps them to domain errors
   * @param {unknown} error - The error to handle
   * @param {string} deviceToken - Device token involved in the operation
   * @returns {FcmSendResult} Error result
   * @throws {pushSendFailed} When error cannot be handled gracefully
   */
  private handleFcmError(error: unknown, deviceToken: string): never {
    return mapFcmError(error, deviceToken, 'FcmClient.send');
  }
}

