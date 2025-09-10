/**
 * @file GlobalPartyStats.interface.ts
 * @summary Global party statistics interface
 * @description Global party statistics interface for tracking contact activity.
 * Provides the interface structure for managing contact statistics.
 */

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

