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
import { CompleteEvidenceBodySchema } from "@/schemas/uploads";
import { toEnvelopeId } from "@/app/ports/shared";
import { getContainer } from "@/core/Container";
import { makeUploadsCommandsPort } from "@/app/adapters/uploads/makeUploadsCommandsPort";
import { z } from "zod";

const base = async (evt: any) => {
  const { path, body } = validateRequest(evt, {
    path: z.object({ id: z.string() }),
    body: CompleteEvidenceBodySchema,
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

  const result = await uploadsCommands.completeEvidence({
    tenantId: tenantId as any, // TODO: Add proper type conversion
    envelopeId: toEnvelopeId(path.id),
    uploadId: body.uploadId,
    bucket: body.bucket,
    key: body.key,
    parts: body.parts,
    objectRef: body.objectRef,
    actor,
  });

  return {
    statusCode: 200,
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
