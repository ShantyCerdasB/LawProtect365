/**
 * @file types.ts
 * @summary Common domain types shared across all ports
 * @description Re-exports domain IDs and enums to maintain single source of truth
 */

import type { EnvelopeStatus, PartyRole, PartyStatus, ConsentStatus, ConsentType } from "../../../../domain/values/enums";
import type { TenantId, EnvelopeId, PartyId, UserId } from "../../../../domain/value-objects/Ids";

/**
 * Re-export domain IDs to keep single source of truth for types
 */
export type { TenantId, EnvelopeId, PartyId, UserId };

/**
 * Re-export domain enums to keep single source of truth for types
 */
export type { EnvelopeStatus, PartyRole, PartyStatus, ConsentStatus, ConsentType };

/**
 * Consent ID type - using string for now since it's not defined as a branded type in domain
 */
export type ConsentId = string;
