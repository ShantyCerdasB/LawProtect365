/**
 * @file GetInput.schema.ts
 * @description Response schema for getting a single input.
 * Defines Zod schema for input retrieval response formatting.
 */

import { z } from "@lawprotect/shared-ts";

/**
 * @description Response payload schema for a single input.
 * Defines the structure of the response returned for input retrieval.
 */
export const GetInputResponse = z.object({
  /** The unique identifier of the input */
  inputId: z.string(),
  /** Type of the input */
  type: z.string(),
  /** Page number where the input is placed */
  page: z.number(),
  /** Geometry of the input */
  geometry: z.object({
    x: z.number(),
    y: z.number(),
    w: z.number(),
    h: z.number(),
  }),
  /** Party ID assigned to this input (optional) */
  assignedPartyId: z.string().optional(),
  /** Whether the input is required */
  required: z.boolean(),
  /** Current value of the input (optional) */
  value: z.string().optional(),
  /** ISO timestamp when the input was created */
  createdAt: z.string().datetime(),
  /** ISO timestamp when the input was last updated */
  updatedAt: z.string().datetime(),
});
export type GetInputResponse = z.infer<typeof GetInputResponse>;
