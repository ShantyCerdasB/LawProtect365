/**
 * @fileoverview AdminSortField - Enum for admin user sorting fields
 * @summary Defines the fields available for sorting in admin user queries
 * @description This enum defines the sortable fields for admin user listing
 * to ensure type safety and prevent invalid sort fields.
 */

export enum AdminSortField {
  CREATED_AT = 'createdAt',
  LAST_LOGIN_AT = 'lastLoginAt',
  NAME = 'name',
  EMAIL = 'email',
  ROLE = 'role',
  STATUS = 'status'
}
