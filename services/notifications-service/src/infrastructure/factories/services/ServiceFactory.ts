/**
 * @fileoverview ServiceFactory - Factory for infrastructure services
 * @summary Creates infrastructure services with their client dependencies
 * @description Manages service instantiation and dependency injection for infrastructure services.
 * This factory follows the Single Responsibility Principle by focusing exclusively on
 * service creation and dependency wiring.
 */

import { EmailService } from '../../../services/email';
import { SmsService } from '../../../services/sms';
import { PushNotificationService } from '../../../services/push';
import { InfrastructureFactory } from '../infrastructure';
import { loadConfig } from '../../../config/AppConfig';

/**
 * Factory responsible for creating all infrastructure service instances.
 * Follows the Single Responsibility Principle by focusing exclusively on service creation.
 */
export class ServiceFactory {
  private static readonly config = loadConfig();

  /**
   * @description Creates EmailService with SES client
   * @param {ReturnType<typeof InfrastructureFactory.createAll>} infrastructure - Infrastructure clients
   * @returns {EmailService} Configured EmailService instance
   */
  static createEmailService(
    infrastructure: ReturnType<typeof InfrastructureFactory.createAll>
  ): EmailService {
    return new EmailService(
      infrastructure.sesClient,
      this.config.email.fromEmail,
      this.config.email.replyToEmail,
      this.config.email.configurationSet
    );
  }

  /**
   * @description Creates SmsService with Pinpoint client
   * @param {ReturnType<typeof InfrastructureFactory.createAll>} infrastructure - Infrastructure clients
   * @returns {SmsService} Configured SmsService instance
   */
  static createSmsService(
    infrastructure: ReturnType<typeof InfrastructureFactory.createAll>
  ): SmsService {
    return new SmsService(
      infrastructure.pinpointClient,
      this.config.sms.applicationId,
      this.config.sms.senderId
    );
  }

  /**
   * @description Creates PushNotificationService with FCM and APNS clients
   * @param {ReturnType<typeof InfrastructureFactory.createAll>} infrastructure - Infrastructure clients
   * @returns {PushNotificationService} Configured PushNotificationService instance
   */
  static createPushNotificationService(
    infrastructure: ReturnType<typeof InfrastructureFactory.createAll>
  ): PushNotificationService {
    return new PushNotificationService(
      infrastructure.fcmClient,
      infrastructure.apnsClient
    );
  }

  /**
   * @description Creates all infrastructure services in a single operation
   * @param {ReturnType<typeof InfrastructureFactory.createAll>} infrastructure - Infrastructure clients
   * @returns {Object} Object containing all infrastructure service instances
   */
  static createAll(infrastructure: ReturnType<typeof InfrastructureFactory.createAll>) {
    return {
      emailService: this.createEmailService(infrastructure),
      smsService: this.createSmsService(infrastructure),
      pushNotificationService: this.createPushNotificationService(infrastructure),
    };
  }
}

