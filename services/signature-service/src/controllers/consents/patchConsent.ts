/**
 * Controller for PATCH /envelopes/:envelopeId/consents/:consentId
 * - Validates input
 * - Derives tenant/actor from auth context
 * - Wires domain ports via adapters and invokes the use case
 */
import type { HandlerFn } from "@lawprotect/shared-ts";
import { ok, validateRequest } from "@lawprotect/shared-ts";
import { wrapController, corsFromEnv } from "@/middleware/http";
import { tenantFromCtx, actorFromCtx } from "@/middleware/auth";

import { PatchConsentPath, PatchConsentBody } from "@/schemas/consents/PatchConsent.schema";
import { patchConsent } from "@/use-cases/consents/PatchConsent";
import { getContainer } from "@/infra/Container";

import { makeEnvelopesQueriesPort } from "@/app/ports/envelopes";
import { makeUpdateConsentPort }    from "@/app/ports/consent";

import { toTenantId, toEnvelopeId } from "@/app/ports/shared/common/cast";

const base: HandlerFn = async (evt) => {
  const { path, body } = validateRequest(evt, { path: PatchConsentPath, body: PatchConsentBody });

  const tenantId   = toTenantId(tenantFromCtx(evt));
  const envelopeId = toEnvelopeId(path.envelopeId);
  const actor      = actorFromCtx(evt);

  const c = getContainer();
  const envelopes = makeEnvelopesQueriesPort(c.repos.envelopes);
  const consents  = makeUpdateConsentPort(c.repos.consents);

  const result = await patchConsent(
    {
      tenantId,
      envelopeId,
      consentId: path.consentId,
      status: body.status,
      metadata: body.metadata,
      expiresAt: body.expiresAt,
      actor,
    },
    { envelopes, consents }
  );

  return ok({ data: result });
};

export const handler = wrapController(base, {
  auth: true,
  observability: { logger: () => console, metrics: () => ({} as any), tracer: () => ({} as any) },
  cors: corsFromEnv(),
});

