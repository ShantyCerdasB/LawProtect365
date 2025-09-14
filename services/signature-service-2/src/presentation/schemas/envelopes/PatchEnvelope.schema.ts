/**
 * @file PatchEnvelope.schema.ts
 * @summary Request schema for updating an envelope.
 * @description Defines Zod schema for partial envelope update operations
 */

import { z } from "@lawprotect/shared-ts";
import { EnvelopeNameFields, EnvelopeStatusFields } from "./common";

/** Body payload for partially updating an envelope. */
export const PatchEnvelopeBody = EnvelopeNameFields.merge(EnvelopeStatusFields);
export type PatchEnvelopeBody = z.infer<typeof PatchEnvelopeBody>;

