// file: src/controllers/signing/downloadSignedDocument.ts
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

import { wrapController, corsFromEnv } from "@/middleware/http";
import { actorFromCtx, requireRequestToken } from "@/middleware/auth";

import { getContainer } from "@/infra/Container";
import { DownloadSignedDocumentBody } from "@/schemas/signing/DownloadSignedDocument.schema";
import { executeDownloadSignedDocument } from "@/use-cases/signatures/DownloadSignedDocument";


const base: HandlerFn = async (evt) => {
  // 1) Validate body
  const { body } = validateRequest(evt, { body: DownloadSignedDocumentBody });

  // 2) Required request token header
  const token = requireRequestToken(evt);

  // 3) Actor from shared context
  const actor = actorFromCtx(evt);

  // 4) Wire repositories and dependencies
  const c = getContainer();

  const result = await executeDownloadSignedDocument(
    {
      envelopeId: body.envelopeId,
      token,
      actor,
    },
    {
      repos: {
        envelopes: c.repos.envelopes,
      },
      // Keep key names aligned with the use-case context
      s3: c.storage.presigner,
      idempotency: c.idempotency.runner,
      ids: { ulid: c.ids.ulid },
      time: { now: c.time.now },
      config: {
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
