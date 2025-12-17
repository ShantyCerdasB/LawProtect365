/**
 * @fileoverview SendSmsRequest - Request type for sending SMS
 * @summary Defines the structure for SMS sending requests
 * @description Type definitions for SMS sending operations via Pinpoint
 */

/**
 * Request structure for sending an SMS via Pinpoint
 */
export interface SendSmsRequest {
  phoneNumber: string;
  message: string;
  senderId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Result structure for SMS sending operations
 */
export interface SendSmsResult {
  messageId: string;
  sentAt: Date;
  phoneNumber: string;
}

