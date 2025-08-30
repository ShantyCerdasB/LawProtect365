/**
 * Shared repository types (DDB/SQL) reusing domain definitions.
 * Zero duplication of enums/IDs/dates.
 */

import type {
  WithTimestamps,
  WithMetadata,
  EnvelopeScoped,
  TenantScoped,
  ConsentKey,
} from "@/domain/Types/Common";
import type {
  ConsentStatus,
  DelegationStatus,
} from "@/domain/values/enums";
import type { ISODateString } from "@lawprotect/shared-ts";

// ---- Consent ----
export type ConsentRepoKey = ConsentKey;

export type ConsentRepoRow =
  & EnvelopeScoped
  & TenantScoped
  & WithTimestamps
  & WithMetadata
  & {
    consentId: string;
    partyId: string;
    // repo persists raw text; app-layer maps to canonical enums
    consentType: string;
    status: ConsentStatus;
    expiresAt?: ISODateString;
  };

export type ConsentRepoCreateInput = Omit<ConsentRepoRow, "updatedAt">;

export type ConsentRepoUpdateInput = Partial<
  Pick<ConsentRepoRow, "status" | "expiresAt" | "metadata">
> & {
  updatedAt?: ISODateString;
};

// Paginated list (read/query)
export type ConsentRepoListInput = {
  envelopeId: string;
  limit?: number;
  cursor?: string;
  status?: string;
  consentType?: string;
  partyId?: string;
};

export type ConsentRepoListOutput = {
  items: ConsentRepoRow[];
  meta: { limit: number; nextCursor?: string; total?: number };
};

// ---- Delegation ----
export type DelegationRepoRow =
  & EnvelopeScoped
  & WithTimestamps
  & WithMetadata
  & {
    delegationId: string;
    tenantId: string;
    consentId: string;
    originalPartyId: string;
    delegatePartyId: string;
    reason?: string;
    status: DelegationStatus;
    expiresAt?: ISODateString;
  };

export type DelegationRepoCreateInput = Omit<
  DelegationRepoRow,
  "updatedAt" | "createdAt"
> & {
  createdAt?: ISODateString;
};
