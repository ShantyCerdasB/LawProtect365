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

import { wrapController, corsFromEnv } from "@/middleware/http";
import { actorFromCtx, requireRequestToken } from "@/middleware/auth";

import { getContainer } from "@/infra/Container";
import { DeclineSigningBody } from "@/schemas/signing/DeclineSigning.schema";
import { executeDeclineSigning } from "@/use-cases/signatures/DeclineSigning";


const base: HandlerFn = async (evt) => {
  // 1) Validate body
  const { body } = validateRequest(evt, { body: DeclineSigningBody });

  // 2) Required request token header
 const token = requireRequestToken(evt);
  // 3) Actor from shared context
  const actor = actorFromCtx(evt);

  // 4) Wire raw repositories and dependencies
  const c = getContainer();

  const result = await executeDeclineSigning(
    {
      envelopeId: body.envelopeId,
      signerId: body.signerId,
      reason: body.reason,
      token,
      actor,
    },
    {
      repos: {
        envelopes: c.repos.envelopes,
        parties: c.repos.parties,
      },
      events: c.events.publisher,
      idempotency: c.idempotency.runner,
      ids: { ulid: c.ids.ulid },
      time: { now: c.time.now },
    }
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
