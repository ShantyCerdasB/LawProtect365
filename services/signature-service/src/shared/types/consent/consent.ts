/**
 * @file consent.ts
 * @summary Consent-specific types
 * @description Defines consent-related interfaces and repository types used across the application
 */

import type { ISODateString } from "@lawprotect/shared-ts";
import type { ConsentId, EnvelopeId, PartyId, TenantId, ConsentStatus, ConsentType } from "@/domain/value-objects/Ids";
import type { WithTimestamps, WithMetadata, EnvelopeScoped, TenantScoped, ConsentKey } from "./common";

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
 * Consent row type for domain operations
 * Uses branded types for type safety
 */
export type ConsentRow = {
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
  /** Additional metadata for the consent (optional) */
  metadata?: Record<string, unknown>;
  /** ISO timestamp when the consent expires (optional) */
  expiresAt?: ISODateString;
  /** ISO timestamp when the consent was created (optional) */
  createdAt?: ISODateString;
  /** ISO timestamp when the consent was last updated (optional) */
  updatedAt?: ISODateString;
};

// ---- Repository Types ----

/**
 * Consent repository key for database operations
 */
export type ConsentRepoKey = ConsentKey;

/**
 * Consent repository row type for database operations
 */
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
    status: string;
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
