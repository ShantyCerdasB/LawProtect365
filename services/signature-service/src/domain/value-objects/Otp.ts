/**
 * @file Otp.ts
 * @summary OTP value objects for authentication and delivery channels
 * @description OTP value objects for authentication and delivery channels.
 * Provides schemas for OTP delivery channels and one-time passwords
 * with expiration and channel validation for secure authentication.
 */

import { z, TrimmedString } from "@lawprotect/shared-ts";
import { OTP_CHANNELS } from "../values/enums";

/**
 * @description OTP delivery channels schema.
 * Validates that the channel is one of the supported OTP delivery methods.
 */
export const OtpChannelSchema = z.enum(OTP_CHANNELS);
export type OtpChannel = z.infer<typeof OtpChannelSchema>;

/**
 * @description One-time password schema with channel and expiration.
 * Contains OTP code, delivery channel, and expiration timestamp for authentication.
 */
export const OtpSchema = z.object({
  /** OTP code (4-10 characters) */
  code: TrimmedString.pipe(z.string().min(4)).pipe(z.string().max(10)),
  /** Delivery channel for the OTP */
  channel: OtpChannelSchema,
  /** Expiration timestamp (ISO datetime with offset) */
  expiresAt: z.string().datetime({ offset: true }),
});

export type Otp = z.infer<typeof OtpSchema>;
