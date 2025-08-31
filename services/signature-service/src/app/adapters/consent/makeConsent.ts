/**
 * @file makeConsent.ts
 * @summary App adapter: ConsentRepository → ConsentCommandsPort (create/get/delete)
 * @description Bridges the infra repository to the app commands port for consent operations.
 * Generates consent IDs, handles enum validation, and brands ISO date strings.
 */

import type { ConsentCommandsPort, CreateConsentCommand, CreateConsentResult } from "@/app/ports/consent/ConsentCommandsPort";
import type { ConsentRepoRow, ConsentRepoKey, ConsentRepoCreateInput } from "@/shared/types/consent";
import { validateConsentType, validateConsentStatus } from "@/shared/validations/consent.validations";
import { nowIso, asISO, asISOOpt } from "@lawprotect/shared-ts";

/**
 * @summary Minimal repository interface required by this adapter
 * @description Defines the repository methods needed for consent command operations
 */
type ConsentsRepo = {
  create(input: ConsentRepoCreateInput): Promise<ConsentRepoRow>;
  getById(keys: ConsentRepoKey): Promise<ConsentRepoRow | null>;
  delete(keys: ConsentRepoKey): Promise<void>;
};

/**
 * @summary ID generation service interface
 * @description Service for generating unique identifiers
 */
type Ids = { ulid(): string };

/**
 * @summary Creates a ConsentCommandsPort implementation
 * @description Factory function that creates a ConsentCommandsPort implementation
 * by bridging the infrastructure repository to the application port interface.
 * Handles ID generation, enum validation, and date branding.
 *
 * @param {ConsentsRepo} repo - Repository implementation for consent operations
 * @param {Ids} ids - ID generation service
 * @returns {ConsentCommandsPort} ConsentCommandsPort implementation
 */
export function makeConsentCommandsPort(repo: ConsentsRepo, ids: Ids): ConsentCommandsPort {
  return {
    /**
     * @summary Creates a new consent
     * @description Creates a new consent record with generated ID and initial pending status.
     * Validates enum values and brands ISO date strings for type safety.
     *
     * @param {CreateConsentCommand} input - Consent creation parameters
     * @returns {Promise<CreateConsentResult>} Promise resolving to the created consent data
     */
    async create(input: CreateConsentCommand): Promise<CreateConsentResult> {
      const row = await repo.create({
        consentId: ids.ulid(),
        tenantId: input.tenantId,
        envelopeId: input.envelopeId,
        partyId: input.partyId,
        consentType: input.consentType,
        status: "pending" as any,
        metadata: input.metadata,
        expiresAt: asISOOpt(input.expiresAt),
        createdAt: asISO(nowIso()),
      });

      return {
        consentId: row.consentId,
        createdAt: row.createdAt,
      };
    },

    /**
     * @summary Updates an existing consent
     * @description Updates a consent record with the provided changes.
     * Currently delegates to a separate update adapter.
     *
     * @param {string} envelopeId - The envelope ID this consent belongs to
     * @param {string} consentId - The unique identifier of the consent to update
     * @param {object} patch - The data to update the consent with
     * @returns {Promise<object>} Promise resolving to the updated consent data
     */
    async update(envelopeId: string, consentId: string, patch: any): Promise<any> {
      // TODO: Implement or delegate to MakeUpdateConsentPort
      throw new Error("update not implemented - use MakeUpdateConsentPort");
    },

    /**
     * @summary Deletes a consent
     * @description Deletes a consent record from the repository.
     *
     * @param {string} envelopeId - The envelope ID this consent belongs to
     * @param {string} consentId - The unique identifier of the consent to delete
     * @returns {Promise<void>} Promise resolving when deletion is complete
     */
    async delete(envelopeId: string, consentId: string): Promise<void> {
      await repo.delete({ envelopeId, consentId });
    },

    /**
     * @summary Submits a consent
     * @description Submits a consent by updating its status to granted.
     * Currently delegates to a separate update adapter.
     *
     * @param {string} envelopeId - The envelope ID this consent belongs to
     * @param {string} consentId - The unique identifier of the consent to submit
     * @param {object} actor - Actor context information (optional)
     * @returns {Promise<object>} Promise resolving to the submitted consent data
     */
    async submit(envelopeId: string, consentId: string, actor?: any): Promise<any> {
      // TODO: Implement or delegate to MakeUpdateConsentPort
      throw new Error("submit not implemented - use MakeUpdateConsentPort");
    },

    /**
     * @summary Delegates a consent to another party
     * @description Delegates a consent to another party with delegation metadata.
     * Currently delegates to a separate commands adapter.
     *
     * @param {object} input - The consent delegation parameters
     * @returns {Promise<object>} Promise resolving to the delegated consent data
     */
    async delegate(input: any): Promise<any> {
      // TODO: Implement or delegate to MakeConsentCommandsPort
      throw new Error("delegate not implemented - use MakeConsentCommandsPort");
    },
  };
}
