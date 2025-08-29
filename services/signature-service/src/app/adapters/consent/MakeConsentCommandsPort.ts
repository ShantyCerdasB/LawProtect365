/**
 * @file makeConsentCommandsPort.ts
 * @summary App adapter: ConsentRepository → ConsentCommandsPort (create/update/delete/submit/delegate).
 *
 * Bridges the infra repository to the app port:
 * - Combines multiple consent adapters into a single ConsentCommandsPort implementation
 * - Handles all consent command operations (create, update, delete, submit, delegate)
 * - Uses existing adapters for specific operations
 */

import type { ConsentCommandsPort, CreateConsentCommand, CreateConsentResult, UpdateConsentResult, SubmitConsentResult, DelegateConsentCommand, DelegateConsentResult, ActorContext } from "../../ports/consent/ConsentCommandsPort";
import type { ConsentPatch } from "../../ports/shared/consents/types.consent";
import type { ConsentId, EnvelopeId, ConsentStatus } from "../../ports/shared/common/types";

import type {
  ConsentRepoRow,
  ConsentRepoCreateInput,
  ConsentRepoKey,
  ConsentRepoUpdateInput,
} from "../../../adapters/shared/RepoTypes";

import { nowIso, asISO, asISOOpt } from "@lawprotect/shared-ts";

/** Minimal infra repo surface required by this adapter. */
type ConsentsRepo = {
  create(input: ConsentRepoCreateInput): Promise<ConsentRepoRow>;
  getById(keys: ConsentRepoKey): Promise<ConsentRepoRow | null>;
  update(keys: ConsentRepoKey, changes: ConsentRepoUpdateInput): Promise<ConsentRepoRow>;
  delete(keys: ConsentRepoKey): Promise<void>;
};

type Ids = { ulid(): string };

export function makeConsentCommandsPort(
  consentsRepo: ConsentsRepo,
  ids: Ids
): ConsentCommandsPort {
  return {
    /**
     * Creates a new consent
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
     * Updates an existing consent
     */
    async update(envelopeId: EnvelopeId, consentId: ConsentId, patch: ConsentPatch): Promise<UpdateConsentResult> {
      const changes: ConsentRepoUpdateInput = {};
      
      if (patch.status !== undefined) {
        changes.status = patch.status as ConsentStatus;
      }
      
      if (patch.metadata !== undefined) {
        changes.metadata = patch.metadata;
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
     * Deletes a consent
     */
    async delete(envelopeId: EnvelopeId, consentId: ConsentId): Promise<void> {
      await consentsRepo.delete({ envelopeId, consentId });
    },

    /**
     * Submits a consent
     */
    async submit(envelopeId: EnvelopeId, consentId: ConsentId, actor?: ActorContext): Promise<SubmitConsentResult> {
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
     * Delegates a consent to another party
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
