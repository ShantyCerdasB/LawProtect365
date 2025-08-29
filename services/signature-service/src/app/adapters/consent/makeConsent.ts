/**
 * @file makeConsentsPort.ts
 * @summary App adapter: ConsentRepository → ConsentsPort (create/get/delete).
 *
 * Bridges the infra repository to the domain port:
 * - Generates `consentId` with the provided `ids` service.
 * - Normalizes raw strings to canonical enums (ConsentType/ConsentStatus).
 * - Brands ISO date strings using helpers from `@lawprotect/shared-ts`.
 */

import type {
  ConsentsPort,
  ConsentRecord,
  ConsentState,
  CreateConsentInput,
  DeleteConsentResult,
} from "@/domain/ports/consent/ConsentsPort";

import type {
  ConsentRepoRow,
  ConsentRepoKey,
  ConsentRepoCreateInput,
} from "@/adapters/shared/RepoTypes";

import { toConsentType, toConsentStatus } from "@/app/mapper/EnumMappers";
import { nowIso, asISO, asISOOpt } from "@lawprotect/shared-ts";

/** Minimal infra repo surface required by this adapter. */
type ConsentsRepo = {
  create(input: ConsentRepoCreateInput): Promise<ConsentRepoRow>;
  getById(keys: ConsentRepoKey): Promise<ConsentRepoRow | null>;
  delete(keys: ConsentRepoKey): Promise<void>;
};

type Ids = { ulid(): string };

export function makeConsentsPort(repo: ConsentsRepo, ids: Ids): ConsentsPort {
  return {
    /**
     * Creates a consent and returns the persisted domain record.
     * - Sets initial status to "pending".
     * - Brands optional/existing ISO fields.
     */
    async create(input: CreateConsentInput): Promise<ConsentRecord> {
      const row = await repo.create({
        consentId: ids.ulid(),
        tenantId: input.tenantId,
        envelopeId: input.envelopeId,
        partyId: input.partyId,
        consentType: input.consentType, // repo stores raw string
        status: "pending",
        metadata: input.metadata,
        expiresAt: asISOOpt(input.expiresAt),   // brand if provided
        createdAt: asISO(nowIso()),             // ensure branded ISO at creation
      });

      return {
        consentId: row.consentId,
        envelopeId: row.envelopeId,
        partyId: row.partyId,
        consentType: toConsentType(row.consentType),
        status: toConsentStatus(row.status),
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        expiresAt: row.expiresAt,
        metadata: row.metadata,
      };
    },

    /**
     * Reads a consent state snapshot by composite key.
     */
    async getById(envelopeId, consentId): Promise<ConsentState | null> {
      const row = await repo.getById({ envelopeId, consentId });
      if (!row) return null;

      return {
        consentId: row.consentId,
        envelopeId: row.envelopeId,
        partyId: row.partyId,
        consentType: toConsentType(row.consentType),
        status: toConsentStatus(row.status),
      };
    },

    /**
     * Deletes a consent and returns a deletion receipt with branded timestamp.
     */
    async delete(envelopeId, consentId): Promise<DeleteConsentResult> {
      await repo.delete({ envelopeId, consentId });
      return { consentId, envelopeId, deletedAt: asISO(nowIso()) };
    },
  };
}
