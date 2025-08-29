/**
 * @file completeSigning.ts
 * @summary Controller for POST /signing/complete
 *
 * @description
 * Public endpoint to finalize a signing operation for a signer using a request token.
 * - Validates the body
 * - Requires an opaque request token header (x-request-token)
 * - Derives actor metadata (ip/userAgent + auth context if present)
 * - Wires repositories and delegates to the CompleteSigning use case
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { ok, validateRequest } from "@lawprotect/shared-ts";

import { wrapController, corsFromEnv } from "@/middleware/http";
import { actorFromCtx, requireRequestToken } from "@/middleware/auth";

import { getContainer } from "@/infra/Container";
import { CompleteSigningBody } from "@/schemas/signing/CompleteSigning.schema";
import { executeCompleteSigning } from "@/use-cases/signatures/CompleteSigning";

const base: HandlerFn = async (evt) => {
  // 1) Validate request body
  const { body } = validateRequest(evt, { body: CompleteSigningBody });

  // 2) Require request token header (throws 401 if missing/invalid)
  //    Default header: "x-request-token", default min length: 16
  const token = requireRequestToken(evt);

  // 3) Build actor envelope (auth-derived + transport)
  const actor = actorFromCtx(evt);

  // 4) Wire dependencies
  const c = getContainer();

  const result = await executeCompleteSigning(
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
    {
      repos: {
        envelopes: c.repos.envelopes,
        parties: c.repos.parties,
      },
      signer: c.crypto.signer,
      events: c.events.publisher,
      idempotency: c.idempotency.runner,
      ids: { ulid: c.ids.ulid },
      time: { now: c.time.now },
      signing: {
        defaultKeyId: c.config.kms.signerKeyId,
        allowedAlgorithms: [c.config.kms.signingAlgorithm] as readonly string[],
      },
    }
  );

  // 5) Standard OK response
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
