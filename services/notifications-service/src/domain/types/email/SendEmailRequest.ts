/**
 * @fileoverview SendEmailRequest - Request type for sending emails
 * @summary Defines the structure for email sending requests
 * @description Type definitions for email sending operations via SES
 */

/**
 * Request structure for sending an email via SES
 */
export interface SendEmailRequest {
  to: string | string[];
  subject: string;
  body: string;
  htmlBody?: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  configurationSet?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Result structure for email sending operations
 */
export interface SendEmailResult {
  messageId: string;
  sentAt: Date;
  recipient: string | string[];
}

