/**
 * @file GlobalPartyStats.ts
 * @summary Global party statistics value object for contacts
 * @description Global party statistics value object for tracking contact activity.
 * Provides validation and utilities for managing contact statistics.
 */

import { z } from "@lawprotect/shared-ts";

/**
 * @description Global party statistics schema for contacts.
 * Validates statistics data for contacts.
 */
export const GlobalPartyStatsSchema = z.object({
  signedCount: z.number().int().min(0, "Signed count cannot be negative"),
  lastSignedAt: z.string().datetime().optional(),
  totalEnvelopes: z.number().int().min(0, "Total envelopes cannot be negative"),
});
export type GlobalPartyStats = z.infer<typeof GlobalPartyStatsSchema>;

/**
 * @description Default statistics for new global parties.
 * Provides initial statistics for new contacts.
 */
export const DEFAULT_GLOBAL_PARTY_STATS: GlobalPartyStats = {
  signedCount: 0,
  totalEnvelopes: 0,
};

/**
 * @description Creates statistics from raw data.
 * 
 * @param data - Raw statistics data
 * @returns GlobalPartyStats object
 */
export const createGlobalPartyStats = (data: {
  signedCount?: number;
  lastSignedAt?: string;
  totalEnvelopes?: number;
}): GlobalPartyStats => {
  return {
    signedCount: data.signedCount ?? 0,
    lastSignedAt: data.lastSignedAt,
    totalEnvelopes: data.totalEnvelopes ?? 0,
  };
};

/**
 * @description Increments signed count and updates last signed timestamp.
 * 
 * @param stats - Current statistics
 * @returns Updated statistics
 */
export const incrementSignedCount = (stats: GlobalPartyStats): GlobalPartyStats => {
  return {
    ...stats,
    signedCount: stats.signedCount + 1,
    lastSignedAt: new Date().toISOString(),
  };
};

/**
 * @description Increments total envelopes count.
 * 
 * @param stats - Current statistics
 * @returns Updated statistics
 */
export const incrementTotalEnvelopes = (stats: GlobalPartyStats): GlobalPartyStats => {
  return {
    ...stats,
    totalEnvelopes: stats.totalEnvelopes + 1,
  };
};



