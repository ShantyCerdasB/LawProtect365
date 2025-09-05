/**
 * NOTE:
 * This file is part of the signature-service. Controllers are thin:
 * - validate (Zod from @lawprotect/shared-ts)
 * - authenticate/authorize
 * - call use-case
 * - map result -> HTTP response
 */
import { wrapController, corsFromEnv } from "@/presentation/middleware/http";
import { tenantFromCtx, actorFromCtx } from "@/presentation/middleware/auth";
import { validateRequest } from "@lawprotect/shared-ts";
import { UploadSignedPdfBodySchema } from "@/schemas/uploads";
import { toEnvelopeId } from "@/app/ports/shared";
import { getContainer } from "@/core/Container";
import { makeUploadsCommandsPort } from "@/app/adapters/uploads/makeUploadsCommandsPort";
import { z } from "zod";

const base = async (evt: any) => {
  const { path, body } = validateRequest(evt, {
    path: z.object({ id: z.string() }),
    body: UploadSignedPdfBodySchema,
  });

  const tenantId = tenantFromCtx(evt);
  const actor = actorFromCtx(evt);
  const c = getContainer();

  const uploadsCommands = makeUploadsCommandsPort({
    envelopesRepo: c.repos.envelopes,
    evidenceStorage: c.storage.evidence,
    pdfIngestor: c.storage.pdfIngestor,
    ids: c.ids,
  });

  const result = await uploadsCommands.uploadSignedPdf({
    tenantId: tenantId as any, 
    envelopeId: toEnvelopeId(path.id),
    contentLength: body.contentLength,
    sha256: body.sha256,
    actor,
  });

  return {
    statusCode: 201,
    body: JSON.stringify(result),
  };
};

export const handler = wrapController(base, {
  auth: true,
  observability: {
    logger: () => console,
    metrics: () => ({} as any),
    tracer: () => ({} as any),
  },
  cors: corsFromEnv(),
});
