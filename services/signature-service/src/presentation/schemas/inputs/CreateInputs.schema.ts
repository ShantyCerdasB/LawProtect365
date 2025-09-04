/**
 * @file CreateInputs.schema.ts
 * @summary Request/response schemas for creating inputs in batch.
 */

import { z } from "@lawprotect/shared-ts";
import { UuidV4 } from "@lawprotect/shared-ts";
import { INPUT_VALUES } from "@/domain/values/enums";

/**
 * @description Body payload schema for creating inputs in batch.
 * Validates the required fields for input creation including document ID and input array.
 */
export const CreateInputsBody = z.object({
  /** Document identifier (UUID v4) */
  documentId: UuidV4,
  /** Array of inputs to create */
  inputs: z.array(
    z.object({
      /** Type of input (signature, initials, text, date, checkbox) */
      type: z.enum(INPUT_VALUES),
      /** Page number where the input is placed */
      page: z.number().int().positive(),
      /** X coordinate of the input */
      x: z.number().min(0),
      /** Y coordinate of the input */
      y: z.number().min(0),
      /** Whether the input is required */
      required: z.boolean().default(true),
      /** Party ID assigned to this input (optional) */
      partyId: z.string().uuid().optional(),
      /** Initial value of the input (optional) */
      value: z.string().optional(),
    })
  ),
});
export type CreateInputsBody = z.infer<typeof CreateInputsBody>;

/**
 * @description Response payload schema for newly created inputs.
 * Defines the structure of the response returned after successful input creation.
 */
export const CreateInputsResponse = z.object({
  /** Array of created input data */
  items: z.array(
    z.object({
      /** The unique identifier of the created input */
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
    })
  ),
  /** Number of inputs created */
  count: z.number(),
});
export type CreateInputsResponse = z.infer<typeof CreateInputsResponse>;
