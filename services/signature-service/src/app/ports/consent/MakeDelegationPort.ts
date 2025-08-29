/**
 * @file makeDelegationsPort.ts
 * @summary App adapter: DelegationRepository → DelegationsPort.
 *
 * Bridges the infra repo to the domain port:
 * - Generates `delegationId` with the provided `ids` service.
 * - Normalizes repo status → domain enum via `toDelegationStatus`.
 * - Brands optional ISO date inputs using `asISOOpt`.
 */

import type { DelegationsPort, DelegationRecord } from "@/domain/ports/consent/Delegation";
import type { DelegationRepoCreateInput, DelegationRepoRow } from "@/adapters/shared/RepoTypes";
import { toDelegationStatus } from "@/app/mapper/EnumMappers";
import { asISOOpt } from "@lawprotect/shared-ts";

type Ids = { ulid(): string };

type DelegationsRepo = {
  create(input: DelegationRepoCreateInput): Promise<DelegationRepoRow>;
};

/**
 * Factory that wraps a low-level repo and exposes the clean domain port.
 *
 * @param repo - Infrastructure repository for delegations.
 * @param ids  - ID generator service (e.g., ULID).
 * @returns    - A DelegationsPort implementation.
 */
export function makeDelegationsPort(repo: DelegationsRepo, ids: Ids): DelegationsPort {
  return {
    /**
     * Creates a new delegation with initial status "pending".
     *
     * @param input - Domain create payload (tenant/envelope/consent/parties, optional reason/metadata/expiresAt).
     * @returns     - The persisted DelegationRecord (domain-shaped).
     */
    async create(input): Promise<DelegationRecord> {
      const row = await repo.create({
        delegationId: ids.ulid(),
        tenantId: input.tenantId,
        consentId: input.consentId,
        envelopeId: input.envelopeId,
        originalPartyId: input.originalPartyId,
        delegatePartyId: input.delegatePartyId,
        reason: input.reason,
        status: "pending",
        // Brand optional ISO strings to the repo’s ISODateString type:
        expiresAt: asISOOpt(input.expiresAt),
        metadata: input.metadata,
        // Let the repo set timestamps:
        createdAt: undefined,
      });

      return {
        delegationId: row.delegationId,
        consentId: row.consentId,
        envelopeId: row.envelopeId,
        originalPartyId: row.originalPartyId,
        delegatePartyId: row.delegatePartyId,
        reason: row.reason,
        status: toDelegationStatus(row.status),
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        expiresAt: row.expiresAt,
        metadata: row.metadata,
      };
    },
  };
}
