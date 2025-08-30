/**
 * @file requestOtp.ts
 * @summary Controller for POST /signing/otp/request
 * @description Validates input, derives actor from auth context, wires ports,
 * and delegates to the RequestOtp app service. Errors are mapped by apiHandler.
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { json, HttpStatus, validateRequest } from "@lawprotect/shared-ts";

import { wrapController, corsFromEnv } from "@/middleware/http";
import { actorFromCtx, requireRequestToken } from "@/middleware/auth";

import { getContainer } from "@/infra/Container";
import { OtpRequestBody } from "@/schemas/signing/OtpRequest.schema";
import { requestOtpApp } from "@/app/services/Signing/RequestOtpApp.service";
import { makeSigningCommandsPort } from "@/app/adapters/signing/makeSigningCommandsPort";


/**
 * Base handler function for OTP request
 * @param evt - The Lambda event containing HTTP request data
 * @returns Promise resolving to HTTP response with request result
 * @throws {AppError} When validation fails
 */
const base: HandlerFn = async (evt) => {
  // 1) Validate body
  const { body } = validateRequest(evt, { body: OtpRequestBody });

  // 2) Required request token header
  const token = requireRequestToken(evt);

  // 3) Actor from shared context
  const actor = actorFromCtx(evt);

  // 4) Wire dependencies
  const c = getContainer();
  const signingCommands = makeSigningCommandsPort(
    c.repos.envelopes,
    c.repos.parties,
    {
      events: c.events.publisher,
      ids: c.ids,
      time: c.time,
      rateLimit: c.rateLimit.otpStore,
      signer: c.crypto.signer,
      idempotency: c.idempotency.runner,
      signingConfig: {
        defaultKeyId: c.config.kms.signerKeyId,
        allowedAlgorithms: [c.config.kms.signingAlgorithm],
      },
    }
  );

  // 5) Delegate to app service
  const result = await requestOtpApp(
    {
      envelopeId: body.envelopeId,
      signerId: body.signerId,
      delivery: body.delivery,
      token,
      actor,
    },
    { signingCommands }
  );

  // 6) 202 Accepted with neutral metadata (do not include the OTP secret/value)
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
