// @/controllers/consents/delegateConsent.ts
/**
 * Controller for POST /envelopes/:envelopeId/consents/:consentId/delegate
 * - Validates input
 * - Resolves tenant/actor from auth context
 * - Wires app ports (read envelope/party, write consents/delegations)
 * - Delegates to use case
 */
import type { HandlerFn } from "@lawprotect/shared-ts";
import { created, validateRequest } from "@lawprotect/shared-ts";
import { wrapController, corsFromEnv } from "@/middleware/http";
import { tenantFromCtx, actorFromCtx } from "@/middleware/auth";
import { DelegateConsentPath, DelegateConsentBody } from "@/schemas/consents/DelegateConsent.schema";
import { delegateConsent } from "@/use-cases/consents/DelegateConsent";
import { getContainer } from "@/infra/Container";

// ✅ imports explícitos
import { makeEnvelopesQueriesPort } from "@/app/ports/envelopes/index";
import { makePartiesPort }          from "@/app/ports/parties/MakePartiesPort";
import { makeConsentsPort }         from "@/app/ports/consent/index";
import { makeDelegationsPort }      from "@/app/ports/consent/index";

import type { EnvelopeId } from "@/domain/value-objects/Ids";

const base: HandlerFn = async (evt) => {
  const { path, body } = validateRequest(evt, { path: DelegateConsentPath, body: DelegateConsentBody });
  const tenantId = tenantFromCtx(evt);
  const actor = actorFromCtx(evt);

  const c = getContainer();

  // Ports
  const envelopes   = makeEnvelopesQueriesPort(c.repos.envelopes);
  const parties     = makePartiesPort(c.repos.parties, path.envelopeId as EnvelopeId); // cast al branded type
  const consents    = makeConsentsPort(c.repos.consents, c.ids);
  const delegations = makeDelegationsPort(c.repos.delegations, c.ids);

  const result = await delegateConsent(
    {
      tenantId,
      envelopeId: path.envelopeId,
      consentId: path.consentId,
      delegatePartyId: body.delegatePartyId,
      reason: body.reason,
      expiresAt: body.expiresAt,
      metadata: body.metadata,
      actor,
    },
    { envelopes, consents, parties, delegations }
  );

  return created({ data: result });
};

export const handler = wrapController(base, {
  auth: true,
  observability: { logger: () => console, metrics: () => ({} as any), tracer: () => ({} as any) },
  cors: corsFromEnv(),
});

