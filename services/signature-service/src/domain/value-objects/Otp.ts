import { z, TrimmedString } from "@lawprotect/shared-ts";
import { OTP_CHANNELS } from "../values/enums";

/**
 * OTP delivery channels.
 */
export const OtpChannelSchema = z.enum(OTP_CHANNELS);
export type OtpChannel = z.infer<typeof OtpChannelSchema>;

/**
 * One-time password with channel and expiration.
 */
export const OtpSchema = z.object({
  code: TrimmedString.pipe(z.string().min(4)).pipe(z.string().max(10)),
  channel: OtpChannelSchema,
  expiresAt: z.string().datetime({ offset: true }),
});

export type Otp = z.infer<typeof OtpSchema>;
