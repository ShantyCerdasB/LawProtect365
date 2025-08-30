/**
 * @file verifyOtp.ts
 * @summary Controller for POST /signing/otp/verify
 * @description Validates input, derives actor from auth context, wires ports,
 * and delegates to the VerifyOtp app service. Errors are mapped by apiHandler.
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { ok, validateRequest } from "@lawprotect/shared-ts";

import { wrapController, corsFromEnv } from "@/middleware/http";
import { actorFromCtx, requireRequestToken } from "@/middleware/auth";

import { getContainer } from "@/infra/Container";
import { OtpVerifyBody } from "@/schemas/signing/OtpVerify.schema";
import { verifyOtpApp } from "@/app/services/Signing/VerifyOtpApp.service";
import { makeSigningCommandsPort } from "@/app/adapters/signing/makeSigningCommandsPort";

/**
 * Base handler function for OTP verification
 * @param evt - The Lambda event containing HTTP request data
 * @returns Promise resolving to HTTP response with verification result
 * @throws {AppError} When validation fails
 */
const base: HandlerFn = async (evt) => {
  // 1) Validate body
  const { body } = validateRequest(evt, { body: OtpVerifyBody });

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
      signer: c.crypto.signer,
      idempotency: c.idempotency.runner,
      signingConfig: {
        defaultKeyId: c.config.kms.signerKeyId,
        allowedAlgorithms: [c.config.kms.signingAlgorithm],
      },
    }
  );

  // 5) Delegate to app service
  const result = await verifyOtpApp(
    {
      envelopeId: body.envelopeId,
      signerId: body.signerId,
      code: body.code,
      token,
      actor,
    },
    { signingCommands }
  );

  // 6) 200 OK
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
