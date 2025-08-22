/**
 * @file GetAuditEventById.ts
 * @summary Retrieves a single audit event by id, enforcing tenant/envelope boundaries.
 *
 * @description
 * Pure application use case. Depends only on the `AuditRepository` port and
 * domain rules. Asserts multitenancy and envelope scope, plus basic invariants.
 */

import { NotFoundError, ForbiddenError } from "@lawprotect/shared-ts";
import type { AuditEvent, AuditEventId } from "@/domain/value-objects/Audit";
import type { EnvelopeId, TenantId } from "@/domain/value-objects/Ids";
import * as Rules from "@/domain/rules";
import type { AuditRepository } from "@/ports";

/** Input contract. */
export interface GetAuditEventByIdInput {
  tenantId: TenantId;
  envelopeId: EnvelopeId;
  eventId: AuditEventId;
}

/** Output contract. */
export interface GetAuditEventByIdOutput {
  event: AuditEvent;
}

/** Use case context. */
export interface GetAuditEventByIdContext {
  repos: {
    audit: AuditRepository;
  };
}

/**
 * Retrieves an audit event by id and asserts tenant/envelope boundaries.
 *
 * @throws NotFoundError when the event does not exist.
 * @throws ForbiddenError when cross-tenant or outside envelope.
 */
export const getAuditEventById = async (
  input: GetAuditEventByIdInput,
  ctx: GetAuditEventByIdContext
): Promise<GetAuditEventByIdOutput> => {
  const found = await ctx.repos.audit.getById(input.eventId);
  if (!found) {
    throw new NotFoundError("Audit event not found", "AUDIT_EVENT_NOT_FOUND");
  }

  if (!Rules.Multitenancy.belongsToTenant(found.tenantId, input.tenantId as unknown as string)) {
    throw new ForbiddenError("Cross-tenant access denied", "COMMON_FORBIDDEN");
  }
  if (!Rules.Audit.sameEnvelope(found.envelopeId as unknown as string, input.envelopeId as unknown as string)) {
    throw new ForbiddenError("Event does not belong to envelope", "COMMON_FORBIDDEN");
  }

  Rules.Audit.assertImmutable(found);

  return { event: found };
};
