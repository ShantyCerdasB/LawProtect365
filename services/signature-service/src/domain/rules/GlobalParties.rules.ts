/**
 * @file GlobalParties.rules.ts
 * @summary Domain rules for global parties (address book)
 * @description Domain rules and validation logic for global party management.
 * These rules ensure data integrity and business logic for the address book functionality.
 */

import type { GlobalParty } from "../entities/GlobalParty";
import type { PartyId, TenantId } from "../value-objects/Ids";
import type { PartyEmail } from "../value-objects/party/PartyEmail";
import type { PartyPhone } from "../value-objects/party/PartyPhone";
import type { PartyMetadata } from "../value-objects/party/PartyMetadata";
import type { GlobalPartyRepository } from "../ports/GlobalPartyRepository";
import { PARTY_ROLES, PARTY_SOURCES, DELEGATION_TYPES } from "../values/enums";
import { badRequest, partyNotFound, invalidPartyState } from "../../errors";

/**
 * Validates that a party email is unique within a tenant for global parties.
 * 
 * @param email - The email to validate
 * @param tenantId - The tenant ID
 * @param partyRepo - The global party repository
 * @param excludePartyId - Optional party ID to exclude from uniqueness check (for updates)
 * @throws {BadRequestError} When email already exists for another party in the tenant
 */
export const assertUniqueEmailInTenant = async (
  email: PartyEmail,
  tenantId: TenantId,
  partyRepo: GlobalPartyRepository,
  excludePartyId?: PartyId
): Promise<void> => {
  const existingParty = await partyRepo.findByEmail(email, tenantId);
  
  if (existingParty && (!excludePartyId || existingParty.id !== excludePartyId)) {
    throw badRequest(`Party with email ${email} already exists in this tenant`);
  }
};

/**
 * Validates that a party exists and belongs to the specified tenant.
 * 
 * @param partyId - The party ID to validate
 * @param tenantId - The tenant ID
 * @param partyRepo - The global party repository
 * @returns The validated party
 * @throws {PartyNotFoundError} When party doesn't exist
 * @throws {BadRequestError} When party doesn't belong to tenant
 */
export const assertPartyExistsAndBelongsToTenant = async (
  partyId: PartyId,
  tenantId: TenantId,
  partyRepo: GlobalPartyRepository
): Promise<GlobalParty> => {
  const party = await partyRepo.getById(partyId);
  
  if (!party) {
    throw partyNotFound();
  }
  
  if (party.tenantId !== tenantId) {
    throw badRequest("Party does not belong to this tenant");
  }
  
  return party;
};

/**
 * Validates that a party is in an active state for operations.
 * 
 * @param party - The party to validate
 * @throws {InvalidPartyStateError} When party is not active
 */
export const assertPartyIsActive = (party: GlobalParty): void => {
  if (party.status !== "active") {
    throw invalidPartyState(`Party is not active (status: ${party.status})`);
  }
};

/**
 * Validates party metadata size and structure.
 * 
 * @param metadata - The metadata to validate
 * @throws {BadRequestError} When metadata is too large or invalid
 */
export const assertValidPartyMetadata = (metadata: PartyMetadata): void => {
  const jsonSize = JSON.stringify(metadata).length;
  if (jsonSize > 10000) { // 10KB limit
    throw badRequest("Party metadata too large (max 10KB)");
  }
};

/**
 * Validates notification preferences structure.
 * 
 * @param preferences - The notification preferences to validate
 * @throws {BadRequestError} When preferences are invalid
 */
export const assertValidNotificationPreferences = (preferences: {
  email: boolean;
  sms: boolean;
}): void => {
  if (typeof preferences.email !== "boolean") {
    throw badRequest("Email notification preference must be a boolean");
  }
  
  if (typeof preferences.sms !== "boolean") {
    throw badRequest("SMS notification preference must be a boolean");
  }
  
  // At least one notification method should be enabled
  if (!preferences.email && !preferences.sms) {
    throw badRequest("At least one notification method must be enabled");
  }
};

/**
 * Validates phone number format for USA.
 * 
 * @param phone - The phone number to validate
 * @throws {BadRequestError} When phone number format is invalid
 */
export const assertValidUsaPhoneNumber = (phone: PartyPhone): void => {
  // Phone validation is handled by the PartyPhone value object
  // This rule ensures additional business logic if needed
  if (!phone || phone.length < 10) {
    throw badRequest("Phone number must be at least 10 digits");
  }
};

/**
 * Validates delegation parameters for global parties.
 * 
 * @param originalPartyId - The original party ID
 * @param delegateEmail - The delegate email
 * @param reason - The delegation reason
 * @param type - The delegation type
 * @param expiresAt - Optional expiration date
 * @throws {BadRequestError} When delegation parameters are invalid
 */
export const assertValidDelegation = (
  originalPartyId: PartyId,
  delegateEmail: PartyEmail,
  reason: string,
  type: typeof DELEGATION_TYPES[number],
  expiresAt?: string
): void => {
  if (!originalPartyId) {
    throw badRequest("Original party ID is required");
  }
  
  if (!delegateEmail) {
    throw badRequest("Delegate email is required");
  }
  
  if (!reason || reason.trim().length === 0) {
    throw badRequest("Delegation reason is required");
  }
  
  if (reason.length > 500) {
    throw badRequest("Delegation reason too long (max 500 characters)");
  }
  
  if (!DELEGATION_TYPES.includes(type)) {
    throw badRequest(`Invalid delegation type. Must be one of: ${DELEGATION_TYPES.join(", ")}`);
  }
  
  if (type === "temporary" && !expiresAt) {
    throw badRequest("Expiration date is required for temporary delegations");
  }
  
  if (expiresAt) {
    const expirationDate = new Date(expiresAt);
    const now = new Date();
    
    if (isNaN(expirationDate.getTime())) {
      throw badRequest("Invalid expiration date format");
    }
    
    if (expirationDate <= now) {
      throw badRequest("Expiration date must be in the future");
    }
  }
};

/**
 * Validates that a party can be deleted (no active delegations, etc.).
 * 
 * @param party - The party to validate for deletion
 * @param partyRepo - The global party repository
 * @throws {BadRequestError} When party cannot be deleted
 */
export const assertPartyCanBeDeleted = async (
  party: GlobalParty,
  partyRepo: GlobalPartyRepository
): Promise<void> => {
  // Check if party has active delegations
  const activeDelegations = await partyRepo.findActiveDelegations(party.id as PartyId);
  
  if (activeDelegations.length > 0) {
    throw badRequest("Cannot delete party with active delegations");
  }
  
  // Additional business rules can be added here
  // For example: check if party is referenced in active envelopes
};

/**
 * Validates search parameters for listing parties.
 * 
 * @param search - Optional search term
 * @param role - Optional role filter
 * @param source - Optional source filter
 * @throws {BadRequestError} When search parameters are invalid
 */
export const assertValidSearchParameters = (
  search?: string,
  role?: typeof PARTY_ROLES[number],
  source?: typeof PARTY_SOURCES[number]
): void => {
  if (search && search.trim().length < 2) {
    throw badRequest("Search term must be at least 2 characters");
  }
  
  if (role && !PARTY_ROLES.includes(role)) {
    throw badRequest(`Invalid role filter. Must be one of: ${PARTY_ROLES.join(", ")}`);
  }
  
  if (source && !PARTY_SOURCES.includes(source)) {
    throw badRequest(`Invalid source filter. Must be one of: ${PARTY_SOURCES.join(", ")}`);
  }
};
