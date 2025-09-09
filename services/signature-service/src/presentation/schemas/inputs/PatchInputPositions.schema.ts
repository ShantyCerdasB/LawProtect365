/**
 * @file PatchInputPositions.schema.ts
 * @description Request and response schemas for updating input positions in batch.
 * Defines Zod schemas for input position update payload validation and response formatting.
 */

/**
 * @file PatchInputPositions.schema.ts
 * @summary Request/response schemas for updating input positions in batch.
 */

import { z } from "@lawprotect/shared-ts";

/**
 * @description Body payload schema for updating input positions in batch.
 * Validates the array of input positions to update.
 */
export const PatchInputPositionsBody = z.object({
  /** Array of input positions to update */
  items: z.array(
    z.object({
      /** Input identifier */
      inputId: z.string(),
      /** Page number where the input is placed */
      page: z.number().int().positive(),
      /** X coordinate of the input */
      x: z.number().min(0),
      /** Y coordinate of the input */
      y: z.number().min(0),
    })
  ),
});
export type PatchInputPositionsBody = z.infer<typeof PatchInputPositionsBody>;

/**
 * @description Response payload schema for updated input positions.
 * Defines the structure of the response returned after successful position updates.
 */
export const PatchInputPositionsResponse = z.object({
  /** Number of inputs updated */
  updated: z.number(),
});
export type PatchInputPositionsResponse = z.infer<typeof PatchInputPositionsResponse>;








