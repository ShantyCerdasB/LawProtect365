/**
 * @file GlobalPartyRepositoryPort.ts
 * @summary Port interface for global party repository operations
 * @description Defines the contract for global party repository implementations
 */

import type { TenantId, PartyId } from "../../../../domain/value-objects/Ids";
import type { GlobalPartyStatus, PartyType } from "../../../../domain/values/enums";

/**
 * Input for creating a new global party
 */
export interface GlobalPartyCreateInput {
  partyId: PartyId;
  tenantId: TenantId;
  email: string;
  name: string;
  type: PartyType;
  status: GlobalPartyStatus;
  metadata?: Record<string, unknown>;
}

/**
 * Port interface for global party repository operations
 */
export interface GlobalPartyRepositoryPort {
  /**
   * Finds a party by email in the specified tenant
   */
  findByEmail(input: { 
    tenantId: TenantId; 
    email: string 
  }): Promise<{ partyId: PartyId } | null>;

  /**
   * Creates a new global party
   */
  create(input: GlobalPartyCreateInput): Promise<void>;
}
