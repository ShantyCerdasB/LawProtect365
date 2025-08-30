/**
 * @file ListConsents.Controller.ts
 * @summary Controller for listing consents in an envelope
 * @description Handles GET /envelopes/:envelopeId/consents requests
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { ok, validateRequest } from "@lawprotect/shared-ts";
import { wrapController, corsFromEnv } from "../../presentation/middleware/http";
import { tenantFromCtx } from "../../presentation/middleware/auth";
import {
  ListConsentsPath,
  ListConsentsQuery,
} from "../../schemas/consents/ListConsents.schema";
import { listConsentsApp } from "../../app/services/Consent/ListConsentsApp.service";
import { getContainer } from "../../core/Container";
import { toTenantId, toEnvelopeId } from "../../app/ports/shared";
import { makeConsentsQueryPort } from "../../app/adapters/consent/MakeConsentQueryPort";

const base: HandlerFn = async (evt) => {
  const { path, query } = validateRequest(evt, {
    path: ListConsentsPath,
    query: ListConsentsQuery,
  });

  const tenantId = toTenantId(tenantFromCtx(evt));

  const c = getContainer();
  const consentQueries = makeConsentsQueryPort(c.repos.consents);

  const result = await listConsentsApp(
    {
      tenantId,
      envelopeId: toEnvelopeId(path.envelopeId),
      limit: query.limit,
      cursor: query.cursor,
      status: query.status,
      consentType: query.consentType,
      partyId: query.partyId,
    },
    { consentQueries }
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
