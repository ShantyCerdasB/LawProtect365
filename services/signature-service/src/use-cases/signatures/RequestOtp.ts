import type { EventEnvelope, ISODateString } from "@lawprotect/shared-ts";
import { asISO } from "@lawprotect/shared-ts";
import { envelopeNotFound, partyNotFound, requestTokenInvalid } from "@/errors";
import { assertRequestToken } from "@/domain/rules/Token.rules";
import { OTP_POLICY } from "@/domain/values/enums";
import { generateNumericOtp, hashOtp } from "@lawprotect/shared-ts";

import type {
  OtpRequestInput,
  OtpRequestOutput,
  OtpRequestContext,
} from "@/use-cases/shared/types/otp";

export const executeRequestOtp = async (
  input: OtpRequestInput,
  ctx: OtpRequestContext
): Promise<OtpRequestOutput> => {
  try {
    assertRequestToken(input.token, "signing", ctx.time.now());
  } catch (error) {
    throw requestTokenInvalid({ token: input.token, error });
  }

  const envelope = await ctx.repos.envelopes.getById(input.envelopeId as any);
  if (!envelope) throw envelopeNotFound({ envelopeId: input.envelopeId });

  const party = await ctx.repos.parties.getById({
    envelopeId: input.envelopeId,
    partyId: input.signerId,
  });
  if (!party) throw partyNotFound({ envelopeId: input.envelopeId, partyId: input.signerId });

  const rateKey = `otp:${input.envelopeId}:${input.signerId}`;
  await ctx.rateLimit.incrementAndCheck(rateKey, {
    windowSeconds: 60,
    maxRequests: OTP_POLICY.rateLimitPerMinute,
    ttlSeconds: 120,
  });
  await ctx.rateLimit.incrementAndCheck(`${rateKey}:daily`, {
    windowSeconds: 24 * 60 * 60,
    maxRequests: OTP_POLICY.rateLimitPerDay,
    ttlSeconds: 25 * 60 * 60,
  });

  const otpCode = generateNumericOtp(OTP_POLICY.codeLength);
  const codeHash = hashOtp(otpCode);
  const expiresAt: ISODateString = asISO(
    new Date(ctx.time.now() + OTP_POLICY.expiresInMinutes * 60 * 1000).toISOString()
  );
  const createdAt: ISODateString = asISO(new Date(ctx.time.now()).toISOString());

  await ctx.repos.parties.update(
    { envelopeId: input.envelopeId, partyId: input.signerId },
    { otpState: { codeHash, channel: input.delivery, expiresAt, tries: 0, maxTries: OTP_POLICY.maxTries, createdAt } }
  );

  const ts: ISODateString = asISO(new Date(ctx.time.now()).toISOString());
  const event: EventEnvelope = {
    name: "otp.requested",
    meta: { id: ctx.ids.ulid(), ts, source: "signature-service" },
    data: {
      envelopeId: input.envelopeId,
      partyId: input.signerId,
      channel: input.delivery,
      locale: input.actor?.locale ?? "en-US",
      metadata: {
        ip: input.actor?.ip,
        userAgent: input.actor?.userAgent,
        requestId: ctx.ids.ulid(),
        expiresAt,
        cooldownSeconds: OTP_POLICY.cooldownSeconds,
      },
    },
  };
  await ctx.events.publish(event);

  return { channel: input.delivery, expiresAt, cooldownSeconds: OTP_POLICY.cooldownSeconds };
};
