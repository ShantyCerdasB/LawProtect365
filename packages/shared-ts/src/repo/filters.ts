/**
 * @fileoverview Repository filter utilities
 * @summary Provides common filter utilities for repository queries
 * @description This module provides utilities for creating common filter patterns
 * used in repository queries, including text search and date range filtering.
 */

/**
 * Creates a case-insensitive text contains filter
 * @param v - The text value to search for
 * @returns Prisma filter object or undefined if no value
 */
export const textContainsInsensitive = (v?: string) =>
  v ? { contains: v, mode: 'insensitive' as const } : undefined;

/**
 * Creates a date range filter
 * @param before - The upper bound date (exclusive)
 * @param after - The lower bound date (inclusive)
 * @returns Prisma filter object or undefined if no range specified
 */
export function rangeFilter(before?: Date, after?: Date) {
  if (!before && !after) return undefined;
  const out: any = {};
  if (before) out.lt = before;
  if (after)  out.gte = after;
  return out;
}
