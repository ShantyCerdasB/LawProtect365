import { z, TrimmedString } from "@lawprotect/shared-ts";

/**
 * Consent record with user agent details and locale.
 */
export const ConsentRecordSchema = z.object({
  timestamp: z.string().datetime({ offset: true }),
  ip: TrimmedString.pipe(z.string().min(3)),
  userAgent: TrimmedString,
  locale: TrimmedString.pipe(z.string().min(2)).pipe(z.string().max(35)).optional(),
});

export type ConsentRecord = z.infer<typeof ConsentRecordSchema>;
