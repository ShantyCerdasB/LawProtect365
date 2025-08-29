// @/controllers/consents/deleteConsent.ts
/**
 * Controller for DELETE /envelopes/:envelopeId/consents/:consentId
 * - Validates path params
 * - Derives tenant/actor from auth context
 * - Wires app ports (read envelopes, write consents)
 * - Delegates to use case
 */
import type { HandlerFn } from "@lawprotect/shared-ts";
import { ok, validateRequest } from "@lawprotect/shared-ts";
import { wrapController, corsFromEnv } from "@/middleware/http";
import { tenantFromCtx, actorFromCtx } from "@/middleware/auth";
import { DeleteConsentPath } from "@/schemas/consents/DeleteConsent.schema";
import { deleteConsent } from "@/use-cases/consents/DeleteConsent";
import { getContainer } from "@/infra/Container";

// ✅ explicit adapters
import { makeEnvelopesQueriesPort } from "@/app/ports/envelopes/index";
import { makeConsentsPort } from "@/app/ports/consent/index";

const base: HandlerFn = async (evt) => {
  const { path } = validateRequest(evt, { path: DeleteConsentPath });
  const { envelopeId, consentId } = path;

  const tenantId = tenantFromCtx(evt);
  const actor = actorFromCtx(evt);

  const c = getContainer();

  const envelopes = makeEnvelopesQueriesPort(c.repos.envelopes);
  const consents = makeConsentsPort(c.repos.consents, c.ids);

  const result = await deleteConsent(
    { tenantId, envelopeId, consentId, actor },
    { envelopes, consents }
  );

  return ok({
    data: {
      message: "Consent deleted successfully",
      consentId: result.consentId,
      envelopeId: result.envelopeId,
      deletedAt: result.deletedAt,
    },
  });
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

