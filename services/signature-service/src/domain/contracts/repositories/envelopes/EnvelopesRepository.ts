/**
 * @file EnvelopesRepository.ts
 * @summary Repository contract for envelopes
 * @description Defines the interface for envelope persistence operations
 */

import { Envelope } from "@/domain/entities";
import { EnvelopeId, TenantId } from "@/domain/value-objects/index";
import type { Repository } from "@lawprotect/shared-ts";


/**
 * @summary Repository interface for envelope operations
 * @description Extends base Repository with envelope-specific methods
 */
export interface EnvelopesRepository extends Repository<Envelope, EnvelopeId, undefined> {
  /**
   * @summary Lists envelopes by tenant with pagination
   * @description Retrieves envelopes for a specific tenant using cursor-based pagination
   * @param params.tenantId - Tenant identifier
   * @param params.limit - Maximum number of items to return
   * @param params.cursor - Optional cursor for pagination
   * @returns Promise with items and next cursor
   */
  listByTenant(params: {
    tenantId: TenantId;
    limit: number;
    cursor?: string;
  }): Promise<{ items: Envelope[]; nextCursor?: string }>;
}






