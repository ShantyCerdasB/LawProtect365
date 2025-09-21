/**
 * @fileoverview EnvelopeSortBy enum - Sort options for envelope queries
 * @summary Enum for envelope sorting field options
 * @description Defines the available fields for sorting envelope queries
 * based on the SignatureEnvelope model structure.
 */

/**
 * Envelope sort field options
 * 
 * Defines the available fields for sorting envelope queries
 * based on the SignatureEnvelope model structure from Prisma schema.
 */
export enum EnvelopeSortBy {
  /**
   * Sort by creation timestamp
   */
  CREATED_AT = 'createdAt',
  
  /**
   * Sort by last update timestamp
   */
  UPDATED_AT = 'updatedAt',
  
  /**
   * Sort by envelope title
   */
  TITLE = 'title',
  
  /**
   * Sort by envelope status
   */
  STATUS = 'status',
  
  /**
   * Sort by sent timestamp
   */
  SENT_AT = 'sentAt',
  
  /**
   * Sort by completion timestamp
   */
  COMPLETED_AT = 'completedAt',
  
  /**
   * Sort by expiration timestamp
   */
  EXPIRES_AT = 'expiresAt'
}
