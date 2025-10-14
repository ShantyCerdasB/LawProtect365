/**
 * @fileoverview MetaInfo - Interface for user metadata information
 * @summary Defines the structure for user metadata information
 * @description This interface represents user metadata information including
 * timestamps for login, creation, and updates.
 */

/**
 * User metadata information
 */
export interface MetaInfo {
  /** Last login timestamp */
  lastLoginAt: string | null;
  /** User creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
}
