/**
 * @file PartyConsentService.ts
 * @summary Service for managing party creation and lookup for consent delegation
 * @description Handles the creation or lookup of party records for consent delegation scenarios.
 * This service is specific to the consent module and manages party lifecycle for delegates.
 */

import { PartyId, TenantId } from "../../../domain/value-objects/Ids";
import type { Ids } from "../../../shared/types/consent/AdapterDependencies";
import type { GlobalPartyRepositoryPort } from "../../../shared/contracts/repositories/parties/GlobalPartyRepositoryPort";
import { GlobalPartyStatus, PartyType } from "../../../domain/values/enums";
import { BadRequestError } from "../../../shared/errors";

/**
 * @summary Input for finding or creating a party for delegation
 * @description Contains the necessary information to locate or create a party record
 */
export interface FindOrCreatePartyInput {
  tenantId: TenantId;
  email: string;
  name: string;
}

/**
 * @summary Service for managing party operations specific to consent delegation
 * @description Handles party creation and lookup for consent delegation scenarios.
 * This service ensures that delegates have proper party records in the system.
 */
export class PartyConsentService {
  constructor(
    private readonly globalPartiesRepo: GlobalPartyRepositoryPort,
    private readonly ids: Ids
  ) {}

  /**
   * @summary Finds an existing party by email or creates a new one for delegation
   * @description Searches for a party with the given email in the tenant. If not found,
   * creates a new party record for the delegate.
   * 
   * @param input - Contains tenantId, email, and name for party lookup/creation
   * @returns Promise resolving to the party ID (existing or newly created)
   * 
   * @example
   * ```typescript
   * const partyId = await partyService.findOrCreatePartyForDelegate({
   *   tenantId: "tenant-123",
   *   email: "delegate@example.com",
   *   name: "John Doe"
   * });
   * ```
   */
  async findOrCreatePartyForDelegate(
    input: FindOrCreatePartyInput
  ): Promise<PartyId> {
    // Validate input
    if (!input.email?.trim() || !input.name?.trim()) {
      throw new BadRequestError("Email and name are required for party delegation");
    }

    // First, try to find existing party by email using findByEmail
    const existingParty = await this.globalPartiesRepo.findByEmail({
      tenantId: input.tenantId,
      email: input.email
    });

    if (existingParty) {
      return existingParty.partyId;
    }

    // If not found, create a new party for the delegate
    const newPartyId = this.ids.ulid() as PartyId;
    
    await this.globalPartiesRepo.create({
      partyId: newPartyId,
      tenantId: input.tenantId,
      email: input.email,
      name: input.name,
      type: "global" as PartyType, // Delegates are global parties
      status: "active" as GlobalPartyStatus,
      metadata: {
        createdFor: "consent-delegation",
        originalEmail: input.email,
        originalName: input.name
      }
    });

    return newPartyId;
  }
}
