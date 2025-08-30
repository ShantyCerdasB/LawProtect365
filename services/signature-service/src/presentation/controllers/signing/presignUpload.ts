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
import { wrapController, corsFromEnv } from "@/presentation/middleware/http";
import { actorFromCtx, requireRequestToken } from "@/presentation/middleware/auth";
import { getContainer } from "@/core/Container";
import { PresignUploadBody } from "@/schemas/signing/PresignUpload.schema";
import { presignUploadApp } from "@/app/services/Signing/PresignUploadApp.service";
import { makeSigningCommandsPort } from "@/app/adapters/signing/makeSigningCommandsPort";


const base: HandlerFn = async (evt) => {
  const { body } = validateRequest(evt, { body: PresignUploadBody });

  const token = requireRequestToken(evt);

  const actor = actorFromCtx(evt);
  const c = getContainer();

  // Wire dependencies
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
      uploadConfig: {
        uploadBucket: process.env.UPLOAD_BUCKET || "lawprotect-uploads",
        uploadTtlSeconds: parseInt(process.env.UPLOAD_TTL_SECONDS || "900", 10),
      },
    }
  );

  // Delegate to app service
  const result = await presignUploadApp(
    {
      envelopeId: body.envelopeId,
      filename: body.filename,
      contentType: body.contentType,
      token,
      actor,
    },
    { signingCommands }
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
