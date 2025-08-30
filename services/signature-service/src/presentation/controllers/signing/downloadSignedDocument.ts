/**
 * @file downloadSignedDocument.ts
 * @summary Controller for POST /signing/download-signed-document
 *
 * @description
 * Public endpoint that generates a pre-signed download URL for a signed document.
 * - Validates the body with `DownloadSignedDocumentBody`.
 * - Extracts the request token from `x-request-token`.
 * - Derives the actor from the shared context.
 * - Wires repositories and S3 presigner, then delegates to the use case.
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { ok, validateRequest } from "@lawprotect/shared-ts";

import { wrapController, corsFromEnv } from "@/presentation/middleware/http";
import { actorFromCtx, requireRequestToken } from "@/presentation/middleware/auth";

import { getContainer } from "@/core/Container";
import { DownloadSignedDocumentBody } from "@/schemas/signing/DownloadSignedDocument.schema";
import { downloadSignedDocumentApp } from "@/app/services/Signing/DownloadSignedDocumentApp.service";
import { makeSigningCommandsPort } from "@/app/adapters/signing/makeSigningCommandsPort";


const base: HandlerFn = async (evt) => {
  // 1) Validate body
  const { body } = validateRequest(evt, { body: DownloadSignedDocumentBody });

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
      s3: c.storage.presigner,
      downloadConfig: {
        signedBucket:
          process.env.SIGNED_BUCKET ||
          process.env.EVIDENCE_BUCKET ||
          "lawprotect-signed",
        downloadTtlSeconds: parseInt(
          process.env.DOWNLOAD_TTL_SECONDS || "900",
          10
        ),
      },
    }
  );

  // 5) Delegate to app service
  const result = await downloadSignedDocumentApp(
    {
      envelopeId: body.envelopeId,
      token,
      actor,
    },
    { signingCommands }
  );

  // 5) Standard OK response
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
