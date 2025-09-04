/**
 * @file GetInput.schema.ts
 * @description Query and response schemas for getting a single input.
 * Defines Zod schemas for input retrieval query parameters and response formatting.
 */

import { z } from "@lawprotect/shared-ts";

/**
 * @description Query parameters schema for getting a single input.
 * No query parameters needed for this endpoint.
 */
export const GetInputQuery = z.object({});
export type GetInputQuery = z.infer<typeof GetInputQuery>;

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
  /** Position of the input */
  position: z.object({
    x: z.number(),
    y: z.number(),
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
