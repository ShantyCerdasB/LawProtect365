/**
 * @fileoverview InfrastructureFactory - Factory for AWS and external infrastructure services
 * @summary Creates infrastructure components including SES and Pinpoint
 * @description Manages AWS client creation and configuration for external service dependencies.
 * This factory follows the Single Responsibility Principle by focusing exclusively on
 * infrastructure service instantiation and AWS client configuration.
 * 
 * Note: notifications-service is a consumer of EventBridge events (received via Lambda trigger),
 * not a publisher, so EventBridge clients are not needed here.
 */

import { SESClient } from '@aws-sdk/client-ses';
import { PinpointClient } from '@aws-sdk/client-pinpoint';
import { loadConfig } from '../../../config/AppConfig';
import { FcmClient } from '../../clients/fcm';
import { ApnsClient } from '../../clients/apns';

/**
 * Factory responsible for creating all infrastructure and AWS service instances.
 * Follows the Single Responsibility Principle by focusing exclusively on infrastructure creation.
 * 
 * This service only needs SES (email) and Pinpoint (SMS) clients since it consumes
 * events from EventBridge via Lambda trigger, not by reading from EventBridge directly.
 */
export class InfrastructureFactory {
  private static readonly config = loadConfig();

  /** Singleton AWS SES client for email */
  private static readonly sesClient = new SESClient({
    region: this.config.email.region,
  });

  /** Singleton AWS Pinpoint client for SMS */
  private static readonly pinpointClient = new PinpointClient({
    region: this.config.sms.region,
  });

  /**
   * @description Creates SES client for email operations
   * @returns {SESClient} Configured SESClient instance
   */
  static createSesClient(): SESClient {
    return this.sesClient;
  }

  /**
   * @description Creates Pinpoint client for SMS operations
   * @returns {PinpointClient} Configured PinpointClient instance
   */
  static createPinpointClient(): PinpointClient {
    return this.pinpointClient;
  }

  /**
   * @description Creates FCM client for push notifications
   * @returns {FcmClient | undefined} Configured FcmClient instance or undefined if not configured
   */
  static createFcmClient(): FcmClient | undefined {
    if (!this.config.push?.fcm?.serviceAccountKey) {
      return undefined;
    }

    try {
      const serviceAccountKey = JSON.parse(this.config.push.fcm.serviceAccountKey);
      return new FcmClient(serviceAccountKey, this.config.push.fcm.projectId);
    } catch {
      return new FcmClient(this.config.push.fcm.serviceAccountKey, this.config.push.fcm.projectId);
    }
  }

  /**
   * @description Creates APNS client for iOS push notifications
   * @returns {ApnsClient | undefined} Configured ApnsClient instance or undefined if not configured
   */
  static createApnsClient(): ApnsClient | undefined {
    if (!this.config.push?.apns) {
      return undefined;
    }

    return new ApnsClient({
      keyId: this.config.push.apns.keyId,
      teamId: this.config.push.apns.teamId,
      key: this.config.push.apns.key,
      bundleId: this.config.push.apns.bundleId,
      production: this.config.push.apns.production,
    });
  }

  /**
   * @description Creates all infrastructure services in a single operation
   * @returns {Object} Object containing all infrastructure service instances
   */
  static createAll() {
    return {
      sesClient: this.createSesClient(),
      pinpointClient: this.createPinpointClient(),
      fcmClient: this.createFcmClient(),
      apnsClient: this.createApnsClient(),
    };
  }
}

