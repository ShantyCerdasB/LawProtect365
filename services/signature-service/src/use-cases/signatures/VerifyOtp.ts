/**
 * @file VerifyOtp.ts
 * @summary Verify a signer’s one-time password (OTP).
 *
 * Validates the request token, loads the envelope and party, checks OTP policy
 * (TTL / attempt counter) without leaking causes, compares the submitted code
 * against the stored hash, updates party state (increment tries on failure or
 * clear OTP on success), emits an `otp.verified` event, and returns a neutral
 * response with minimal metadata.
 */

import type { ISODateString, EventEnvelope } from "@lawprotect/shared-ts";
import { asISO } from "@lawprotect/shared-ts";
import { hashOtp } from "@lawprotect/shared-ts";

import { assertRequestToken } from "@/domain/rules/Token.rules";
import { assertOtpValid } from "@/domain/rules/ConsentMfa.rules";

import {
  envelopeNotFound,
  partyNotFound,
  requestTokenInvalid,
  otpInvalid,
} from "@/errors";

import type {
  OtpVerifyInput,
  OtpVerifyOutput,
  OtpVerifyContext,
} from "@/use-cases/shared/types/otp";

/**
 * Verify an already-issued OTP for a party inside an envelope.
 *
 * @throws {UnauthorizedError} When token is invalid/expired or OTP is invalid (cause not leaked).
 * @throws {NotFoundError} When envelope or party does not exist.
 */
export const executeVerifyOtp = async (
  input: OtpVerifyInput,
  ctx: OtpVerifyContext
): Promise<OtpVerifyOutput> => {
  // 1) Token (scope: "signing")
  try {
    assertRequestToken(input.token, "signing", ctx.time.now());
  } catch {
    throw requestTokenInvalid({ token: input.token });
  }

  // 2) Load aggregate
  const envelope = await ctx.repos.envelopes.getById(input.envelopeId as any);
  if (!envelope) throw envelopeNotFound({ envelopeId: input.envelopeId });

  const party = await ctx.repos.parties.getById({
    envelopeId: input.envelopeId,
    partyId: input.signerId,
  });
  if (!party) {
    throw partyNotFound({ envelopeId: input.envelopeId, partyId: input.signerId });
  }
  if (!party.otpState) {
    // No active challenge → treat as invalid OTP to avoid leaking state
    throw otpInvalid({ envelopeId: input.envelopeId, partyId: input.signerId });
  }

  // 3) OTP policy (TTL / attempts). Do not reveal specific reasons on failure.
  try {
    assertOtpValid({
      required: true,
      code: input.code,
      expiresAt: new Date(party.otpState.expiresAt).getTime(),
      tries: party.otpState.tries,
      maxTries: party.otpState.maxTries,
    });
  } catch {
    throw otpInvalid({ envelopeId: input.envelopeId, partyId: input.signerId });
  }

  // 4) Compare hash
  const submittedHash = hashOtp(input.code);
  if (submittedHash !== party.otpState.codeHash) {
    const nextTries = (party.otpState.tries ?? 0) + 1;
    await ctx.repos.parties.update(
      { envelopeId: input.envelopeId, partyId: input.signerId },
      { otpState: { ...party.otpState, tries: nextTries } }
    );
    throw otpInvalid({ envelopeId: input.envelopeId, partyId: input.signerId });
  }

  // 5) Success → clear OTP to prevent reuse and publish event
  const ts: ISODateString = asISO(new Date(ctx.time.now()).toISOString());

  await ctx.repos.parties.update(
    { envelopeId: input.envelopeId, partyId: input.signerId },
    { otpState: undefined }
  );

  const ev: EventEnvelope = {
    name: "otp.verified",
    meta: { id: ctx.ids.ulid(), ts, source: "signature-service" },
    data: {
      envelopeId: input.envelopeId,
      partyId: input.signerId,
      verifiedAt: ts,
      metadata: {
        ip: input.actor?.ip,
        userAgent: input.actor?.userAgent,
        locale: input.actor?.locale ?? "en-US",
      },
    },
  };
  await ctx.events.publish(ev);

  // 6) Neutral response (no additional state leakage)
  const remainingTries = Math.max(
    (party.otpState.maxTries ?? 0) - (party.otpState.tries ?? 0),
    0
  );

  return {
    status: "verified",
    verifiedAt: ts,
    envelopeId: input.envelopeId,
    signerId: input.signerId,
    remainingTries,
  };
};
