/**
 * @file getCertificate.ts
 * @summary HTTP controller for GET /envelopes/:envelopeId/certificate
 *
 * @description
 * Retrieves the certificate and audit trail for an envelope.
 * Validates path and query parameters, derives tenant from the shared auth context,
 * and delegates to the GetCertificate use case.
 * Errors are mapped by the shared HTTP middleware (apiHandler via wrapController).
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { ok, validateRequest } from "@lawprotect/shared-ts";
import { wrapController, corsFromEnv } from "@/presentation/middleware/http";
import { tenantFromCtx } from "@/presentation/middleware/auth";
import {
  GetCertificatePath,
  GetCertificateQuery,
} from "@/schemas/certificate/GetCertificate.schema";
import { getCertificate } from "@/use-cases/certificate/GetCertificate";
import { getContainer } from "@/core/Container";
import { envelopeNotFound } from "@/shared/errors";

const base: HandlerFn = async (evt) => {
  // Single-shot validation to reduce cognitive complexity
  const { path, query } = validateRequest(evt, {
    path: GetCertificatePath,
    query: GetCertificateQuery,
  });

  // Resolve tenant from shared auth context (populated by withAuth)
  const tenantId = tenantFromCtx(evt);

  // Resolve dependencies once
  const container = getContainer();
  const { envelopes, audit } = container.repos;

  // Execute use case
  const result = await getCertificate(
    {
      tenantId,
      envelopeId: path.envelopeId,
      limit: query.limit,
      cursor: query.cursor,
    },
    { envelopes, audit }
  );

  if (!result) {
    // Let apiHandler map this to 404 with your standardized body
    throw envelopeNotFound({ envelopeId: path.envelopeId, tenantId });
  }

  return ok({ data: result });
};

/**
 * Lambda handler with shared pipeline:
 * - request IDs & observability
 * - JWT auth
 * - uniform error mapping + CORS
 */
export const handler = wrapController(base, {
  auth: true,
  observability: {
    logger: () => console,
    metrics: () => ({} as any),
    tracer: () => ({} as any),
  },
  cors: corsFromEnv(),
});
