/**
 * @file PartyMetadata.ts
 * @summary Party metadata value object for additional information
 * @description Provides structured metadata for parties including contact information,
 * preferences, and custom fields. Supports extensible metadata for party management.
 */

import { z } from "zod";
import type { Brand } from "@lawprotect/shared-ts";

/**
 * Branded type for party metadata
 * Prevents mixing with other object types at compile time
 */
export type PartyMetadata = Brand<Record<string, unknown>, "PartyMetadata">;

/**
 * Zod schema for party metadata validation
 * Allows flexible metadata structure with some constraints
 */
export const PartyMetadataSchema = z
  .record(z.unknown())
  .refine(
    (data) => {
      // Ensure metadata doesn't exceed reasonable size
      const jsonSize = JSON.stringify(data).length;
      return jsonSize <= 10000; // 10KB limit
    },
    {
      message: "Party metadata too large (max 10KB)",
    }
  )
  .transform((v) => v as PartyMetadata);

/**
 * Creates PartyMetadata from a record
 * @param metadata - The metadata record to validate
 * @returns The validated PartyMetadata
 * @throws {ZodError} When the metadata is invalid
 */
export const toPartyMetadata = (metadata: Record<string, unknown>): PartyMetadata => {
  return PartyMetadataSchema.parse(metadata);
};

/**
 * Safely creates PartyMetadata from a record
 * @param metadata - The metadata record to validate
 * @returns The validated PartyMetadata or null if invalid
 */
export const toPartyMetadataSafe = (metadata: Record<string, unknown>): PartyMetadata | null => {
  const result = PartyMetadataSchema.safeParse(metadata);
  return result.success ? result.data : null;
};

/**
 * Type guard to check if a value is valid PartyMetadata
 * @param value - The value to check
 * @returns True if the value is valid PartyMetadata
 */
export const isPartyMetadata = (value: unknown): value is PartyMetadata => {
  return PartyMetadataSchema.safeParse(value).success;
};

/**
 * Merges two PartyMetadata objects
 * @param base - The base metadata
 * @param updates - The updates to merge
 * @returns Merged PartyMetadata
 */
export const mergePartyMetadata = (
  base: PartyMetadata,
  updates: PartyMetadata
): PartyMetadata => {
  const merged = { ...base, ...updates };
  return toPartyMetadata(merged);
};

/**
 * Extracts specific metadata field
 * @param metadata - The party metadata
 * @param key - The key to extract
 * @returns The value or undefined if not found
 */
export const getPartyMetadataField = <T = unknown>(
  metadata: PartyMetadata,
  key: string
): T | undefined => {
  return (metadata as Record<string, unknown>)[key] as T | undefined;
};

/**
 * Sets a specific metadata field
 * @param metadata - The party metadata
 * @param key - The key to set
 * @param value - The value to set
 * @returns Updated PartyMetadata
 */
export const setPartyMetadataField = (
  metadata: PartyMetadata,
  key: string,
  value: unknown
): PartyMetadata => {
  const updated = { ...(metadata as Record<string, unknown>), [key]: value };
  return toPartyMetadata(updated);
};
