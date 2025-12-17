/**
 * @fileoverview NotificationValidationRules - Domain rules for notification validation
 * @summary Validates notification business rules and content requirements
 * @description This domain rule encapsulates business validation logic for notifications,
 * ensuring content requirements and business constraints are met.
 */

import { BadRequestError } from '@lawprotect/shared-ts';
import { recipientRequired } from '../../notification-errors';

/**
 * NotificationValidationRules - Domain rules for notification validation
 * 
 * Encapsulates business validation logic for notifications including:
 * - Message content validation
 * - Subject/title validation
 * - Body validation
 */
export class NotificationValidationRules {
  /**
   * @description Validates that a message is not empty
   * @param {string} message - Message to validate
   * @param {string} fieldName - Field name for error message
   * @throws {BadRequestError} When message is empty
   */
  static validateMessageNotEmpty(message: string | undefined, fieldName: string = 'Message'): void {
    if (!message || message.trim().length === 0) {
      throw new BadRequestError(`${fieldName} cannot be empty`);
    }
  }

  /**
   * @description Validates that both title and body are provided
   * @param {string} title - Title to validate
   * @param {string} body - Body to validate
   * @throws {BadRequestError} When title or body is missing
   */
  static validateTitleAndBody(title: string | undefined, body: string | undefined): void {
    if (!title || title.trim().length === 0) {
      throw new BadRequestError('Title is required');
    }
    if (!body || body.trim().length === 0) {
      throw new BadRequestError('Body is required');
    }
  }

  /**
   * @description Validates that recipient is provided
   * @param {string | string[] | undefined} recipient - Recipient to validate
   * @param {string} fieldName - Field name for error message
   * @throws {recipientRequired} When recipient is missing
   */
  static validateRecipient(recipient: string | string[] | undefined, fieldName: string = 'Recipient'): void {
    if (!recipient || (Array.isArray(recipient) && recipient.length === 0)) {
      throw recipientRequired(`${fieldName} is required`);
    }
  }

  /**
   * @description Validates that request array is not empty
   * @param {any[]} requests - Request array to validate
   * @param {string} fieldName - Field name for error message
   * @throws {recipientRequired} When array is empty
   */
  static validateRequestArray(requests: any[] | undefined, fieldName: string = 'Requests'): void {
    if (!requests || requests.length === 0) {
      throw recipientRequired(`At least one ${fieldName.toLowerCase()} is required`);
    }
  }
}

