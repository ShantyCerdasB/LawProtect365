/**
 * @fileoverview AuthServiceEventSchemas - Validation schemas for auth service events
 * @summary Provides specific Zod validation schemas for each auth service event type
 * @description This module defines validation schemas for auth service events to ensure
 * type safety and data validation before processing. Each schema validates the exact fields
 * required for its specific event type, providing early error detection and documentation.
 */

import { z, NonEmptyStringSchema } from '@lawprotect/shared-ts';

/**
 * Schema for UserRegistered event payload
 * @description Validates that UserRegistered events contain required fields:
 * - email: Valid email address of the registered user
 * - firstName: Optional first name (defaults to 'User')
 * - lastName: Optional last name
 */
export const UserRegisteredEventSchema = z.object({
  email: z.string().email('email must be a valid email address'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  recipientLanguage: z.string().min(2).max(5).optional(),
  language: z.string().min(2).max(5).optional(),
}).passthrough();

/**
 * Schema for UserUpdated event payload
 * @description Validates that UserUpdated events contain:
 * - email: Valid email address of the updated user
 * - firstName: Optional first name
 * - lastName: Optional last name
 */
export const UserUpdatedEventSchema = z.object({
  email: z.string().email('email must be a valid email address'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  recipientLanguage: z.string().min(2).max(5).optional(),
  language: z.string().min(2).max(5).optional(),
}).passthrough();

/**
 * Schema for UserRoleChanged event payload
 * @description Validates that UserRoleChanged events contain required fields:
 * - email: Valid email address of the user
 * - oldRole: Previous role value
 * - newRole: New role value
 * - firstName: Optional first name
 */
export const UserRoleChangedEventSchema = z.object({
  email: z.string().email('email must be a valid email address'),
  oldRole: NonEmptyStringSchema,
  newRole: NonEmptyStringSchema,
  firstName: z.string().optional(),
  recipientLanguage: z.string().min(2).max(5).optional(),
  language: z.string().min(2).max(5).optional(),
}).passthrough();

/**
 * Schema for UserStatusChanged event payload
 * @description Validates that UserStatusChanged events contain required fields:
 * - email: Valid email address of the user
 * - oldStatus: Previous status value
 * - newStatus: New status value
 * - firstName: Optional first name
 */
export const UserStatusChangedEventSchema = z.object({
  email: z.string().email('email must be a valid email address'),
  oldStatus: NonEmptyStringSchema,
  newStatus: NonEmptyStringSchema,
  firstName: z.string().optional(),
  recipientLanguage: z.string().min(2).max(5).optional(),
  language: z.string().min(2).max(5).optional(),
}).passthrough();

/**
 * Schema for MfaStatusChanged event payload
 * @description Validates that MfaStatusChanged events contain required fields:
 * - email: Valid email address of the user
 * - mfaEnabled: Boolean indicating if MFA is enabled
 * - firstName: Optional first name
 */
export const MfaStatusChangedEventSchema = z.object({
  email: z.string().email('email must be a valid email address'),
  mfaEnabled: z.boolean(),
  firstName: z.string().optional(),
  recipientLanguage: z.string().min(2).max(5).optional(),
  language: z.string().min(2).max(5).optional(),
}).passthrough();

/**
 * Schema for generic auth service events (OAuth, Provider linked/unlinked)
 * @description Validates common fields for OAuth and provider events:
 * - email: Valid email address of the user
 * - firstName: Optional first name
 */
export const GenericAuthServiceEventSchema = z.object({
  email: z.string().email('email must be a valid email address'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  recipientLanguage: z.string().min(2).max(5).optional(),
  language: z.string().min(2).max(5).optional(),
}).passthrough();

/**
 * Type inference for auth service event schemas
 */
export type UserRegisteredEventPayload = z.infer<typeof UserRegisteredEventSchema>;
export type UserUpdatedEventPayload = z.infer<typeof UserUpdatedEventSchema>;
export type UserRoleChangedEventPayload = z.infer<typeof UserRoleChangedEventSchema>;
export type UserStatusChangedEventPayload = z.infer<typeof UserStatusChangedEventSchema>;
export type MfaStatusChangedEventPayload = z.infer<typeof MfaStatusChangedEventSchema>;
export type GenericAuthServiceEventPayload = z.infer<typeof GenericAuthServiceEventSchema>;

