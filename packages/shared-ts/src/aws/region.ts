/**
 * Region normalization and validation helpers.
 */

import { partitionForRegion } from "./partition.js";

/**
 * Returns the default region from environment variables.
 * Prefers AWS_REGION then AWS_DEFAULT_REGION.
 */
export const getDefaultRegion = (): string | undefined =>
  process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? undefined;

/**
 * Normalizes a region string or returns a default region from env.
 * @param region Region input or undefined.
 * @throws Error when neither input nor env provides a region.
 */
export const requireRegion = (region?: string): string => {
  const r = region ?? getDefaultRegion();
  if (!r) throw new Error("AWS region not configured");
  return r;
};

/**
 * Detects partition for the given region.
 * @param region Region identifier.
 */
export const detectPartition = (region: string) => partitionForRegion(region);

/**
 * Performs a shallow region shape validation.
 * Accepts "^[a-z]{2}-[a-z-]+-\\d+$" by default.
 * @param region Region string.
 */
export const isValidRegion = (region: string): boolean =>
  /^[a-z]{2}-[a-z-]+-\d+$/.test(region);
