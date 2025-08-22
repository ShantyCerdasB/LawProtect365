import { z } from "@lawprotect/shared-ts";

/**
 * Envelope lifecycle status.
 */
export const EnvelopeStatusSchema = z.enum([
  "draft",
  "sent",
  "completed",
  "cancelled",
  "declined",
]);

export type EnvelopeStatus = z.infer<typeof EnvelopeStatusSchema>;
