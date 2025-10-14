/**
 * @fileoverview UserRole - Enum for user roles in the system
 * @summary Defines all possible user roles with hierarchy
 * @description This enum provides type-safe user role values for
 * authorization and access control throughout the system.
 */

export enum UserRole {
  /** User who hasn't selected a role yet */
  UNASSIGNED = 'UNASSIGNED',
  /** Regular customer user */
  CUSTOMER = 'CUSTOMER',
  /** Lawyer user with legal practice access */
  LAWYER = 'LAWYER',
  /** Administrative user with management access */
  ADMIN = 'ADMIN',
  /** Super administrator with full system access */
  SUPER_ADMIN = 'SUPER_ADMIN'
}
