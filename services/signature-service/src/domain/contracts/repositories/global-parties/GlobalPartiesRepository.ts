/**
 * @file GlobalPartiesRepository.ts
 * @summary Global Parties repository contract
 * @description Contract interface for Global Parties repository operations
 */

import type { 
  GlobalPartyExtended,
  CreateGlobalPartyAppInput,
  UpdateGlobalPartyAppInput,
  FindGlobalPartyByEmailAppInput,
  FindGlobalPartyByEmailAppResult,
  ListGlobalPartiesAppInput,
  ListGlobalPartiesAppResult,
  SearchGlobalPartiesByEmailAppInput,
  SearchGlobalPartiesByEmailAppResult
} from "../../../../domain/types/global-parties";

/**
 * @description Repository contract for Global Parties operations
 */
export interface GlobalPartiesRepository {
  /**
   * Creates a new Global Party
   */
  create(input: CreateGlobalPartyAppInput): Promise<void>;

  /**
   * Updates an existing Global Party
   */
  update(input: UpdateGlobalPartyAppInput): Promise<void>;

  /**
   * Gets a Global Party by ID
   */
  getById(tenantId: string, partyId: string): Promise<GlobalPartyExtended | null>;

  /**
   * Lists Global Parties with optional filters
   */
  list(input: ListGlobalPartiesAppInput): Promise<ListGlobalPartiesAppResult>;

  /**
   * Searches Global Parties by email
   */
  searchByEmail(input: SearchGlobalPartiesByEmailAppInput): Promise<SearchGlobalPartiesByEmailAppResult>;

  /**
   * Finds a party by email in the specified tenant
   */
  findByEmail(input: FindGlobalPartyByEmailAppInput): Promise<FindGlobalPartyByEmailAppResult | null>;

  /**
   * Finds an existing party by email or creates a new one for delegation
   */
  findOrCreatePartyForDelegate(input: { 
    tenantId: string; 
    email: string; 
    name: string 
  }): Promise<string>;
}






