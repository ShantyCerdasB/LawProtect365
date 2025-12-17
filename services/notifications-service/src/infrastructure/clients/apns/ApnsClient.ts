/**
 * @fileoverview ApnsClient - Client for Apple Push Notification Service
 * @summary Handles APNS API interactions for iOS push notifications
 * @description Wraps APNS library to send push notifications to iOS devices.
 * This client handles APNS-specific operations and error mapping.
 */

import * as apn from 'apn';
import type { ApnsNotification, ApnsSendResult, ApnsAlert } from '../../../domain/types/push';
import { pushSendFailed, invalidRecipient } from '../../../notification-errors';
import { mapApnsError } from '../../error-mappers';

/**
 * APNS client for sending push notifications to iOS devices
 * 
 * Handles initialization of APNS provider and sending notifications
 * to iOS devices via Apple Push Notification Service.
 */
export class ApnsClient {
  private readonly provider: apn.Provider;
  private readonly bundleId: string;

  constructor(config: {
    keyId: string;
    teamId: string;
    key: string | Buffer;
    bundleId: string;
    production?: boolean;
  }) {
    try {
      this.provider = new apn.Provider({
        token: {
          key: config.key,
          keyId: config.keyId,
          teamId: config.teamId,
        },
        production: config.production ?? true,
      });
      this.bundleId = config.bundleId;
    } catch (error) {
      throw pushSendFailed(`Failed to initialize APNS client: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * @description Sends a push notification via APNS
   * @param {ApnsNotification} notification - APNS notification to send
   * @returns {Promise<ApnsSendResult>} Send result
   * @throws {BadRequestError} When notification validation fails
   * @throws {pushSendFailed} When APNS operation fails
   */
  async send(notification: ApnsNotification): Promise<ApnsSendResult> {
    try {
      if (!notification.deviceToken || notification.deviceToken.trim().length === 0) {
        throw invalidRecipient('APNS device token is required');
      }

      const apnsNotification = this.buildApnsNotification(notification);

      const result = await this.provider.send(apnsNotification, notification.deviceToken);

      if (result.failed && result.failed.length > 0) {
        const failure = result.failed[0];
        return {
          sent: false,
          device: notification.deviceToken,
          status: 'failed',
          response: {
            status: 'failed',
            reason: failure.response?.reason || 'Unknown error',
          },
        };
      }

      return {
        sent: true,
        device: notification.deviceToken,
        status: 'sent',
        response: {
          status: 'sent',
        },
      };
    } catch (error) {
      return this.handleApnsError(error, notification.deviceToken);
    }
  }

  /**
   * @description Sends bulk push notifications via APNS
   * @param {ApnsNotification[]} notifications - Array of APNS notifications
   * @returns {Promise<ApnsSendResult[]>} Array of send results
   */
  async sendBulk(notifications: ApnsNotification[]): Promise<ApnsSendResult[]> {
    const results: ApnsSendResult[] = [];

    for (const notification of notifications) {
      try {
        const result = await this.send(notification);
        results.push(result);
      } catch (error) {
        results.push({
          sent: false,
          device: notification.deviceToken,
          status: 'failed',
          response: {
            status: 'failed',
            reason: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }
    }

    return results;
  }

  /**
   * @description Builds an APNS Notification object from domain notification
   * @param {ApnsNotification} notification - Domain notification
   * @returns {apn.Notification} APNS Notification instance
   */
  private buildApnsNotification(notification: ApnsNotification): apn.Notification {
    const apnsNotification = new apn.Notification();

    this.setAlert(apnsNotification, notification.aps.alert);
    this.setOptionalProperty(apnsNotification, 'badge', notification.aps.badge);
    this.setOptionalProperty(apnsNotification, 'sound', notification.aps.sound);
    this.setContentAvailable(apnsNotification, notification.aps['content-available']);
    this.setOptionalProperty(apnsNotification, 'threadId', notification.aps['thread-id']);
    this.setMutableContent(apnsNotification, notification.aps['mutable-content']);

    if (notification.data) {
      apnsNotification.payload = notification.data;
    }

    apnsNotification.topic = this.bundleId;

    return apnsNotification;
  }

  /**
   * @description Sets alert property on APNS notification
   * @param {apn.Notification} notification - APNS notification instance
   * @param {string | ApnsAlert | undefined} alert - Alert value
   */
  private setAlert(
    notification: apn.Notification,
    alert: string | ApnsAlert | undefined
  ): void {
    if (typeof alert === 'string') {
      notification.alert = alert;
    } else if (alert) {
      notification.alert = {
        title: alert.title,
        body: alert.body,
      };
    }
  }

  /**
   * @description Sets optional property on APNS notification if value is defined
   * @param {apn.Notification} notification - APNS notification instance
   * @param {keyof apn.Notification} property - Property name
   * @param {unknown} value - Property value
   */
  private setOptionalProperty(
    notification: apn.Notification,
    property: keyof apn.Notification,
    value: unknown
  ): void {
    if (value !== undefined && value !== null) {
      (notification as any)[property] = value;
    }
  }

  /**
   * @description Sets contentAvailable property from content-available flag
   * @param {apn.Notification} notification - APNS notification instance
   * @param {number | undefined} contentAvailable - Content available flag (0 or 1)
   */
  private setContentAvailable(
    notification: apn.Notification,
    contentAvailable: number | undefined
  ): void {
    if (contentAvailable !== undefined) {
      notification.contentAvailable = contentAvailable === 1;
    }
  }

  /**
   * @description Sets mutableContent property from mutable-content flag
   * @param {apn.Notification} notification - APNS notification instance
   * @param {number | undefined} mutableContent - Mutable content flag (0 or 1)
   */
  private setMutableContent(
    notification: apn.Notification,
    mutableContent: number | undefined
  ): void {
    if (mutableContent !== undefined) {
      notification.mutableContent = mutableContent === 1;
    }
  }

  /**
   * @description Handles APNS-specific errors and maps them to domain errors
   * @param {unknown} error - The error to handle
   * @param {string} deviceToken - Device token involved in the operation
   * @returns {ApnsSendResult} Error result
   * @throws {pushSendFailed} When error cannot be handled gracefully
   */
  private handleApnsError(error: unknown, deviceToken: string): never {
    return mapApnsError(error, deviceToken, 'ApnsClient.send');
  }
}

