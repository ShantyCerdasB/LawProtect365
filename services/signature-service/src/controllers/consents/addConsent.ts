// @/controllers/consents/addConsent.ts
/**
 * Controller for POST /envelopes/:envelopeId/consents
 * - Validates input
 * - Derives tenant/actor from auth context
 * - Wires app ports (read envelopes/party, write consents)
 * - Delegates to use case
 */
import type { HandlerFn } from "@lawprotect/shared-ts";
import { created, validateRequest } from "@lawprotect/shared-ts";
import { wrapController, corsFromEnv } from "@/middleware/http";
import { tenantFromCtx, actorFromCtx } from "@/middleware/auth";
import { AddConsentPath, AddConsentBody } from "@/schemas/consents/AddConsent.schema";
import { addConsent } from "@/use-cases/consents/AddConsent";
import { getContainer } from "@/infra/Container";
import type { EnvelopeId } from "@/domain/value-objects/Ids";

// ✅ Queries para envelope; port simple (pre-bound) para party
import { makeEnvelopesQueriesPort } from "@/app/ports/envelopes";
import { makePartiesPort }         from "@/app/ports/parties/makePartiesPort";

// ✅ Commands para consents
import { makeConsentsPort } from "@/app/ports/consent/makeConsent";

const base: HandlerFn = async (evt) => {
  const { path, body } = validateRequest(evt, { path: AddConsentPath, body: AddConsentBody });

  const tenantId = tenantFromCtx(evt);
  const actor = actorFromCtx(evt);

  const c = getContainer();

  const envelopes = makeEnvelopesQueriesPort(c.repos.envelopes);
  const parties   = makePartiesPort(c.repos.parties, path.envelopeId as EnvelopeId);
  const consents  = makeConsentsPort(c.repos.consents, c.ids);

  const result = await addConsent(
    {
      tenantId,
      envelopeId: path.envelopeId,
      partyId: body.partyId,
      consentType: body.consentType,
      metadata: body.metadata,
      expiresAt: body.expiresAt,
      actor,
    },
    { envelopes, parties, consents }
  );

  return created({ data: result });
};

export const handler = wrapController(base, {
  auth: true,
  observability: { logger: () => console, metrics: () => ({} as any), tracer: () => ({} as any) },
  cors: corsFromEnv(),
});

