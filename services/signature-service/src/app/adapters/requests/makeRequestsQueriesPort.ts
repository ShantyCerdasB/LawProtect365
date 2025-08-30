/**
 * @file makeRequestsQueriesPort.ts
 * @summary Factory for RequestsQueriesPort.
 * @description Creates and configures the RequestsQueriesPort implementation,
 * adapting between the app service layer and repositories. Handles dependency injection
 * and type conversions for request query operations.
 */

import type { Repository } from "@lawprotect/shared-ts";
import type { Envelope } from "@/domain/entities/Envelope";
import type { Party } from "@/domain/entities/Party";
import type { EnvelopeId, PartyId } from "@/domain/value-objects/Ids";
import type { 
  RequestsQueriesPort, 
  GetInvitationStatsQuery, 
  InvitationStats,
  GetPartyStatusQuery,
  PartyStatus,
} from "@/app/ports/requests/RequestsQueriesPort";

/**
 * @description Dependencies required by the RequestsQueriesPort adapter.
 */
export interface RequestsQueriesPortDependencies {
  /** Repository dependencies */
  repos: {
    /** Envelope repository */
    envelopes: Repository<Envelope, EnvelopeId>;
    /** Party repository */
    parties: Repository<Party, PartyId>;
  };
}

/**
 * @description Creates a RequestsQueriesPort implementation.
 * 
 * @param {RequestsQueriesPortDependencies} deps - Dependencies including repositories
 * @returns {RequestsQueriesPort} Configured RequestsQueriesPort implementation
 */
export const makeRequestsQueriesPort = (
  deps: RequestsQueriesPortDependencies
): RequestsQueriesPort => {
  return {
    /**
     * @description Gets invitation statistics for an envelope or specific party.
     * 
     * @param {GetInvitationStatsQuery} query - Query parameters for getting invitation stats
     * @returns {Promise<InvitationStats>} Promise resolving to invitation statistics
     */
    async getInvitationStats(query: GetInvitationStatsQuery): Promise<InvitationStats> {
      // Get envelope to validate it exists
      const envelope = await deps.repos.envelopes.getById(query.envelopeId);
      if (!envelope) {
        throw new Error(`Envelope not found: ${query.envelopeId}`);
      }

      // If partyId is specified, get stats for that specific party
      if (query.partyId) {
        const party = await deps.repos.parties.getById(query.partyId);
        if (!party) {
          throw new Error(`Party not found: ${query.partyId}`);
        }

        // Calculate stats for specific party
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const sentToday = party.invitedAt && new Date(party.invitedAt) >= today ? 1 : 0;
        
        // Simple rate limiting logic (can be enhanced with actual rate limit store)
        const isRateLimited = false; // TODO: Implement actual rate limiting logic
        const rateLimitExpiresAt = undefined; // TODO: Calculate from rate limit store

        return {
          envelopeId: query.envelopeId,
          partyId: query.partyId,
          sentToday,
          lastSentAt: party.invitedAt,
          isRateLimited,
          rateLimitExpiresAt,
        };
      }

      // Get stats for all parties in the envelope
      const parties = await Promise.all(
        envelope.parties.map(partyId => deps.repos.parties.getById(partyId as any))
      );

      const validParties = parties.filter(Boolean) as Party[];
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const sentToday = validParties.reduce((count, party) => {
        return count + (party.invitedAt && new Date(party.invitedAt) >= today ? 1 : 0);
      }, 0);

      const lastInvitedParty = validParties
        .filter(party => party.invitedAt)
        .sort((a, b) => new Date(b.invitedAt!).getTime() - new Date(a.invitedAt!).getTime())[0];

      return {
        envelopeId: query.envelopeId,
        sentToday,
        lastSentAt: lastInvitedParty?.invitedAt,
        isRateLimited: false, // TODO: Implement actual rate limiting logic
        rateLimitExpiresAt: undefined,
      };
    },

    /**
     * @description Gets the status of a specific party in an envelope.
     * 
     * @param {GetPartyStatusQuery} query - Query parameters for getting party status
     * @returns {Promise<PartyStatus>} Promise resolving to party status information
     */
    async getPartyStatus(query: GetPartyStatusQuery): Promise<PartyStatus> {
      // Get envelope to validate it exists
      const envelope = await deps.repos.envelopes.getById(query.envelopeId);
      if (!envelope) {
        throw new Error(`Envelope not found: ${query.envelopeId}`);
      }

      // Get party to validate it exists and belongs to the envelope
      const party = await deps.repos.parties.getById(query.partyId);
      if (!party) {
        throw new Error(`Party not found: ${query.partyId}`);
      }

      // Validate party belongs to the envelope
      if (!envelope.parties.includes(query.partyId)) {
        throw new Error(`Party ${query.partyId} does not belong to envelope ${query.envelopeId}`);
      }

      return {
        partyId: query.partyId,
        status: party.status,
        isInvited: !!party.invitedAt,
        hasSigned: party.status === "signed",
        hasDeclined: party.status === "declined",
        lastInvitedAt: party.invitedAt,
        lastSignedAt: party.signedAt,
      };
    },
  };
};
