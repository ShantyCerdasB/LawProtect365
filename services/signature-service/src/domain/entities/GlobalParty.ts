/**
 * @file GlobalParty.ts
 * @summary Global party domain entity for address book
 * @description Global party domain entity representing contacts in the address book.
 * These are reusable party records that can be referenced across multiple envelopes.
 */

import type { PartyRole, GlobalPartyStatus, PartySource } from "../values/enums";
import type { PartyMetadata } from "../value-objects/party/PartyMetadata";

/**
 * @description Notification preferences for a global party.
 * Defines how the party should be notified about envelope activities.
 */
export interface NotificationPreferences {
  /** Email notifications enabled */
  email: boolean;
  /** SMS notifications enabled */
  sms: boolean;
}

/**
 * @description Global party preferences for default behavior.
 */
export interface GlobalPartyPreferences {
  /** Default authentication method */
  defaultAuth: string;
  /** Default locale preference */
  defaultLocale?: string;
}

/**
 * @description Statistics for a global party.
 */
export interface GlobalPartyStats {
  /** Number of envelopes signed */
  signedCount: number;
  /** Last signature timestamp */
  lastSignedAt?: string;
  /** Total envelopes participated */
  totalEnvelopes: number;
}

/**
 * @description Global party domain entity representing a contact in the address book.
 * Contains party identification, contact information, and preferences for reuse across envelopes.
 */
export interface GlobalParty {
  /** Unique identifier of the global party */
  id: string;
  /** Tenant identifier */
  tenantId: string;
  /** Full name of the party */
  name: string;
  /** Primary email address of the party */
  email: string;
  /** Additional email addresses */
  emails?: string[];
  /** Optional phone number of the party */
  phone?: string;
  /** Optional locale preference */
  locale?: string;
  /** Default role when added to envelopes */
  role: PartyRole;
  /** Source of the party record */
  source: PartySource;
  /** Current status of the party */
  status: GlobalPartyStatus;
  /** Tags for organization */
  tags?: string[];
  /** Optional metadata for additional information */
  metadata?: PartyMetadata;
  /** Additional attributes (company, position, etc.) */
  attributes?: Record<string, unknown>;
  /** Global party preferences */
  preferences: GlobalPartyPreferences;
  /** Notification preferences */
  notificationPreferences: NotificationPreferences;
  /** Statistics */
  stats: GlobalPartyStats;
  /** Creation timestamp (ISO 8601) */
  createdAt: string;
  /** Last update timestamp (ISO 8601) */
  updatedAt: string;
}
