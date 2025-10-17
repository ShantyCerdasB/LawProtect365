/**
 * @fileoverview UserRole - Local enum that matches Prisma schema
 * @summary Defines user roles that match the Prisma database schema
 * @description This enum provides type-safe user role values that match
 * the Prisma UserRole enum in the database schema.
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
  SUPER_ADMIN = 'SUPER_ADMIN',
  /** External user - for external integrations */
  EXTERNAL_USER = 'EXTERNAL_USER'
}
