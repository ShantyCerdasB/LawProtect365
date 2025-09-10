/**
 * @file ConsentTypes.ts
 * @summary Consent domain types and repository types
 * @description Defines consent-related domain types and repository types used across the application
 */

import type { ISODateString } from "@lawprotect/shared-ts";
import type { ConsentId, EnvelopeId, PartyId } from "@/domain/value-objects/ids";
import type { ConsentStatus, ConsentType } from "../../../domain/values/enums";

import type { WithTimestamps, WithMetadata, EnvelopeScoped, ConsentKey } from "../common/base";

/**
 * @summary Minimal consent head used across app flows
 * @description Core consent information used in application flows
 */
export type ConsentHead = {
  /** The unique identifier of the consent */
  readonly consentId: ConsentId;
  /** The envelope ID this consent belongs to */
  readonly envelopeId: EnvelopeId;
  /** The party ID this consent is for */
  readonly partyId: PartyId;
  /** The tenant ID that owns the consent */
  /** The type of consent */
  readonly consentType: ConsentType;
  /** The current status of the consent */
  readonly status: ConsentStatus;
  /** ISO timestamp when the consent was created (optional) */
  readonly createdAt?: string;
  /** ISO timestamp when the consent was last updated (optional) */
  readonly updatedAt?: string;
  /** ISO timestamp when the consent expires (optional) */
  readonly expiresAt?: string;
};

/**
 * @summary Common patch shape for consent updates
 * @description Fields that can be updated in a consent record
 */
export type ConsentPatch = {
  /** The new status for the consent (optional) */
  readonly status?: ConsentStatus;
  /** Additional metadata for the consent (optional) */
  readonly metadata?: Record<string, unknown>;
  /** New expiration date for the consent (optional) */
  readonly expiresAt?: string;
};

/**
 * @summary Consent delegation data
 * @description Information about consent delegation to another party
 */
export type ConsentDelegation = {
  /** The unique identifier of the delegation */
  readonly delegationId: string;
  /** The consent ID being delegated */
  readonly consentId: ConsentId;
  /** Email of the delegate */
  readonly delegateEmail: string;
  /** Name of the delegate */
  readonly delegateName: string;
  /** Reason for delegation (optional) */
  readonly reason?: string;
  /** ISO timestamp when the delegation expires (optional) */
  readonly expiresAt?: string;
  /** Additional metadata for the delegation (optional) */
  readonly metadata?: Record<string, unknown>;
  /** ISO timestamp when the delegation was created */
  readonly createdAt: string;
};

/**
 * @summary Consent row type for domain operations
 * @description Uses branded types for type safety in domain operations
 */
export type ConsentRow = {
  /** The unique identifier of the consent */
  readonly consentId: ConsentId;
  /** The envelope ID this consent belongs to */
  readonly envelopeId: EnvelopeId;
  /** The party ID this consent is for */
  readonly partyId: PartyId;
  /** The tenant ID that owns the consent */
  /** The type of consent */
  readonly consentType: ConsentType;
  /** The current status of the consent */
  readonly status: ConsentStatus;
  /** Additional metadata for the consent (optional) */
  readonly metadata?: Record<string, unknown>;
  /** ISO timestamp when the consent expires (optional) */
  readonly expiresAt?: ISODateString;
  /** ISO timestamp when the consent was created (optional) */
  readonly createdAt?: ISODateString;
  /** ISO timestamp when the consent was last updated (optional) */
  readonly updatedAt?: ISODateString;
};

// ---- Repository Types ----

/**
 * @summary Consent repository key for database operations
 * @description Composite key structure for consent database operations
 */
export type ConsentRepoKey = ConsentKey;

/**
 * @summary Consent repository row type for database operations
 * @description Repository layer type that combines base types with consent-specific fields
 */
export type ConsentRepoRow =
  & EnvelopeScoped
  & WithTimestamps
  & WithMetadata
  & {
    /** Consent identifier */
    readonly consentId: string;
    /** Party identifier */
    readonly partyId: string;
    /** Consent type (repo persists raw text; app-layer maps to canonical enums) */
    readonly consentType: string;
    /** Consent status */
    readonly status: ConsentStatus;
    /** Expiration timestamp */
    readonly expiresAt?: ISODateString;
  };

/**
 * @summary Input for creating a consent in the repository
 * @description Parameters required to create a new consent record
 */
export type ConsentRepoCreateInput = Omit<ConsentRepoRow, "updatedAt">;

/**
 * @summary Input for updating a consent in the repository
 * @description Parameters that can be updated in an existing consent record
 */
export type ConsentRepoUpdateInput = Partial<
  Pick<ConsentRepoRow, "status" | "expiresAt" | "metadata">
> & {
  /** Update timestamp */
  readonly updatedAt?: ISODateString;
};

/**
 * @summary Input for listing consents from the repository
 * @description Query parameters for listing consent records
 */
export type ConsentRepoListInput = {
  /** Tenant identifier */
  /** Envelope identifier */
  readonly envelopeId: EnvelopeId;
  /** Maximum number of results */
  readonly limit: number;
  /** Pagination cursor */
  readonly cursor?: string;
  /** Filter by consent status */
  readonly status?: ConsentStatus;
  /** Filter by consent type */
  readonly consentType?: ConsentType;
  /** Filter by party identifier */
  readonly partyId?: PartyId;
};

/**
 * @summary Output for listing consents from the repository
 * @description Paginated result of consent records
 */
export type ConsentRepoListOutput = {
  /** List of consent records */
  readonly items: ConsentRepoRow[];
  /** Pagination metadata */
  readonly meta: { 
    /** Maximum number of items */
    readonly limit: number; 
    /** Next pagination cursor */
    readonly nextCursor?: string; 
    /** Total number of items */
    readonly total?: number 
  };
};

/**
 * @summary Maps a repository row to a consent app result
 * @description Converts a repository row to the domain consent result format
 *
 * @param {ConsentRepoRow} r - Repository row from database
 * @returns {GetConsentAppResult} Domain consent result record
 */
export const mapConsentRowToResult = (r: ConsentRepoRow) => ({
  id: r.consentId as ConsentId,
  envelopeId: r.envelopeId as EnvelopeId,
  partyId: r.partyId as PartyId,
  type: r.consentType as ConsentType,
  status: r.status as ConsentStatus,
  createdAt: r.createdAt || "",
  updatedAt: r.updatedAt,
  expiresAt: r.expiresAt,
  metadata: r.metadata});

/**
 * @summary Maps a repository row to a consent list item
 * @description Converts a repository row to the domain consent list item format
 *
 * @param {ConsentRepoRow} r - Repository row from database
 * @returns {ListConsentsAppResult['items'][0]} Domain consent list item
 */
export const mapConsentRowToListItem = (r: ConsentRepoRow) => ({
  id: r.consentId as ConsentId,
  partyId: r.partyId as PartyId,
  type: r.consentType as ConsentType,
  status: r.status as ConsentStatus,
  createdAt: r.createdAt || "",
  updatedAt: r.updatedAt,
  expiresAt: r.expiresAt,
  metadata: r.metadata});

