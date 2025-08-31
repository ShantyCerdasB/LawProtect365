/**
 * @file MakeUpdateConsentPort.ts
 * @summary App adapter: infra repo → ConsentCommandsPort (update operations)
 * @description Bridges the low-level repository to consent update operations.
 * Normalizes raw strings to canonical enums and brands ISO date strings.
 */

import type { ConsentCommandsPort, UpdateConsentResult } from "@/app/ports/consent/ConsentCommandsPort";
import type { ConsentHead } from "@/shared/types/consent";
import type {
  ConsentRepoRow,
  ConsentRepoKey,
  ConsentRepoUpdateInput,
} from "@/shared/types/consent";
import { validateConsentType, validateConsentStatus } from "@/shared/validations/consent.validations";
import { nowIso, asISO, asISOOpt } from "@lawprotect/shared-ts";

/**
 * @summary Minimal repository interface required by this adapter
 * @description Defines the repository methods needed for consent update operations
 */
type ConsentsRepo = {
  getById(keys: ConsentRepoKey): Promise<ConsentRepoRow | null>;
  update(keys: ConsentRepoKey, changes: ConsentRepoUpdateInput): Promise<ConsentRepoRow>;
};

/**
 * @summary Maps a repository row to a consent head record
 * @description Converts a repository row to the domain consent head format,
 * validating enum values using shared validation functions.
 *
 * @param {ConsentRepoRow} r - Repository row from database
 * @returns {ConsentHead} Domain consent head record
 */
const rowToRecord = (r: ConsentRepoRow): ConsentHead => ({
  consentId: r.consentId,
  envelopeId: r.envelopeId as any,
  partyId: r.partyId as any,
  tenantId: r.tenantId as any,
  consentType: validateConsentType(r.consentType),
  status: validateConsentStatus(r.status),
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
  expiresAt: r.expiresAt,
});

/**
 * @summary Maps a repository row to a minimal consent state
 * @description Converts a repository row to a minimal consent state snapshot,
 * validating enum values using shared validation functions.
 *
 * @param {ConsentRepoRow} r - Repository row from database
 * @returns {object} Minimal consent state
 */
const rowToState = (r: ConsentRepoRow) => ({
  consentId: r.consentId,
  envelopeId: r.envelopeId as any,
  partyId: r.partyId as any,
  consentType: validateConsentType(r.consentType),
  status: validateConsentStatus(r.status),
});

/**
 * @summary Creates a consent update port implementation
 * @description Factory function that creates a consent update port implementation
 * by bridging the infrastructure repository to update operations.
 * Handles enum validation and date branding for type safety.
 *
 * @param {ConsentsRepo} repo - Repository implementation for consent operations
 * @returns {object} Consent update port implementation
 */
export function makeUpdateConsentPort(repo: ConsentsRepo) {
  return {
    /**
     * @summary Reads a consent state by composite key
     * @description Retrieves a consent state snapshot by envelope and consent IDs.
     *
     * @param {string} envelopeId - Envelope identifier
     * @param {string} consentId - Consent identifier
     * @returns {Promise<object | null>} Promise resolving to consent state or null when not found
     */
    async getById(envelopeId: string, consentId: string) {
      const row = await repo.getById({ envelopeId, consentId });
      return row ? rowToState(row) : null;
    },

    /**
     * @summary Partially updates a consent and returns the full updated record
     * @description Updates a consent record with the provided changes.
     * Validates enum values and brands ISO date strings for type safety.
     *
     * @param {string} envelopeId - Envelope identifier
     * @param {string} consentId - Consent identifier
     * @param {object} changes - Partial changes to apply:
     *   - status (domain enum)
     *   - expiresAt (ISO-8601 string; validated/branded here)
     *   - metadata (opaque key/value bag)
     * @returns {Promise<ConsentHead>} Promise resolving to updated consent record
     */
    async update(
      envelopeId: string,
      consentId: string,
      changes: {
        status?: string;
        expiresAt?: string;
        metadata?: Record<string, unknown>;
      }
    ): Promise<ConsentHead> {
      const updateChanges: ConsentRepoUpdateInput = {};

      if (changes.status !== undefined) {
        updateChanges.status = validateConsentStatus(changes.status);
      }
      
      if (changes.expiresAt !== undefined) {
        updateChanges.expiresAt = asISOOpt(changes.expiresAt);
      }
      
      if (changes.metadata !== undefined) {
        (updateChanges as any).metadata = { ...changes.metadata };
      }

      updateChanges.updatedAt = asISO(nowIso());

      const row = await repo.update(
        { envelopeId, consentId },
        updateChanges
      );
      
      return rowToRecord(row);
    },
  };
}

/**
 * @summary Type alias for the update consent port
 * @description Convenience type for the return type of makeUpdateConsentPort
 */
export type UpdateConsentPort = ReturnType<typeof makeUpdateConsentPort>;
