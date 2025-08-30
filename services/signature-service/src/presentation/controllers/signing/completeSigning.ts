/**
 * @file completeSigning.ts
 * @summary Controller for POST /signing/complete
 * @description Validates input, derives actor from auth context, wires ports,
 * and delegates to the CompleteSigning app service. Errors are mapped by apiHandler.
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { ok, validateRequest } from "@lawprotect/shared-ts";

import { wrapController, corsFromEnv } from "@/presentation/middleware/http";
import { actorFromCtx, requireRequestToken } from "@/presentation/middleware/auth";

import { getContainer } from "@/core/Container";
import { CompleteSigningBody } from "@/schemas/signing/CompleteSigning.schema";
import { completeSigningApp } from "@/app/services/Signing/CompleteSigningApp.service";
import { makeSigningCommandsPort } from "@/app/adapters/signing/makeSigningCommandsPort";

/**
 * Base handler function for signing completion
 * @param evt - The Lambda event containing HTTP request data
 * @returns Promise resolving to HTTP response with completion result
 * @throws {AppError} When validation fails
 */
const base: HandlerFn = async (evt) => {
  // 1) Validate request body
  const { body } = validateRequest(evt, { body: CompleteSigningBody });

  // 2) Required request token header
  const token = requireRequestToken(evt);

  // 3) Build actor envelope (auth-derived + transport)
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
  const result = await completeSigningApp(
    {
      envelopeId: body.envelopeId,
      signerId: body.signerId,
      digest: body.digest,
      algorithm: body.algorithm,
      keyId: body.keyId,
      otpCode: body.otpCode,
      token,
      actor,
    },
    { signingCommands }
  );

  // 6) Standard OK response
  return ok({
    data: {
      status: "completed",
      ...result,
    },
  });
};

export const handler = wrapController(base, {
  auth: false, // public endpoint
  observability: {
    logger: () => console,
    metrics: () => ({} as any),
    tracer: () => ({} as any),
  },
  cors: corsFromEnv(),
});
