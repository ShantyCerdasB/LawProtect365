/**
 * @file SubmitConsent.schema.ts
 * @summary Zod schemas for POST /envelopes/:envelopeId/consents/:consentId/submit
 *
 * Reuses common path/enums/metadata helpers and the domain ConsentRecord VO.
 * - Path: Envelope + Consent ids (ULID/UUID) from shared schema.
 * - Body: consent evidence + optional metadata.
 */

import { z } from "@lawprotect/shared-ts";

// Prefer the consent.common helpers (also define EnvelopeConsentPath there).
// If you centralize paths in Path.ts instead, swap the import accordingly.
import {
  EnvelopeConsentPath as _EnvelopeConsentPath,
  MetadataSchema,
} from "@/schemas/common/consent.common";

// Domain VO for consent evidence: { timestamp, ip, userAgent, locale? }
import { ConsentRecordSchema } from "@/domain/value-objects/ConsentRecord";

/** Path params: /envelopes/:envelopeId/consents/:consentId */
export const SubmitConsentPath = _EnvelopeConsentPath;

/** Request body: consent evidence + optional metadata */
export const SubmitConsentBody = z.object({
  /** Evidence/audit for the consent action (validated VO) */
  consent: ConsentRecordSchema,
  /** Optional metadata stored alongside the consent */
  metadata: MetadataSchema.optional(),
});

export type SubmitConsentPathInput = z.infer<typeof SubmitConsentPath>;
export type SubmitConsentBodyInput = z.infer<typeof SubmitConsentBody>;
