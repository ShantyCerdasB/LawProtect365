/**
 * @file PatchEnvelopeDocument.schema.ts
 * @summary Request schema for updating envelope document metadata.
 */

import { z } from "@lawprotect/shared-ts";

/** Body payload for patching a document inside an envelope. */
export const PatchEnvelopeDocumentBody = z.object({
  name: z.string().min(1).max(255).optional(),
  order: z.number().int().positive().optional()});
export type PatchEnvelopeDocumentBody = z.infer<typeof PatchEnvelopeDocumentBody>;

