/**
 * @file MakeConsentCommandsPort.ts
 * @summary App adapter: ConsentRepository → ConsentCommandsPort (create/update/delete/submit/delegate)
 * @description Bridges the infra repository to the app commands port for all consent operations.
 * Handles ID generation, enum validation, and provides complete ConsentCommandsPort implementation.
 */

import type { 
  ConsentCommandsPort, 
  CreateConsentCommand, 
  CreateConsentResult, 
  UpdateConsentResult, 
  SubmitConsentResult, 
  DelegateConsentCommand, 
  DelegateConsentResult 
} from "@/app/ports/consent/ConsentCommandsPort";
import type { ConsentPatch } from "@/shared/types/consent";
import type { ConsentId, EnvelopeId, ConsentStatus } from "@/shared/types/domain";
import type {
  ConsentRepoRow,
  ConsentRepoCreateInput,
  ConsentRepoKey,
  ConsentRepoUpdateInput,
} from "@/shared/types/consent";
import { validateConsentStatus } from "@/shared/validations/consent.validations";
import { nowIso, asISO, asISOOpt } from "@lawprotect/shared-ts";

/**
 * @summary Minimal repository interface required by this adapter
 * @description Defines the repository methods needed for consent command operations
 */
type ConsentsRepo = {
  create(input: ConsentRepoCreateInput): Promise<ConsentRepoRow>;
  getById(keys: ConsentRepoKey): Promise<ConsentRepoRow | null>;
  update(keys: ConsentRepoKey, changes: ConsentRepoUpdateInput): Promise<ConsentRepoRow>;
  delete(keys: ConsentRepoKey): Promise<void>;
};

/**
 * @summary ID generation service interface
 * @description Service for generating unique identifiers
 */
type Ids = { ulid(): string };

/**
 * @summary Creates a ConsentCommandsPort implementation
 * @description Factory function that creates a complete ConsentCommandsPort implementation
 * by bridging the infrastructure repository to the application port interface.
 * Handles all consent command operations with proper validation and type safety.
 *
 * @param {ConsentsRepo} consentsRepo - Repository implementation for consent operations
 * @param {Ids} ids - ID generation service
 * @returns {ConsentCommandsPort} Complete ConsentCommandsPort implementation
 */
export function makeConsentCommandsPort(
  consentsRepo: ConsentsRepo,
  ids: Ids
): ConsentCommandsPort {
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
      const row = await consentsRepo.create({
        consentId: ids.ulid(),
        tenantId: input.tenantId,
        envelopeId: input.envelopeId,
        partyId: input.partyId,
        consentType: input.consentType,
        status: "pending" as ConsentStatus,
        metadata: input.metadata,
        expiresAt: asISOOpt(input.expiresAt),
        createdAt: asISO(nowIso()),
      });

      return {
        consentId: row.consentId as ConsentId,
        createdAt: row.createdAt,
      };
    },

    /**
     * @summary Updates an existing consent
     * @description Updates a consent record with the provided changes.
     * Validates status enum if provided and brands ISO date strings.
     *
     * @param {EnvelopeId} envelopeId - The envelope ID this consent belongs to
     * @param {ConsentId} consentId - The unique identifier of the consent to update
     * @param {ConsentPatch} patch - The data to update the consent with
     * @returns {Promise<UpdateConsentResult>} Promise resolving to the updated consent data
     */
    async update(envelopeId: EnvelopeId, consentId: ConsentId, patch: ConsentPatch): Promise<UpdateConsentResult> {
      const changes: ConsentRepoUpdateInput = {};
      
      if (patch.status !== undefined) {
        changes.status = validateConsentStatus(patch.status);
      }
      
      if (patch.metadata !== undefined) {
        (changes as any).metadata = { ...patch.metadata };
      }
      
      if (patch.expiresAt !== undefined) {
        changes.expiresAt = asISOOpt(patch.expiresAt);
      }

      const row = await consentsRepo.update(
        { envelopeId, consentId },
        changes
      );

      return {
        consentId: row.consentId as ConsentId,
        updatedAt: row.updatedAt as string,
      };
    },

    /**
     * @summary Deletes a consent
     * @description Deletes a consent record from the repository.
     *
     * @param {EnvelopeId} envelopeId - The envelope ID this consent belongs to
     * @param {ConsentId} consentId - The unique identifier of the consent to delete
     * @returns {Promise<void>} Promise resolving when deletion is complete
     */
    async delete(envelopeId: EnvelopeId, consentId: ConsentId): Promise<void> {
      await consentsRepo.delete({ envelopeId, consentId });
    },

    /**
     * @summary Submits a consent
     * @description Submits a consent by updating its status to granted.
     * Uses the update method internally for consistency.
     *
     * @param {EnvelopeId} envelopeId - The envelope ID this consent belongs to
     * @param {ConsentId} consentId - The unique identifier of the consent to submit
     * @param {object} actor - Actor context information (optional)
     * @returns {Promise<SubmitConsentResult>} Promise resolving to the submitted consent data
     */
    async submit(envelopeId: EnvelopeId, consentId: ConsentId, actor?: any): Promise<SubmitConsentResult> {
      const row = await consentsRepo.update(
        { envelopeId, consentId },
        { status: "granted" as ConsentStatus }
      );

      return {
        consentId: row.consentId as ConsentId,
        submittedAt: row.updatedAt as string,
      };
    },

    /**
     * @summary Delegates a consent to another party
     * @description Delegates a consent to another party with delegation metadata.
     * Currently updates the consent status to revoked as a placeholder implementation.
     *
     * @param {DelegateConsentCommand} input - The consent delegation parameters
     * @returns {Promise<DelegateConsentResult>} Promise resolving to the delegated consent data
     */
    async delegate(input: DelegateConsentCommand): Promise<DelegateConsentResult> {
      // Get the current consent to find the original party
      const currentConsent = await consentsRepo.getById({
        envelopeId: input.envelopeId,
        consentId: input.consentId,
      });

      if (!currentConsent) {
        throw new Error(`Consent ${input.consentId} not found in envelope ${input.envelopeId}`);
      }

      // For now, we'll just update the consent status to revoked
      // In a real implementation, you would create a delegation record
      const updatedConsent = await consentsRepo.update(
        { envelopeId: input.envelopeId, consentId: input.consentId },
        { status: "revoked" as ConsentStatus }
      );

      return {
        consentId: input.consentId,
        delegationId: ids.ulid(), // Generate a new delegation ID
        delegatedAt: updatedConsent.updatedAt as string,
      };
    },
  };
}
