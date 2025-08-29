/**
 * @file types.consent.ts
 * @summary Consent-specific types shared across consent ports
 * @description Defines consent-related interfaces used by consent port implementations
 */

import type { ConsentId, EnvelopeId, PartyId, TenantId, ConsentStatus, ConsentType } from "../common";
import type { ISODateString } from "@lawprotect/shared-ts";

/**
 * Minimal consent head used across app flows
 */
export type ConsentHead = {
  /** The unique identifier of the consent */
  consentId: ConsentId;
  /** The envelope ID this consent belongs to */
  envelopeId: EnvelopeId;
  /** The party ID this consent is for */
  partyId: PartyId;
  /** The tenant ID that owns the consent */
  tenantId: TenantId;
  /** The type of consent */
  consentType: ConsentType;
  /** The current status of the consent */
  status: ConsentStatus;
  /** ISO timestamp when the consent was created (optional) */
  createdAt?: string;
  /** ISO timestamp when the consent was last updated (optional) */
  updatedAt?: string;
  /** ISO timestamp when the consent expires (optional) */
  expiresAt?: string;
};

/**
 * Common patch shape for consent updates
 */
export type ConsentPatch = {
  /** The new status for the consent (optional) */
  status?: ConsentStatus;
  /** Additional metadata for the consent (optional) */
  metadata?: Record<string, unknown>;
  /** New expiration date for the consent (optional) */
  expiresAt?: string;
};

/**
 * Consent delegation data
 */
export type ConsentDelegation = {
  /** The unique identifier of the delegation */
  delegationId: string;
  /** The consent ID being delegated */
  consentId: ConsentId;
  /** Email of the delegate */
  delegateEmail: string;
  /** Name of the delegate */
  delegateName: string;
  /** Reason for delegation (optional) */
  reason?: string;
  /** ISO timestamp when the delegation expires (optional) */
  expiresAt?: string;
  /** Additional metadata for the delegation (optional) */
  metadata?: Record<string, unknown>;
  /** ISO timestamp when the delegation was created */
  createdAt: string;
};

/**
 * Consent row type for database operations
 * Allows both branded types and strings for flexibility
 */
export type ConsentRow = {
  /** The unique identifier of the consent */
  consentId: ConsentId | string;
  /** The envelope ID this consent belongs to */
  envelopeId: EnvelopeId | string;
  /** The party ID this consent is for */
  partyId: PartyId | string;
  /** The tenant ID that owns the consent */
  tenantId: TenantId | string;
  /** The type of consent */
  consentType: ConsentType | string;
  /** The current status of the consent */
  status: ConsentStatus | string;
  /** Additional metadata for the consent (optional) */
  metadata?: Record<string, unknown>;
  /** ISO timestamp when the consent expires (optional) */
  expiresAt?: string;
  /** ISO timestamp when the consent was created (optional) */
  createdAt?: string;
  /** ISO timestamp when the consent was last updated (optional) */
  updatedAt?: string;
};

// ---- Repository Types (moved from adapters/shared/RepoTypes.ts) ----

/**
 * Consent repository key for database operations
 */
export type ConsentRepoKey = {
  envelopeId: string;
  consentId: string;
};

/**
 * Consent repository row type for database operations
 */
export type ConsentRepoRow = {
  consentId: string;
  envelopeId: string;
  tenantId: string;
  partyId: string;
  consentType: string;
  status: ConsentStatus;
  metadata?: Record<string, unknown>;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  expiresAt?: ISODateString;
};

/**
 * Input for creating a consent in the repository
 */
export type ConsentRepoCreateInput = Omit<ConsentRepoRow, "updatedAt">;

/**
 * Input for updating a consent in the repository
 */
export type ConsentRepoUpdateInput = Partial<
  Pick<ConsentRepoRow, "status" | "expiresAt" | "metadata">
> & {
  updatedAt?: ISODateString;
};

/**
 * Input for listing consents from the repository
 */
export type ConsentRepoListInput = {
  envelopeId: string;
  limit?: number;
  cursor?: string;
  status?: string;
  consentType?: string;
  partyId?: string;
};

/**
 * Output for listing consents from the repository
 */
export type ConsentRepoListOutput = {
  items: ConsentRepoRow[];
  meta: { limit: number; nextCursor?: string; total?: number };
};

/**
 * Delegation repository row type for database operations
 */
export type DelegationRepoRow = {
  delegationId: string;
  envelopeId: string;
  tenantId: string;
  consentId: string;
  originalPartyId: string;
  delegatePartyId: string;
  reason?: string;
  status: string;
  metadata?: Record<string, unknown>;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  expiresAt?: ISODateString;
};

/**
 * Input for creating a delegation in the repository
 */
export type DelegationRepoCreateInput = Omit<
  DelegationRepoRow,
  "updatedAt" | "createdAt"
> & {
  createdAt?: ISODateString;
};
