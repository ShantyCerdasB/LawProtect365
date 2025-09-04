/**
 * @file AddViewer.schema.ts
 * @summary Schema for adding a viewer to an envelope
 * @description Zod schemas for validating add viewer requests
 */

import { z } from "zod";
import { EnvelopeIdSchema } from "../../../domain/value-objects/Ids";

/**
 * @description Request body schema for adding a viewer
 */
export const AddViewerBody = z.object({
  email: z.string().email("Invalid email format").max(255, "Email too long"),
  name: z.string().max(255, "Name too long").optional(),
  locale: z.string().max(10, "Locale too long").optional(),
});

/**
 * @description Path parameters schema for envelope operations
 */
export const EnvelopePath = z.object({
  envelopeId: EnvelopeIdSchema,
});

/**
 * @description Type for AddViewer request body
 */
export type AddViewerBody = z.infer<typeof AddViewerBody>;

/**
 * @description Type for envelope path parameters
 */
export type EnvelopePath = z.infer<typeof EnvelopePath>;