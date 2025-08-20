/**
 * @file OtpVerify.schema.ts
 * @summary Request schema for verifying an OTP code.
 */

import { z } from "@lawprotect/shared-ts";
import { UuidV4 } from "@lawprotect/shared-ts";

/** Body payload for verifying an OTP. */
export const OtpVerifyBody = z.object({
  envelopeId: UuidV4,
  signerId: UuidV4,
  code: z.string().length(6),
});
export type OtpVerifyBody = z.infer<typeof OtpVerifyBody>;
