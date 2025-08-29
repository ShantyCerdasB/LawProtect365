/**
 * @file verifyOtp.ts
 * @summary Controller for POST /signing/otp/verify
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { ok, validateRequest } from "@lawprotect/shared-ts";

import { wrapController, corsFromEnv } from "@/middleware/http";
import { actorFromCtx, requireRequestToken } from "@/middleware/auth";

import { getContainer } from "@/infra/Container";
import { OtpVerifyBody } from "@/schemas/signing/OtpVerify.schema";
import { executeVerifyOtp } from "@/use-cases/signatures/VerifyOtp";

const base: HandlerFn = async (evt) => {
  // 1) Validate body
  const { body } = validateRequest(evt, { body: OtpVerifyBody });

  // 2) Required request token header
 const token = requireRequestToken(evt);

  // 3) Actor from shared context
  const actor = actorFromCtx(evt);

  // 4) Wire repositories and dependencies
  const c = getContainer();

  const result = await executeVerifyOtp(
    {
      envelopeId: body.envelopeId,
      signerId: body.signerId,
      code: body.code,
      token,
      actor,
    },
    {
      repos: {
        envelopes: c.repos.envelopes,
        parties: c.repos.parties,
      },
      // ⬇️ idempotency eliminado: no forma parte de VerifyOtpContext
      events: c.events.publisher,
      ids: { ulid: c.ids.ulid },
      time: { now: c.time.now },
    }
  );

  // 5) 200 OK
  return ok({ data: result });
};

export const handler = wrapController(base, {
  auth: false,
  observability: {
    logger: () => console,
    metrics: () => ({} as any),
    tracer: () => ({} as any),
  },
  cors: corsFromEnv(),
});
