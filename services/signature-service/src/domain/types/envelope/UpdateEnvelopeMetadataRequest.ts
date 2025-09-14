/**
 * @fileoverview UpdateEnvelopeMetadataRequest type - Defines request structure for updating envelope metadata
 * @summary Type definition for envelope metadata update requests
 * @description The UpdateEnvelopeMetadataRequest interface defines the data structure required for
 * updating existing envelope metadata in the system.
 */

/**
 * Request to update envelope metadata
 */
export interface UpdateEnvelopeMetadataRequest {
  /**
   * Optional title update
   */
  title?: string;

  /**
   * Optional description update
   */
  description?: string;

  /**
   * Optional expiration date update
   */
  expiresAt?: Date;

  /**
   * Optional custom fields update
   */
  customFields?: {
    [key: string]: string | number | boolean;
  };

  /**
   * Optional tags update
   */
  tags?: string[];


  /**
   * Optional reminder settings update
   */
  reminders?: {
    daysBeforeExpiration?: number;
    firstReminderDays?: number;
    secondReminderDays?: number;
  };
}
