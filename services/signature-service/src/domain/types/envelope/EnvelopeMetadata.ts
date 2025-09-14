/**
 * @fileoverview EnvelopeMetadata type - Defines envelope metadata structure
 * @summary Type definition for envelope metadata and configuration
 * @description The EnvelopeMetadata interface defines the structure for envelope metadata
 * including title, description, expiration settings, and other configuration options.
 */

/**
 * Envelope metadata structure
 */
export interface EnvelopeMetadata {
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
   * If not provided, envelope doesn't expire
   */
  expiresAt?: Date;

  /**
   * Optional custom fields for additional metadata
   */
  customFields?: {
    [key: string]: string | number | boolean;
  };

  /**
   * Optional tags for categorization
   */
  tags?: string[];

  /**
   * Optional reminder settings
   */
  reminders?: {
    /**
     * Number of days before expiration to send reminder
     */
    daysBeforeExpiration?: number;

    /**
     * Number of days after sending to send first reminder
     */
    firstReminderDays?: number;

    /**
     * Number of days after first reminder to send second reminder
     */
    secondReminderDays?: number;
  };
}