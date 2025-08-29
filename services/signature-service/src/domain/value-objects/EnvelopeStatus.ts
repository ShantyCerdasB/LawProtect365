import { z } from "@lawprotect/shared-ts";
import { ENVELOPE_STATUSES } from "../values/enums";

/**
 * Envelope lifecycle status.
 */
export const EnvelopeStatusSchema = z.enum(ENVELOPE_STATUSES);
export type EnvelopeStatus = z.infer<typeof EnvelopeStatusSchema>;