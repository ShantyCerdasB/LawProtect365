/**
 * @file GlobalPartyValidations.ts
 * @summary Shared validation functions for global party use cases
 * @description Common validation logic used across multiple global party use cases
 * to eliminate code duplication and maintain consistency.
 */

import { badRequest } from "../../errors";

/**
 * Validates that a required string field is present and not empty
 * @param value - The value to validate
 * @param fieldName - The name of the field for error messages
 * @throws {BadRequestError} When validation fails
 */
export function validateRequiredString(value: string | undefined | null, fieldName: string): void {
  if (!value?.trim()) {
    throw badRequest(`${fieldName} is required`);
  }
}

/**
 * Validates notification preferences object
 * @param preferences - The notification preferences to validate
 * @throws {BadRequestError} When validation fails
 */
export function validateNotificationPreferences(preferences: any): void {
  if (!preferences) return;

  if (typeof preferences.email !== "boolean") {
    throw badRequest("Email notification preference must be a boolean");
  }
  if (typeof preferences.sms !== "boolean") {
    throw badRequest("SMS notification preference must be a boolean");
  }
}

/**
 * Validates that at least one update field is provided
 * @param updates - The updates object to validate
 * @throws {BadRequestError} When validation fails
 */
export function validateUpdateFields(updates: any): void {
  if (!updates || Object.keys(updates).length === 0) {
    throw badRequest("At least one field must be provided for update");
  }
}

/**
 * Validates tenant ID and party ID for operations that require both
 * @param tenantId - The tenant ID to validate
 * @param partyId - The party ID to validate
 * @throws {BadRequestError} When validation fails
 */
export function validateTenantAndPartyIds(tenantId: string | undefined | null, partyId: string | undefined | null): void {
  validateRequiredString(tenantId, "Tenant ID");
  validateRequiredString(partyId, "Party ID");
}

/**
 * Validates basic party creation fields
 * @param tenantId - The tenant ID to validate
 * @param email - The email to validate
 * @param name - The name to validate
 * @param role - The role to validate
 * @param notificationPreferences - The notification preferences to validate
 * @throws {BadRequestError} When validation fails
 */
export function validatePartyCreationFields(
  tenantId: string | undefined | null,
  email: string | undefined | null,
  name: string | undefined | null,
  role: string | undefined | null,
  notificationPreferences?: any
): void {
  validateRequiredString(tenantId, "Tenant ID");
  validateRequiredString(email, "Email");
  validateRequiredString(name, "Name");
  validateRequiredString(role, "Role");
  validateNotificationPreferences(notificationPreferences);
}

/**
 * Validates party update fields
 * @param tenantId - The tenant ID to validate
 * @param partyId - The party ID to validate
 * @param updates - The updates object to validate
 * @throws {BadRequestError} When validation fails
 */
export function validatePartyUpdateFields(
  tenantId: string | undefined | null,
  partyId: string | undefined | null,
  updates: any
): void {
  validateTenantAndPartyIds(tenantId, partyId);
  validateUpdateFields(updates);

  if (updates.name !== undefined) {
    validateRequiredString(updates.name, "Name");
  }

  if (updates.role !== undefined) {
    validateRequiredString(updates.role, "Role");
  }

  validateNotificationPreferences(updates.notificationPreferences);
}

/**
 * Validates delegation creation fields
 * @param tenantId - The tenant ID to validate
 * @param originalPartyId - The original party ID to validate
 * @param delegateEmail - The delegate email to validate
 * @param delegateName - The delegate name to validate
 * @param reason - The reason to validate
 * @param type - The type to validate
 * @throws {BadRequestError} When validation fails
 */
export function validateDelegationCreationFields(
  tenantId: string | undefined | null,
  originalPartyId: string | undefined | null,
  delegateEmail: string | undefined | null,
  delegateName: string | undefined | null,
  reason: string | undefined | null,
  type: string | undefined | null
): void {
  validateTenantAndPartyIds(tenantId, originalPartyId);
  validateRequiredString(delegateEmail, "Delegate email");
  validateRequiredString(delegateName, "Delegate name");
  validateRequiredString(reason, "Delegation reason");
  validateRequiredString(type, "Delegation type");
}
