/**
 * @file types.party.ts
 * @summary Party-specific types shared across party ports
 * @description Defines party-related interfaces used by party port implementations
 */

import type { PartyId, EnvelopeId, PartyRole, PartyStatus } from "../common";

/**
 * Minimal party head used across app flows
 */
export type PartyHead = {
  /** The unique identifier of the party */
  partyId: PartyId;
  /** The envelope ID this party belongs to */
  envelopeId: EnvelopeId;
  /** The email address of the party (optional) */
  email?: string;
  /** The name of the party (optional) */
  name?: string;
  /** The role of the party in the envelope (optional) */
  role?: PartyRole;
  /** The current status of the party (optional) */
  status?: PartyStatus;
  /** The order/sequence of the party in the envelope (optional) */
  order?: number;
};

/**
 * Common patch shape for party updates
 */
export type PartyPatch = {
  /** The new email address for the party (optional) */
  email?: string;
  /** The new name for the party (optional) */
  name?: string;
  /** The new role for the party (optional) */
  role?: PartyRole;
  /** The new status for the party (optional) */
  status?: PartyStatus;
  /** The new order/sequence for the party (optional) */
  order?: number;
  /** Additional metadata for the party (optional) */
  metadata?: Record<string, unknown>;
};

/**
 * Party row type for database operations
 * Allows both branded types and strings for flexibility
 */
export type PartyRow = {
  /** The unique identifier of the party */
  partyId: PartyId | string;
  /** The envelope ID this party belongs to */
  envelopeId: EnvelopeId | string;
  /** The email address of the party (optional) */
  email?: string;
  /** The name of the party (optional) */
  name?: string;
  /** The role of the party in the envelope (optional) */
  role?: PartyRole | string;
  /** The current status of the party (optional) */
  status?: PartyStatus | string;
  /** The order/sequence of the party in the envelope (optional) */
  order?: number;
};
