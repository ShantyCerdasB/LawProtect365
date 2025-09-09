// consents/DeleteConsent.schema.ts
import { z, ISODateStringSchema } from "@lawprotect/shared-ts";
import { EnvelopeConsentPath } from "../common/consent.common";


/** Path: DELETE /envelopes/:envelopeId/consents/:consentId */
export const DeleteConsentPath = EnvelopeConsentPath;

/** Response */
export const DeleteConsentResponse = z.object({
  message: z.string(),
  consentId:  EnvelopeConsentPath.shape.consentId,
  envelopeId: EnvelopeConsentPath.shape.envelopeId,
  deletedAt: ISODateStringSchema,
});

export type DeleteConsentPathType = z.infer<typeof DeleteConsentPath>;
export type DeleteConsentResponseType = z.infer<typeof DeleteConsentResponse>;










