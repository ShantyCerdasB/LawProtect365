/**
 * @file MakeUpdateConsentPort.ts
 * @summary App adapter: infra repo → domain update/read port for Consents.
 *
 * Bridges the low-level repository to domain types:
 * - Normalizes raw strings to canonical enums (ConsentType/ConsentStatus).
 * - Brands ISO date strings using shared helpers to satisfy `ISODateString`.
 */

import type {
  ConsentRecord,
  ConsentState,
  ConsentStatus,
} from "@/domain/ports/consent/ConsentsPort";

import type {
  ConsentRepoRow,
  ConsentRepoKey,
  ConsentRepoUpdateInput,
} from "@/adapters/shared/RepoTypes";

import { toConsentType, toConsentStatus } from "@/app/mapper/EnumMappers";
import { nowIso,  asISO, asISOOpt  } from "@lawprotect/shared-ts";

/** Minimal infra repo surface required by this adapter. */
type ConsentsRepo = {
  getById(keys: ConsentRepoKey): Promise<ConsentRepoRow | null>;
  update(keys: ConsentRepoKey, changes: ConsentRepoUpdateInput): Promise<ConsentRepoRow>;
};

export type UpdateConsentPort = ReturnType<typeof makeUpdateConsentPort>;
/**
 * Maps a repository row to a domain record.
 * @param r Repository row
 * @returns Domain `ConsentRecord`
 */
const rowToRecord = (r: ConsentRepoRow): ConsentRecord => ({
  consentId: r.consentId,
  envelopeId: r.envelopeId,
  partyId: r.partyId,
  consentType: toConsentType(r.consentType),
  status: toConsentStatus(r.status),
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
  expiresAt: r.expiresAt,
  metadata: r.metadata,
});

/**
 * Maps a repository row to a minimal domain state snapshot.
 * @param r Repository row
 * @returns Domain `ConsentState`
 */
const rowToState = (r: ConsentRepoRow): ConsentState => ({
  consentId: r.consentId,
  envelopeId: r.envelopeId,
  partyId: r.partyId,
  consentType: toConsentType(r.consentType),
  status: toConsentStatus(r.status),
});

/**
 * Factory: wraps a low-level repository and exposes `getById` + `update`
 * with domain-friendly types.
 *
 * @param repo Infra repository implementing the minimal `ConsentsRepo` surface.
 */
export function makeUpdateConsentPort(repo: ConsentsRepo) {
  return {
    /**
     * Reads a consent state by composite key.
     * @param envelopeId Envelope identifier
     * @param consentId Consent identifier
     * @returns `ConsentState` or `null` when not found
     */
    async getById(envelopeId: string, consentId: string): Promise<ConsentState | null> {
      const row = await repo.getById({ envelopeId, consentId });
      return row ? rowToState(row) : null;
    },

    /**
     * Partially updates a consent and returns the full updated record.
     * @param envelopeId Envelope identifier
     * @param consentId Consent identifier
     * @param changes Partial changes:
     *  - `status` (domain enum)
     *  - `expiresAt` (ISO-8601 string; validated/branded here)
     *  - `metadata` (opaque key/value bag)
     * @returns Updated `ConsentRecord`
     */
    async update(
      envelopeId: string,
      consentId: string,
      changes: {
        status?: ConsentStatus;
        expiresAt?: string;
        metadata?: Record<string, unknown>;
      }
    ): Promise<ConsentRecord> {
      const row = await repo.update(
        { envelopeId, consentId },
        {
          status: changes.status,
          expiresAt: asISOOpt(changes.expiresAt), // brand optional ISO date
          metadata: changes.metadata,
          updatedAt: asISO(nowIso()),            // brand now() result as ISODateString
        }
      );
      return rowToRecord(row);
    },
  };
}
