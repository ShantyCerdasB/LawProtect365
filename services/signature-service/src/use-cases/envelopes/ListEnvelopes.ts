/**
 * @file ListEnvelopes.ts
 * @summary Lists envelopes for a tenant with forward cursor pagination.
 *
 * @description
 * - Delegates pagination to the repository `listByTenant`.
 * - Clamps page size via domain rate-limit rule.
 * - Returns items and nextCursor for the controller to emit.
 */

import type { Envelope } from "@/domain/entities/Envelope";
import type { TenantId, EnvelopeId } from "@/domain/value-objects";
import type { Repository } from "@lawprotect/shared-ts";
import * as Rules from "@/domain/rules";

export interface ListEnvelopesInput {
  tenantId: TenantId;
  limit?: number;
  cursor?: string;
}

export interface ListEnvelopesOutput {
  items: Envelope[];
  nextCursor?: string;
}

export interface ListEnvelopesContext {
  repos: {
    // Base CRUD + an extra method exposed by the concrete repo
    envelopes: Repository<Envelope, EnvelopeId> & {
      listByTenant(args: { tenantId: TenantId; limit: number; cursor?: string }): Promise<{
        items: Envelope[];
        nextCursor?: string;
      }>;
    };
  };
}

export const listEnvelopes = async (
  input: ListEnvelopesInput,
  ctx: ListEnvelopesContext
): Promise<ListEnvelopesOutput> => {
  const pageSize = Rules.RateLimits.clampListPageSize(input.limit);
  const page = await ctx.repos.envelopes.listByTenant({
    tenantId: input.tenantId,
    limit: pageSize,
    cursor: input.cursor,
  });
  return { items: page.items, nextCursor: page.nextCursor };
};
