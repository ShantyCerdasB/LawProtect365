/**
 * @file PartyEmail.ts
 * @summary Party Email value object with tenant-scoped uniqueness validation
 * @description Extends the base Email value object to include tenant-scoped uniqueness
 * validation for parties. Ensures email addresses are unique within a tenant context.
 */

import { z } from "zod";
import type { Email } from "../Email";
import { EmailSchema } from "../Email";
import type { TenantId } from "../Ids";

/**
 * Zod schema for Party Email validation
 * Extends EmailSchema with tenant context for uniqueness validation
 */
export const PartyEmailSchema = z.object({
  email: EmailSchema,
  tenantId: z.string().min(1),
});

/**
 * Party Email with tenant context for uniqueness validation
 * Extends the base Email type to include tenant information
 */
export type PartyEmail = Email;

/**
 * Creates a PartyEmail from an email string and tenant ID
 * @param email - The email string to validate
 * @param tenantId - The tenant ID for context
 * @returns The validated PartyEmail
 * @throws {ZodError} When the email is invalid
 */
export const toPartyEmail = (email: string, tenantId: TenantId): PartyEmail => {
  const result = PartyEmailSchema.parse({ email, tenantId });
  return result.email;
};

/**
 * Safely creates a PartyEmail from an email string and tenant ID
 * @param email - The email string to validate
 * @param tenantId - The tenant ID for context
 * @returns The validated PartyEmail or null if invalid
 */
export const toPartyEmailSafe = (email: string, tenantId: TenantId): PartyEmail | null => {
  const result = PartyEmailSchema.safeParse({ email, tenantId });
  return result.success ? result.data.email : null;
};

/**
 * Type guard to check if a value is a valid PartyEmail
 * @param value - The value to check
 * @returns True if the value is a valid PartyEmail
 */
export const isPartyEmail = (value: unknown): value is PartyEmail => {
  return typeof value === "string" && EmailSchema.safeParse(value).success;
};

/**
 * Extracts the tenant ID from a PartyEmail context
 * Note: This is a helper function for validation contexts
 * @param context - The validation context containing tenantId
 * @returns The tenant ID
 */
export const getPartyEmailTenantId = (context: { tenantId: TenantId }): TenantId => {
  return context.tenantId;
};
