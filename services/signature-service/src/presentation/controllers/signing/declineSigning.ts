/**
 * @file declineSigning.ts
 * @summary Controller for POST /signing/decline
 *
 * @description
 * Public endpoint to decline a signing operation using a request token.
 * Validates the body, extracts the request token, derives actor metadata,
 * wires repositories, and delegates to the DeclineSigning use case.
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { ok, validateRequest } from "@lawprotect/shared-ts";

import { wrapController, corsFromEnv } from "@/presentation/middleware/http";
import { actorFromCtx, requireRequestToken } from "@/presentation/middleware/auth";

import { getContainer } from "@/core/Container";
import { DeclineSigningBody } from "@/schemas/signing/DeclineSigning.schema";
import { declineSigningApp } from "@/app/services/Signing/DeclineSigningApp.service";
import { makeSigningCommandsPort } from "@/app/adapters/signing/makeSigningCommandsPort";


const base: HandlerFn = async (evt) => {
  // 1) Validate body
  const { body } = validateRequest(evt, { body: DeclineSigningBody });

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
  const result = await declineSigningApp(
    {
      envelopeId: body.envelopeId,
      signerId: body.signerId,
      reason: body.reason,
      token,
      actor,
    },
    { signingCommands }
  );

  // 5) Standard OK response (avoid duplicating `status`)
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
