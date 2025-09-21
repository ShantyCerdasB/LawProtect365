/**
 * @fileoverview SignerSortBy enum - Sort options for signer queries
 * @summary Enum for signer sorting field options
 * @description Defines the available fields for sorting signer queries
 * based on the EnvelopeSigner model structure.
 */

/**
 * Signer sort field options
 * 
 * Defines the available fields for sorting signer queries
 * based on the EnvelopeSigner model structure from Prisma schema.
 */
export enum SignerSortBy {
  /**
   * Sort by signer order (position in signing sequence)
   */
  ORDER = 'order',
  
  /**
   * Sort by creation timestamp
   */
  CREATED_AT = 'createdAt',
  
  /**
   * Sort by last update timestamp
   */
  UPDATED_AT = 'updatedAt',
  
  /**
   * Sort by signer status
   */
  STATUS = 'status',
  
  /**
   * Sort by email address
   */
  EMAIL = 'email',
  
  /**
   * Sort by full name
   */
  FULL_NAME = 'fullName',
  
  /**
   * Sort by signed timestamp
   */
  SIGNED_AT = 'signedAt',
  
  /**
   * Sort by declined timestamp
   */
  DECLINED_AT = 'declinedAt'
}
