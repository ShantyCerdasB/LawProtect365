/**
 * @file ListInputs.schema.ts
 * @description Request and response schemas for listing inputs.
 * Defines Zod schemas for input listing query parameters and response formatting.
 */

/**
 * @file ListInputs.schema.ts
 * @summary Request/response schemas for listing inputs.
 */

import { z } from "@lawprotect/shared-ts";

/**
 * @description Query parameters schema for listing inputs.
 * Validates query parameters for input listing with pagination.
 */
export const ListInputsQuery = z.object({
  /** Maximum number of inputs to return */
  limit: z.coerce.number().int().positive().max(100).optional(),
  /** Pagination cursor for getting the next page */
  cursor: z.string().optional(),
});
export type ListInputsQuery = z.infer<typeof ListInputsQuery>;

/**
 * @description Response payload schema for input listing.
 * Defines the structure of the response returned for input listing.
 */
export const ListInputsResponse = z.object({
  /** Array of input data */
  items: z.array(
    z.object({
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
    })
  ),
  /** Cursor for the next page of results (optional) */
  nextCursor: z.string().optional(),
});
export type ListInputsResponse = z.infer<typeof ListInputsResponse>;


