// file: src/controllers/signing/presignUpload.ts
/**
 * @file presignUpload.ts
 * @summary Controller for POST /signing/presign-upload
 *
 * @description
 * Validates body with `PresignUploadBody` and delegates to the use case.
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { ok, validateRequest } from "@lawprotect/shared-ts";
import { wrapController, corsFromEnv } from "@/middleware/http";
import { actorFromCtx, requireRequestToken } from "@/middleware/auth";
import { getContainer } from "@/infra/Container";
import { PresignUploadBody } from "@/schemas/signing/PresignUpload.schema";
import { executePresignUpload } from "@/use-cases/signatures/PresignUpload";


const base: HandlerFn = async (evt) => {
  const { body } = validateRequest(evt, { body: PresignUploadBody });

  const token = requireRequestToken(evt);

  const actor = actorFromCtx(evt);
  const c = getContainer();

  const result = await executePresignUpload(
    {
      envelopeId: body.envelopeId,
      filename: body.filename,
      contentType: body.contentType,
      token,
      actor,
    },
    {
      repos: { envelopes: c.repos.envelopes },
      s3: c.storage.presigner,
      idempotency: c.idempotency.runner,
      ids: { ulid: c.ids.ulid },
      time: { now: c.time.now },
      config: {
        uploadBucket: process.env.UPLOAD_BUCKET || "lawprotect-uploads",
        uploadTtlSeconds: parseInt(process.env.UPLOAD_TTL_SECONDS || "900", 10),
      },
    }
  );

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
