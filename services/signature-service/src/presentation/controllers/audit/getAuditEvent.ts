/**
 * NOTE:
 * This file is part of the signature-service. Controllers are thin:
 * - validate (Zod from @lawprotect/shared-ts)
 * - authenticate/authorize
 * - call use-case
 * - map result -> HTTP response
 */
import { wrapController, corsFromEnv } from "@/presentation/middleware/http";
import { tenantFromCtx } from "@/presentation/middleware/auth";
import { validateRequest } from "@lawprotect/shared-ts";
import { GetAuditEventPathSchema } from "@/schemas/audit";
import { getContainer } from "@/core/Container";
import { makeAuditQueriesPort } from "@/app/adapters/audit/makeAuditQueriesPort";


const base = async (evt: any) => {
  const { path } = validateRequest(evt, {
    path: GetAuditEventPathSchema,
  });

  const tenantId = tenantFromCtx(evt);
  const c = getContainer();

  const auditQueries = makeAuditQueriesPort({
    auditRepo: c.repos.audit,
  });

  const result = await auditQueries.getAuditEvent({
    eventId: path.eventId,
    tenantId: tenantId as any, // TODO: Add proper type conversion
  });

  if (!result) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: "Audit event not found" }),
    };
  }

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
