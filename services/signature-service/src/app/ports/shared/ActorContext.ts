/**
 * @file ActorContext.ts
 * @summary Shared actor context for audit and attribution purposes
 * @description Defines the common actor context interface used across app services
 * for audit trails and authorization purposes.
 */

/**
 * @description Context information about the actor performing an operation.
 * Used for audit trails and authorization purposes.
 */
export interface ActorContext {
  /** User ID of the actor (optional) */
  userId?: string;
  /** Email address of the actor (optional) */
  email?: string;
  /** IP address of the actor (optional) */
  ip?: string;
  /** User agent string of the actor (optional) */
  userAgent?: string;
  /** Locale preference of the actor (optional) */
  locale?: string;
  /** Role of the actor (optional) */
  role?: string;
}
