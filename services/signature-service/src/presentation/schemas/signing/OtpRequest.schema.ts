/**
 * @file OtpRequest.schema.ts
 * @summary Request schema for initiating an OTP challenge.
 */

import { z } from "@lawprotect/shared-ts";
import { UuidV4 } from "@lawprotect/shared-ts";

/** Body payload for requesting an OTP. */
export const OtpRequestBody = z.object({
  envelopeId: UuidV4,
  signerId: UuidV4,
  delivery: z.enum(["sms", "email"]),
});
export type OtpRequestBody = z.infer<typeof OtpRequestBody>;
