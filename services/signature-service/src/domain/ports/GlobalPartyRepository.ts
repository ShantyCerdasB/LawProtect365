/**
 * @file GlobalPartyRepository.ts
 * @summary Domain port for global party repository operations
 * @description Defines the contract for global party (address book) repository operations.
 * This port is used by domain rules and use cases for global party management.
 */

import type { GlobalParty } from "../entities/GlobalParty";
import type { PartyId, TenantId } from "../value-objects/Ids";
import type { PartyEmail } from "../value-objects/party/PartyEmail";
import type { PartyMetadata } from "../value-objects/party/PartyMetadata";
import type { DelegationRecord } from "../value-objects/party/DelegationRecord";

/**
 * Query parameters for listing global parties
 */
export interface ListGlobalPartiesQuery {
  tenantId: TenantId;
  limit?: number;
  cursor?: string;
  search?: string;
  role?: string;
  source?: string;
}

/**
 * Result page for listing global parties
 */
export interface ListGlobalPartiesResult {
  parties: GlobalParty[];
  nextCursor?: string;
  total?: number;
}

/**
 * Domain port for global party repository operations
 */
export interface GlobalPartyRepository {
  /**
   * Get a party by ID
   */
  getById(partyId: PartyId): Promise<GlobalParty | null>;
  
  /**
   * Find a party by email within a tenant
   */
  findByEmail(email: PartyEmail, tenantId: TenantId): Promise<GlobalParty | null>;
  
  /**
   * List parties for a tenant with optional filtering
   */
  list(query: ListGlobalPartiesQuery): Promise<ListGlobalPartiesResult>;
  
  /**
   * Create a new global party
   */
  create(party: Omit<GlobalParty, "id" | "createdAt" | "updatedAt">): Promise<GlobalParty>;
  
  /**
   * Update an existing global party
   */
  update(partyId: PartyId, updates: Partial<GlobalParty>): Promise<GlobalParty>;
  
  /**
   * Delete a global party
   */
  delete(partyId: PartyId): Promise<void>;
  
  /**
   * Find active delegations for a party
   */
  findActiveDelegations(partyId: PartyId): Promise<DelegationRecord[]>;
  
  /**
   * Create a delegation record
   */
  createDelegation(delegation: Omit<DelegationRecord, "id" | "createdAt">): Promise<DelegationRecord>;
  
  /**
   * Update a delegation record
   */
  updateDelegation(delegationId: string, updates: Partial<DelegationRecord>): Promise<DelegationRecord>;
  
  /**
   * Delete a delegation record
   */
  deleteDelegation(delegationId: string): Promise<void>;
}
