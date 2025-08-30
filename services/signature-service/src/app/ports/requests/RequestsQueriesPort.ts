/**
 * @file RequestsQueriesPort.ts
 * @summary Port for request query operations.
 * @description Defines the interface for read-only operations on envelope requests.
 * This port provides methods to retrieve request-related data without modifying it.
 */

import type { EnvelopeId, PartyId } from "../shared";

/**
 * @description Query parameters for getting invitation statistics.
 */
export interface GetInvitationStatsQuery {
  /** The envelope ID to get stats for */
  envelopeId: EnvelopeId;
  /** Optional party ID to filter stats for a specific party */
  partyId?: PartyId;
}

/**
 * @description Result containing invitation statistics.
 */
export interface InvitationStats {
  /** The envelope ID these stats belong to */
  envelopeId: EnvelopeId;
  /** The party ID these stats belong to (if filtered) */
  partyId?: PartyId;
  /** Number of invitations sent today */
  sentToday: number;
  /** Timestamp of the last invitation sent */
  lastSentAt?: string;
  /** Whether the party is currently rate limited */
  isRateLimited: boolean;
  /** When the rate limit expires (if applicable) */
  rateLimitExpiresAt?: string;
}

/**
 * @description Query parameters for getting party status.
 */
export interface GetPartyStatusQuery {
  /** The envelope ID to get party status for */
  envelopeId: EnvelopeId;
  /** The party ID to get status for */
  partyId: PartyId;
}

/**
 * @description Result containing party status information.
 */
export interface PartyStatus {
  /** The party ID */
  partyId: PartyId;
  /** The current status of the party */
  status: string;
  /** Whether the party has been invited */
  isInvited: boolean;
  /** Whether the party has signed */
  hasSigned: boolean;
  /** Whether the party has declined */
  hasDeclined: boolean;
  /** Timestamp when the party was last invited */
  lastInvitedAt?: string;
  /** Timestamp when the party last signed */
  lastSignedAt?: string;
}

/**
 * @description Port interface for request query operations.
 * 
 * This port defines the contract for read-only operations on envelope requests.
 * Implementations should provide efficient data retrieval without side effects.
 */
export interface RequestsQueriesPort {
  /**
   * @description Gets invitation statistics for an envelope or specific party.
   *
   * @param {GetInvitationStatsQuery} query - Query parameters for getting invitation stats
   * @returns {Promise<InvitationStats>} Promise resolving to invitation statistics
   */
  getInvitationStats(query: GetInvitationStatsQuery): Promise<InvitationStats>;

  /**
   * @description Gets the status of a specific party in an envelope.
   *
   * @param {GetPartyStatusQuery} query - Query parameters for getting party status
   * @returns {Promise<PartyStatus>} Promise resolving to party status information
   */
  getPartyStatus(query: GetPartyStatusQuery): Promise<PartyStatus>;
}

