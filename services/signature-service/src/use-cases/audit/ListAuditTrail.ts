/**
 * @file ListAuditTrail.ts
 * @summary Lists immutable audit events for an envelope with forward cursor pagination.
 *
 * @description
 * - Pure application use case over the `AuditRepository` port.
 * - Enforces safe page size clamp via domain rule (server-side).
 * - Asserts chronological ordering and immutability post-conditions.
 */

import type {
  AuditEvent,
  EnvelopeId,
  TenantId,
  PaginationCursor,
} from "../../domain/value-objects/index.js";
import * as Rules from "../../domain/rules/index.js";
import type { AuditRepository } from "../../ports/index.js";

/** Input contract for ListAuditTrail. */
export interface ListAuditTrailInput {
  /** Tenant boundary to enforce in the repository. */
  tenantId: TenantId;
  /** Envelope whose audit trail will be listed. */
  envelopeId: EnvelopeId;
  /** Opaque forward cursor (optional). */
  cursor?: PaginationCursor;
  /** Requested page size (will be clamped server-side). */
  limit?: number;
}

/** Output contract for ListAuditTrail. */
export interface ListAuditTrailOutput {
  /** Page items in ascending chronological order. */
  items: AuditEvent[];
  /** Opaque cursor to continue listing (omitted when no more items). */
  nextCursor?: PaginationCursor;
}

/** Use case context for ListAuditTrail. */
export interface ListAuditTrailContext {
  repos: {
    audit: AuditRepository;
  };
}

/**
 * Lists audit events for an envelope using forward-only cursor pagination.
 *
 * @param input - Tenant/envelope boundary and pagination hints.
 * @param ctx - Repository port wrapper.
 * @returns Page of audit events and optional continuation cursor.
 */
export const listAuditTrail = async (
  input: ListAuditTrailInput,
  ctx: ListAuditTrailContext
): Promise<ListAuditTrailOutput> => {
  // Clamp page size via domain rule (protects resources and enforces limits)
  const pageSize = Rules.RateLimits.clampListPageSize(input.limit);

  const page = await ctx.repos.audit.listByEnvelope({
    tenantId: input.tenantId,
    envelopeId: input.envelopeId,
    limit: pageSize,
    cursor: input.cursor,
  });

  // Post-conditions: ordering and immutability
  Rules.Audit.assertAscendingByTime(page.items);
  for (const ev of page.items) Rules.Audit.assertImmutable(ev);

  const nextCursor = page.meta?.nextCursor as PaginationCursor | undefined;

  return { items: page.items, nextCursor };
};
