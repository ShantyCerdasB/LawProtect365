/**
 * Controller for GET /envelopes/:envelopeId/consents
 * - Validates path & query
 * - Derives tenant from auth context
 * - Wires app ports (read envelopes, read consents)
 * - Delegates to use case
 */
import type { HandlerFn } from "@lawprotect/shared-ts";
import { ok, validateRequest } from "@lawprotect/shared-ts";
import { wrapController, corsFromEnv } from "@/middleware/http";
import { tenantFromCtx } from "@/middleware/auth";

import {
  ListConsentsPath,
  ListConsentsQuery,
} from "@/schemas/consents/ListConsents.schema";

import { listConsents } from "@/use-cases/consents/ListConsents";
import { getContainer } from "@/infra/Container";

// explicit adapters
import { makeEnvelopesQueriesPort } from "@/app/ports/envelopes/index";
import { makeConsentsQueryPort } from "@/app/ports/consent/index";

// domain enums (filters)
import type { ConsentStatus, ConsentType } from "@/domain/values/enums";

const base: HandlerFn = async (evt) => {
  const { path, query } = validateRequest(evt, {
    path: ListConsentsPath,
    query: ListConsentsQuery,
  });

  const tenantId = tenantFromCtx(evt);

  const c = getContainer();
  const envelopes = makeEnvelopesQueriesPort(c.repos.envelopes);
  const consents = makeConsentsQueryPort(c.repos.consents);

  const result = await listConsents(
    {
      tenantId,
      envelopeId: path.envelopeId,
      limit: query.limit,
      cursor: query.cursor,
      status: query.status as ConsentStatus | undefined,
      consentType: query.consentType as ConsentType | undefined,
      partyId: query.partyId,
    },
    { envelopes, consents }
  );

  return ok({ data: result });
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

