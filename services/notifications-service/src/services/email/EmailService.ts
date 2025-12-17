/**
 * @fileoverview EmailService - Service for email operations via SES
 * @summary Handles only SES email sending operations
 * @description This service is responsible ONLY for email sending operations using AWS SES.
 * It does not handle persistence, validation, or business logic - those are handled by other services.
 * This service focuses solely on the SES API interactions and error handling.
 */

import { SESClient, SendEmailCommand, type Message, type SendEmailCommandOutput } from '@aws-sdk/client-ses';
import { mapAwsError, BadRequestError, Email } from '@lawprotect/shared-ts';
import type { SendEmailRequest, SendEmailResult } from '../../domain/types/email';
import { emailSendFailed } from '../../notification-errors';
import { NotificationValidationRules } from '../../domain/rules';

/**
 * EmailService - Service for email operations only
 * 
 * This service handles ONLY email sending operations using AWS SES.
 * It does not handle:
 * - Persistence (handled by repositories)
 * - Business logic validation (handled by entities and other services)
 * - Template rendering (handled by template services)
 * - Retry logic (handled by application services)
 * 
 * Responsibilities:
 * - Send emails via SES
 * - Send bulk emails via SES
 * - Handle SES-specific errors
 * - Validate email addresses
 */
export class EmailService {
  constructor(
    private readonly sesClient: SESClient,
    private readonly defaultFromEmail: string,
    private readonly defaultReplyToEmail: string,
    private readonly defaultConfigurationSet?: string
  ) {}

  /**
   * @description Sends a single email via SES
   * @param {SendEmailRequest} request - The email sending request
   * @returns {Promise<SendEmailResult>} Promise with message ID and sent timestamp
   * @throws {BadRequestError} When request validation fails
   * @throws {emailSendFailed} When SES operation fails
   */
  async sendEmail(request: SendEmailRequest): Promise<SendEmailResult> {
    try {
      const recipients = this.validateAndNormalizeRecipients(request.to);
      const message = this.buildMessage(request);
      const command = this.buildSendEmailCommand(request, recipients, message);
      const result = await this.sesClient.send(command) as SendEmailCommandOutput;

      if (!result.MessageId) {
        throw emailSendFailed('SES did not return a message ID');
      }

      return {
        messageId: result.MessageId,
        sentAt: new Date(),
        recipient: request.to,
      };
    } catch (error) {
      this.handleSesError(error, 'sendEmail', request.to);
    }
  }

  /**
   * @description Sends bulk emails via SES (sends individually for simplicity)
   * @param {SendEmailRequest[]} requests - Array of email sending requests
   * @returns {Promise<SendEmailResult[]>} Promise with array of results
   * @throws {BadRequestError} When request validation fails
   * @throws {emailSendFailed} When SES operation fails
   */
  async sendBulkEmail(requests: SendEmailRequest[]): Promise<SendEmailResult[]> {
    NotificationValidationRules.validateRequestArray(requests, 'Email request');

    const results: SendEmailResult[] = [];
    
    for (const request of requests) {
      try {
        const result = await this.sendEmail(request);
        results.push(result);
      } catch (error) {
        results.push({
          messageId: `failed-${Date.now()}`,
          sentAt: new Date(),
          recipient: request.to,
        });
      }
    }

    return results;
  }

  /**
   * @description Validates and normalizes email recipients using Email value object
   * @param {string | string[]} to - Recipient email(s)
   * @returns {string[]} Normalized array of recipients
   * @throws {recipientRequired} When no recipients provided
   * @throws {invalidRecipient} When email is invalid
   */
  private validateAndNormalizeRecipients(to: string | string[]): string[] {
    NotificationValidationRules.validateRecipient(to, 'Email recipient');

    const recipients = Array.isArray(to) ? to : [to];
    
    return recipients.map(recipient => {
      const email = Email.fromString(recipient);
      return email.getValue();
    });
  }

  /**
   * @description Builds SES Message object
   * @param {SendEmailRequest} request - Email request
   * @returns {Message} SES Message object
   */
  private buildMessage(request: SendEmailRequest): Message {
    return {
      Subject: {
        Data: request.subject,
        Charset: 'UTF-8',
      },
      Body: {
        Text: {
          Data: request.body,
          Charset: 'UTF-8',
        },
        ...(request.htmlBody && {
          Html: {
            Data: request.htmlBody,
            Charset: 'UTF-8',
          },
        }),
      },
    };
  }

  /**
   * @description Builds SendEmailCommand
   * @param {SendEmailRequest} request - Email request
   * @param {string[]} recipients - Validated recipients
   * @param {Message} message - SES Message object
   * @returns {SendEmailCommand} SES command
   */
  private buildSendEmailCommand(request: SendEmailRequest, recipients: string[], message: Message): SendEmailCommand {
    return new SendEmailCommand({
      Source: request.from || this.defaultFromEmail,
      Destination: {
        ToAddresses: recipients,
        CcAddresses: this.normalizeAddressList(request.cc),
        BccAddresses: this.normalizeAddressList(request.bcc),
      },
      Message: message,
      ReplyToAddresses: request.replyTo ? [request.replyTo] : [this.defaultReplyToEmail],
      ConfigurationSetName: request.configurationSet || this.defaultConfigurationSet,
    });
  }

  /**
   * @description Normalizes address list (string or array to array)
   * @param {string | string[] | undefined} addresses - Address(es)
   * @returns {string[] | undefined} Normalized array or undefined
   */
  private normalizeAddressList(addresses?: string | string[]): string[] | undefined {
    if (!addresses) return undefined;
    return Array.isArray(addresses) ? addresses : [addresses];
  }


  /**
   * @description Handles SES-specific errors and maps them to domain errors
   * @param {unknown} error - The error to handle
   * @param {string} operation - The operation that failed (for context)
   * @param {string | string[]} recipient - The recipient involved in the operation
   */
  private handleSesError(error: unknown, operation: string, recipient: string | string[]): never {
    if (error instanceof BadRequestError) {
      throw error;
    }

    const recipientStr = Array.isArray(recipient) ? recipient.join(', ') : recipient;

    if (error instanceof Error) {
      if (error.message.includes('InvalidParameter') || error.message.includes('invalid') || error.message.includes('Invalid email')) {
        throw emailSendFailed(`Invalid email recipient: ${recipientStr}`);
      }
      if (error.message.includes('MessageRejected') || error.message.includes('rejected')) {
        throw emailSendFailed(`Email was rejected by SES: ${error.message}`);
      }
      if (error.message.includes('MailFromDomainNotVerified') || error.message.includes('not verified')) {
        throw emailSendFailed('SES sender domain is not verified');
      }
      if (error.message.includes('AccountSendingPausedException')) {
        throw emailSendFailed('SES account sending is paused');
      }
    }

    throw mapAwsError(error, `EmailService.${operation}`);
  }
}

