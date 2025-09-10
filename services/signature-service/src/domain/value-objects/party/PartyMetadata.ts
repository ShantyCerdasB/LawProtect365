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
      message: "Party metadata too large (max 10KB)"}
  )
  .transform((v) => v as PartyMetadata);

// Helper functions removed - use PartyMetadataSchema.parse() for validation
// Metadata operations can be done directly with object spread and property access

