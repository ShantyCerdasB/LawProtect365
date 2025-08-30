/**
 * NOTE:
 * This file is part of the signature-service. Controllers are thin:
 * - validate (Zod from @lawprotect/shared-ts)
 * - authenticate/authorize
 * - call use-case
 * - map result -> HTTP response
 */
import { wrapController, corsFromEnv } from "@/middleware/http";
import { tenantFromCtx } from "@/middleware/auth";
import { validateRequest } from "@lawprotect/shared-ts";
import { GetAuditTrailQuerySchema, GetAuditTrailPathSchema } from "@/schemas/audit";
import { toEnvelopeId } from "@/app/ports/shared";
import { getContainer } from "@/infra/Container";
import { makeAuditQueriesPort } from "@/app/adapters/audit/makeAuditQueriesPort";


const base = async (evt: any) => {
  const { path, query } = validateRequest(evt, {
    path: GetAuditTrailPathSchema,
    query: GetAuditTrailQuerySchema,
  });

  const tenantId = tenantFromCtx(evt);
  const c = getContainer();

  const auditQueries = makeAuditQueriesPort({
    auditRepo: c.repos.audit,
  });

  const result = await auditQueries.getAuditTrail({
    tenantId: tenantId as any, // TODO: Add proper type conversion
    envelopeId: toEnvelopeId(path.id),
    cursor: query.cursor as any, // TODO: Add proper type conversion
    limit: query.limit,
    format: query.format,
    locale: query.locale,
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
