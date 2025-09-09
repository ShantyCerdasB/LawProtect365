/**
 * @file ConsentRecord.ts
 * @summary Consent record value object for user consent tracking
 * @description Consent record value object for user consent tracking.
 * Provides schema for consent records with user agent details, IP address,
 * and locale information for compliance and audit purposes.
 */

import { z, TrimmedString } from "@lawprotect/shared-ts";

/**
 * @description Consent record schema with user agent details and locale.
 * Contains timestamp, IP address, user agent, and optional locale for consent tracking.
 */
export const ConsentRecordSchema = z.object({
  /** Consent timestamp (ISO datetime with offset) */
  timestamp: z.string().datetime({ offset: true }),
  /** IP address (minimum 3 characters) */
  ip: TrimmedString.pipe(z.string().min(3)),
  /** User agent string */
  userAgent: TrimmedString,
  /** Optional locale (2-35 characters) */
  locale: TrimmedString.pipe(z.string().min(2)).pipe(z.string().max(35)).optional(),
});

export type ConsentRecord = z.infer<typeof ConsentRecordSchema>;



