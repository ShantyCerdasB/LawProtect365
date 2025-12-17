/**
 * @fileoverview SmsService - Service for SMS operations via Pinpoint
 * @summary Handles only Pinpoint SMS sending operations
 * @description This service is responsible ONLY for SMS sending operations using AWS Pinpoint.
 * It does not handle persistence, validation, or business logic - those are handled by other services.
 * This service focuses solely on the Pinpoint API interactions and error handling.
 */

import {
  PinpointClient,
  SendMessagesCommand,
  type MessageRequest,
  type SMSMessage,
  type AddressConfiguration,
} from '@aws-sdk/client-pinpoint';
import { mapAwsError, BadRequestError } from '@lawprotect/shared-ts';
import type { SendSmsRequest, SendSmsResult } from '../../domain/types/sms';
import { smsSendFailed } from '../../notification-errors';
import { PhoneNumber } from '../../domain/value-objects/PhoneNumber';
import { NotificationValidationRules } from '../../domain/rules';

/**
 * SmsService - Service for SMS operations only
 * 
 * This service handles ONLY SMS sending operations using AWS Pinpoint.
 * It does not handle:
 * - Persistence (handled by repositories)
 * - Business logic validation (handled by entities and other services)
 * - Template rendering (handled by template services)
 * - Retry logic (handled by application services)
 * 
 * Responsibilities:
 * - Send SMS via Pinpoint
 * - Send bulk SMS via Pinpoint
 * - Handle Pinpoint-specific errors
 * - Validate phone numbers
 */
export class SmsService {
  constructor(
    private readonly pinpointClient: PinpointClient,
    private readonly applicationId: string,
    private readonly defaultSenderId?: string
  ) {}

  /**
   * @description Sends a single SMS via Pinpoint
   * @param {SendSmsRequest} request - The SMS sending request
   * @returns {Promise<SendSmsResult>} Promise with message ID and sent timestamp
   * @throws {BadRequestError} When request validation fails
   * @throws {smsSendFailed} When Pinpoint operation fails
   */
  async sendSms(request: SendSmsRequest): Promise<SendSmsResult> {
    try {
      const phoneNumber = this.validateSmsRequest(request);
      const messageRequest = this.buildMessageRequest(request, phoneNumber);
      const command = this.buildSendCommand(messageRequest);
      const result = await this.pinpointClient.send(command);
      return this.extractSmsResult(result, phoneNumber.getValue());
    } catch (error) {
      this.handlePinpointError(error, 'sendSms', request.phoneNumber);
    }
  }

  /**
   * @description Sends bulk SMS via Pinpoint
   * @param {SendSmsRequest[]} requests - Array of SMS sending requests
   * @returns {Promise<SendSmsResult[]>} Promise with array of results
   * @throws {BadRequestError} When request validation fails
   * @throws {smsSendFailed} When Pinpoint operation fails
   */
  async sendBulkSms(requests: SendSmsRequest[]): Promise<SendSmsResult[]> {
    NotificationValidationRules.validateRequestArray(requests, 'SMS request');

    const addresses = this.buildBulkAddresses(requests);
    const messageRequest = this.buildBulkMessageRequest(requests, addresses);
    const command = this.buildSendCommand(messageRequest);
    const result = await this.pinpointClient.send(command);
    return this.extractBulkSmsResults(result, requests);
  }

  /**
   * @description Validates SMS request using value objects and domain rules
   * @param {SendSmsRequest} request - SMS request to validate
   * @returns {PhoneNumber} Validated phone number value object
   * @throws {recipientRequired} When phone number is missing
   * @throws {invalidRecipient} When phone number is invalid
   * @throws {BadRequestError} When message is empty
   */
  private validateSmsRequest(request: SendSmsRequest): PhoneNumber {
    NotificationValidationRules.validateRecipient(request.phoneNumber, 'SMS phone number');
    NotificationValidationRules.validateMessageNotEmpty(request.message, 'SMS message');
    
    return PhoneNumber.fromString(request.phoneNumber);
  }

  /**
   * @description Builds SMS message object
   * @param {SendSmsRequest} request - SMS request
   * @returns {SMSMessage} SMS message
   */
  private buildSmsMessage(request: SendSmsRequest): SMSMessage {
    return {
      Body: request.message,
      MessageType: 'TRANSACTIONAL',
      OriginationNumber: request.senderId || this.defaultSenderId,
    };
  }

