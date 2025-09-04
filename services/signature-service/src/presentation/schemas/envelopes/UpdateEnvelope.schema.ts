/**
 * @file UpdateEnvelope.schema.ts
 * @summary Request/response schemas for updating an envelope
 * @description Defines Zod schemas for envelope update operations
 */

import { z } from "@lawprotect/shared-ts";
import { 
  EnvelopeWithIdParams, 
  BaseEnvelopeFields, 
  EnvelopeTitleField,
  ENVELOPE_STATUSES, 
  ENVELOPE_VALIDATION_RULES 
} from "./common";

/**
 * @description Path parameters schema for updating an envelope
 */
export const UpdateEnvelopeParams = EnvelopeWithIdParams;
export type UpdateEnvelopeParams = z.infer<typeof UpdateEnvelopeParams>;

/**
 * @description Body payload schema for updating an envelope
 */
export const UpdateEnvelopeBody = z.object({
  title: EnvelopeTitleField.min(ENVELOPE_VALIDATION_RULES.MIN_TITLE_LENGTH).max(ENVELOPE_VALIDATION_RULES.MAX_TITLE_LENGTH).optional(),
  status: z.enum(ENVELOPE_STATUSES).optional(),
});

export type UpdateEnvelopeBody = z.infer<typeof UpdateEnvelopeBody>;

/**
 * @description Response schema for updated envelope
 */
export const UpdateEnvelopeResponse = BaseEnvelopeFields.extend({
  title: EnvelopeTitleField,
});

export type UpdateEnvelopeResponse = z.infer<typeof UpdateEnvelopeResponse>;
