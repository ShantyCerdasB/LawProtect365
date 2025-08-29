// file: src/controllers/signing/requestOtp.ts
/**
 * @file requestOtp.ts
 * @summary Controller for POST /signing/otp/request
 *
 * @description
 * Public endpoint to initiate an OTP challenge for a signer.
 * - Validates the body with `OtpRequestBody`.
 * - Extracts the request token from `x-request-token`.
 * - Derives the actor from the shared context.
 * - Wires repositories, rate-limit store, and delegates to the use case.
 * - Returns 202 Accepted with neutral metadata (no OTP value).
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { json, HttpStatus, validateRequest } from "@lawprotect/shared-ts";

import { wrapController, corsFromEnv } from "@/middleware/http";
import { actorFromCtx, requireRequestToken } from "@/middleware/auth";

import { getContainer } from "@/infra/Container";
import { OtpRequestBody } from "@/schemas/signing/OtpRequest.schema";
import { executeRequestOtp } from "@/use-cases/signatures/RequestOtp";


const base: HandlerFn = async (evt) => {
  // 1) Validate body
  const { body } = validateRequest(evt, { body: OtpRequestBody });

  // 2) Required request token header
 const token = requireRequestToken(evt);

  // 3) Actor from shared context
  const actor = actorFromCtx(evt);

  // 4) Wire repositories and dependencies
  const c = getContainer();

  const result = await executeRequestOtp(
    {
      envelopeId: body.envelopeId,
      signerId: body.signerId,
      delivery: body.delivery,
      token,
      actor,
    },
    {
      repos: {
        envelopes: c.repos.envelopes,
        parties: c.repos.parties,
      },
      idempotency: c.idempotency.runner,
      events: c.events.publisher,
      rateLimit: c.rateLimit.otpStore,
      ids: { ulid: c.ids.ulid },
      time: { now: c.time.now },
    }
  );

  // 5) 202 Accepted with neutral metadata (do not include the OTP secret/value)
  return json(HttpStatus.ACCEPTED, { data: result });
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
