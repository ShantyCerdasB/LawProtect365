/**
 * @file PatchInput.schema.ts
 * @description Request and response schemas for updating an input.
 * Defines Zod schemas for input update payload validation and response formatting.
 */

/**
 * @file PatchInput.schema.ts
 * @summary Request/response schemas for updating an input.
 */

import { INPUT_VALUES } from "@/domain/values/enums";
import { z } from "@lawprotect/shared-ts";

/**
 * @description Body payload schema for updating an input.
 * Validates the fields that can be updated for an input.
 */
export const PatchInputBody = z.object({
  /** Type of input (optional) */
  type: z.enum(INPUT_VALUES).optional(),
  /** Page number (optional) */
  page: z.number().int().positive().optional(),
  /** X coordinate (optional) */
  x: z.number().min(0).optional(),
  /** Y coordinate (optional) */
  y: z.number().min(0).optional(),
  /** Whether the input is required (optional) */
  required: z.boolean().optional(),
  /** Party ID assigned to this input (optional) */
  partyId: z.string().uuid().optional(),
  /** Value of the input (optional) */
  value: z.string().optional()});
export type PatchInputBody = z.infer<typeof PatchInputBody>;

/**
 * @description Response payload schema for an updated input.
 * Defines the structure of the response returned after successful input update.
 */
export const PatchInputResponse = z.object({
  /** The unique identifier of the updated input */
  inputId: z.string(),
  /** ISO timestamp when the input was updated */
  updatedAt: z.string().datetime()});
export type PatchInputResponse = z.infer<typeof PatchInputResponse>;

