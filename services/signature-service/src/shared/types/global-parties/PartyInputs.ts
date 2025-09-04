/**
 * @file PartyInputs.ts
 * @summary Input types for Global Party operations
 * @description Common input interfaces for party-related operations
 */

import type { TenantId } from "../../../domain/value-objects/Ids";

/**
 * @summary Input for finding or creating a party for delegation
 * @description Contains the necessary information to locate or create a party record
 */
export interface FindOrCreatePartyInput {
  /** Tenant identifier for the party */
  readonly tenantId: TenantId;
  /** Email address of the party */
  readonly email: string;
  /** Full name of the party */
  readonly name: string;
}