  /**
   * @description Builds Pinpoint message request for single SMS
   * @param {SendSmsRequest} request - SMS request
   * @param {PhoneNumber} phoneNumber - Validated phone number value object
   * @returns {MessageRequest} Pinpoint message request
   */
  private buildMessageRequest(request: SendSmsRequest, phoneNumber: PhoneNumber): MessageRequest {
    const smsMessage = this.buildSmsMessage(request);
    return {
      Addresses: {
        [phoneNumber.getValue()]: {
          ChannelType: 'SMS',
        },
      },
      MessageConfiguration: {
        SMSMessage: smsMessage,
      },
    };
  }

  /**
   * @description Builds addresses map for bulk SMS
   * @param {SendSmsRequest[]} requests - SMS requests
   * @returns {Record<string, AddressConfiguration>} Addresses map
   */
  private buildBulkAddresses(requests: SendSmsRequest[]): Record<string, AddressConfiguration> {
    const addresses: Record<string, AddressConfiguration> = {};
    
    for (const request of requests) {
      const phoneNumber = this.validateSmsRequest(request);
      addresses[phoneNumber.getValue()] = {
        ChannelType: 'SMS',
      };
    }

    return addresses;
  }

  /**
   * @description Builds Pinpoint message request for bulk SMS
   * @param {SendSmsRequest[]} requests - SMS requests
   * @param {Record<string, AddressConfiguration>} addresses - Addresses map
   * @returns {MessageRequest} Pinpoint message request
   */
  private buildBulkMessageRequest(
    requests: SendSmsRequest[],
    addresses: Record<string, AddressConfiguration>
  ): MessageRequest {
    const smsMessage = this.buildSmsMessage(requests[0]);
    return {
      Addresses: addresses,
      MessageConfiguration: {
        SMSMessage: smsMessage,
      },
    };
  }

  /**
   * @description Builds SendMessagesCommand
   * @param {MessageRequest} messageRequest - Pinpoint message request
   * @returns {SendMessagesCommand} Pinpoint command
   */
  private buildSendCommand(messageRequest: MessageRequest): SendMessagesCommand {
    return new SendMessagesCommand({
      ApplicationId: this.applicationId,
      MessageRequest: messageRequest,
    });
  }

  /**
   * @description Extracts SMS result from Pinpoint response
   * @param {any} result - Pinpoint response
   * @param {string} phoneNumber - Phone number
   * @returns {SendSmsResult} SMS result
   * @throws {smsSendFailed} When response is invalid
   */
  private extractSmsResult(result: any, phoneNumber: string): SendSmsResult {
    const messageResponse = result.MessageResponse;
    if (!messageResponse || !messageResponse.Result) {
      throw smsSendFailed('Pinpoint did not return a valid response');
    }

    const phoneResult = messageResponse.Result[phoneNumber];
    if (!phoneResult || !phoneResult.MessageId) {
      throw smsSendFailed(`Failed to send SMS to ${phoneNumber}`);
    }

    return {
      messageId: phoneResult.MessageId,
      sentAt: new Date(),
      phoneNumber,
    };
  }

  /**
   * @description Extracts bulk SMS results from Pinpoint response
   * @param {any} result - Pinpoint response
   * @param {SendSmsRequest[]} requests - Original SMS requests
   * @returns {SendSmsResult[]} Array of SMS results
   */
  private extractBulkSmsResults(result: any, requests: SendSmsRequest[]): SendSmsResult[] {
    const messageResponse = result.MessageResponse;
    if (!messageResponse || !messageResponse.Result) {
      throw smsSendFailed('Pinpoint bulk SMS did not return a valid response');
    }

    return requests.map((request) => {
      const phoneResult = messageResponse.Result[request.phoneNumber];
      return {
        messageId: phoneResult?.MessageId || `failed-${request.phoneNumber}`,
        sentAt: new Date(),
        phoneNumber: request.phoneNumber,
      };
    });
  }

  /**
   * @description Handles Pinpoint-specific errors and maps them to domain errors
   * @param {unknown} error - The error to handle
   * @param {string} operation - The operation that failed (for context)
   * @param {string} recipient - The recipient involved in the operation
   */
  private handlePinpointError(error: unknown, operation: string, recipient: string): never {
    if (error instanceof BadRequestError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.message.includes('InvalidParameter') || error.message.includes('invalid') || error.message.includes('Invalid phone number')) {
        throw smsSendFailed(`Invalid phone number: ${recipient}`);
      }
      if (error.message.includes('NotFoundException') || error.message.includes('not found')) {
        throw smsSendFailed('Pinpoint application not found');
      }
      if (error.message.includes('ForbiddenException') || error.message.includes('forbidden')) {
        throw smsSendFailed('Pinpoint permissions denied');
      }
      if (error.message.includes('TooManyRequestsException')) {
        throw smsSendFailed('Pinpoint rate limit exceeded');
      }
    }

    throw mapAwsError(error, `SmsService.${operation}`);
  }
}

