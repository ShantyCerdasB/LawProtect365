/**
 * @file OtpVerify.schema.ts
 * @summary Request schema for verifying an OTP code.
 */

import { z } from "@lawprotect/shared-ts";
import { EnvelopeId, PartyId } from "@/schemas/common/path";

/** Body payload for verifying an OTP (6 numeric digits). */
export const OtpVerifyBody = z.object({
  envelopeId: EnvelopeId,
  signerId: PartyId,
  code: z.string().regex(/^\d{6}$/, "Must be a 6-digit code"),
});
export type OtpVerifyBody = z.infer<typeof OtpVerifyBody>;
