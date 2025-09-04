/**
 * @file GlobalPartiesTypes.ts
 * @summary Global Parties domain types and repository types
 * @description Defines global party-related domain types used across the application
 */

import type { TenantId, PartyId } from "../../../domain/value-objects/Ids";
import type { PARTY_ROLES, GLOBAL_PARTY_STATUSES, PARTY_SOURCES, AUTH_METHODS } from "../../../domain/values/enums";

/**
 * @summary Global party preferences for default behavior
 */
export type GlobalPartyPreferences = {
  /** Default authentication method */
  readonly defaultAuth: (typeof AUTH_METHODS)[number];
  /** Default locale preference */
  readonly defaultLocale?: string;
};

/**
 * @summary Statistics for a global party
 */
export type GlobalPartyStats = {
  /** Number of envelopes signed */
  readonly signedCount: number;
  /** Last signature timestamp */
  readonly lastSignedAt?: string;
  /** Total envelopes participated */
  readonly totalEnvelopes: number;
};

/**
 * @summary Notification preferences for a global party
 */
export type GlobalPartyNotificationPreferences = {
  /** Email notifications enabled */
  readonly email: boolean;
  /** SMS notifications enabled */
  readonly sms: boolean;
};

/**
 * @summary Common base for global party types
 */
export type GlobalPartyCommon = {
  /** The unique identifier of the global party */
  readonly partyId: PartyId;
  /** The tenant ID that owns the party */
  readonly tenantId: TenantId;
  /** The name of the party */
  readonly name: string;
  /** The email of the party */
  readonly email: string;
  /** The role of the party */
  readonly role: (typeof PARTY_ROLES)[number];
  /** The source of the party record */
  readonly source: (typeof PARTY_SOURCES)[number];
  /** The current status of the party */
  readonly status: (typeof GLOBAL_PARTY_STATUSES)[number];
  /** ISO timestamp when the party was created */
  readonly createdAt: string;
  /** ISO timestamp when the party was last updated */
  readonly updatedAt: string;
};

/**
 * @summary Minimal global party head used across app flows
 */
export type GlobalPartyHead = GlobalPartyCommon;

/**
 * @summary Extended global party with additional fields
 */
export type GlobalPartyExtended = GlobalPartyCommon & {
  /** Additional email addresses */
  readonly emails?: string[];
  /** The phone number of the party */
  readonly phone?: string;
  /** The locale preference of the party */
  readonly locale?: string;
  /** Tags for organization */
  readonly tags?: string[];
  /** Additional metadata for the party */
  readonly metadata?: Record<string, unknown>;
  /** Additional attributes for the party */
  readonly attributes?: Record<string, unknown>;
  /** Global party preferences */
  readonly preferences: GlobalPartyPreferences;
  /** Notification preferences for the party */
  readonly notificationPreferences: GlobalPartyNotificationPreferences;
  /** Statistics for the party */
  readonly stats: GlobalPartyStats;
};

/**
 * @summary Common patch shape for global party updates
 */
export type GlobalPartyPatch = {
  /** The new name for the party (optional) */
  readonly name?: string;
  /** The new email for the party (optional) */
  readonly email?: string;
  /** Additional email addresses (optional) */
  readonly emails?: string[];
  /** The new phone number for the party (optional) */
  readonly phone?: string;
  /** The new locale preference for the party (optional) */
  readonly locale?: string;
  /** The new role for the party (optional) */
  readonly role?: (typeof PARTY_ROLES)[number];
  /** The new source for the party (optional) */
  readonly source?: (typeof PARTY_SOURCES)[number];
  /** The new status for the party (optional) */
  readonly status?: (typeof GLOBAL_PARTY_STATUSES)[number];
  /** New tags for the party (optional) */
  readonly tags?: string[];
  /** New metadata for the party (optional) */
  readonly metadata?: Record<string, unknown>;
  /** New attributes for the party (optional) */
  readonly attributes?: Record<string, unknown>;
  /** New preferences for the party (optional) */
  readonly preferences?: Partial<GlobalPartyPreferences>;
  /** New notification preferences for the party (optional) */
  readonly notificationPreferences?: Partial<GlobalPartyNotificationPreferences>;
  /** New statistics for the party (optional) */
  readonly stats?: Partial<GlobalPartyStats>;
};

/**
 * @summary Global party row type for domain operations
 */
export type GlobalPartyRow = GlobalPartyExtended;
