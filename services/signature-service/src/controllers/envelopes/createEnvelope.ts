/**
 * @file createEnvelope.ts
 * @summary HTTP controller for `POST /envelopes`.
 *
 * @description
 * Validates the request body against `CreateEnvelopeBody`, derives a stable
 * idempotency key, invokes the envelope creation service, and returns
 * `201 Created` with the new resource identifier.
 */

import type { HandlerFn, JsonObject } from "@lawprotect/shared-ts";
import { created, validateJsonBody } from "@lawprotect/shared-ts";

import { wrapController, corsFromEnv } from "@/middleware/http";
import { getContainer } from "@/infra/Container";
import { CreateEnvelopeBody } from "@/schemas/envelopes/CreateEnvelope.schema";
import { TenantIdSchema, UserIdSchema } from "@/domain/value-objects/Ids";
import { IdempotencyKeyHasher } from "@/adapters/idempotency/IdempotencyKeyHasher";
import { buildAuditActor } from "@/utils/index";

/**
 * Base controller handler for `POST /envelopes`.
 *
 * @remarks
 * - Extracts auth context from the event (tenant and user).
 * - Validates and parses the request body with `CreateEnvelopeBody`.
 * - Normalizes and validates IDs with Zod schemas (`TenantIdSchema`, `UserIdSchema`).
 * - Derives a deterministic idempotency key using method, path, tenant/user, scope, and body.
 * - Builds an audit actor from the request for observability and compliance.
 * - Delegates the creation to `services.envelopes.create` (DI container).
 * - Responds with `201 Created` and a minimal resource representation (id, createdAt).
 *
 * @param evt - The incoming HTTP event as defined by `HandlerFn`.
 * @returns A `201 Created` response containing the new envelope id and timestamp.
 */
const base: HandlerFn = async (evt) => {
  const { services } = getContainer();
  const auth = (evt as any).ctx?.auth ?? {};

  // Validate and parse request body
  const body = validateJsonBody(evt, CreateEnvelopeBody);

  // Validate/normalize identifiers from auth + body
  const tenantId = TenantIdSchema.parse(String(auth.tenantId ?? ""));
  const callerId = UserIdSchema.parse(String(auth.userId ?? ""));
  const ownerId = UserIdSchema.parse(String(body.ownerId));

  // Derive a stable idempotency key for POST semantics
  const idempotencyKey = IdempotencyKeyHasher.derive({
    method: evt.requestContext.http.method,
    path: evt.requestContext.http.path,
    tenantId: String(tenantId),
    userId: String(callerId),
    scope: "envelopes:create",
    query: null,
    body: body as unknown as JsonObject,
  });

  // Build audit actor (ip, ua, locale, etc.)
  const actor = buildAuditActor(evt, auth);

  // Delegate to application service with idempotency
  const out = await services.envelopes.create(
    {
      tenantId,
      ownerId,
      title: String(body.name),
      actor,
    },
    { idempotencyKey }
  );

  // Return minimal representation of the created resource
  return created({
    data: {
      id: out.envelope.envelopeId,
      createdAt: out.envelope.createdAt,
    },
  });
};

/**
 * Wrapped Lambda handler with auth, observability hooks, and CORS.
 *
 * @remarks
 * `wrapController` applies:
 * - Authentication enforcement
 * - Pluggable logger/metrics/tracer (no-ops by default here)
 * - CORS configuration resolved from environment
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
