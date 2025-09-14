/**
 * @fileoverview CreateEnvelopeMetadataRequest type - Defines request structure for creating envelope metadata
 * @summary Type definition for envelope metadata creation requests
 * @description The CreateEnvelopeMetadataRequest interface defines the data structure required for
 * creating new envelope metadata in the system.
 */

/**
 * Request to create envelope metadata
 */
export interface CreateEnvelopeMetadataRequest {
  /**
   * Title of the envelope/document
   */
  title: string;

  /**
   * Optional description of the envelope
   */
  description?: string;

  /**
   * Optional expiration date for the envelope
   */
  expiresAt?: Date;

  /**
   * Optional custom fields
   */
  customFields?: {
    [key: string]: string | number | boolean;
  };

  /**
   * Optional tags
   */
  tags?: string[];

  /**
   * Optional reminder settings
   */
  reminders?: {
    daysBeforeExpiration?: number;
    firstReminderDays?: number;
    secondReminderDays?: number;
  };
}
