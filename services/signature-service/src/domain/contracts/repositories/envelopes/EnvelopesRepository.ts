/**
 * @file EnvelopesRepository.ts
 * @summary Repository contract for envelopes
 * @description Defines the interface for envelope persistence operations
 * 
 * This module defines the contract for envelope persistence operations,
 * extending the base Repository interface with envelope-specific methods
 * for tenant-based queries and pagination.
 */

import { Envelope } from "@/domain/entities";
import { EnvelopeId } from "@/domain/value-objects/index";
import type { Repository } from "@lawprotect/shared-ts";

/**
 * @summary Repository interface for envelope operations
 * @description Extends base Repository with envelope-specific methods
 */
export interface EnvelopesRepository extends Repository<Envelope, EnvelopeId, undefined> {
  /**
   * @summary Lists all envelopes with pagination
   * @description Retrieves all envelopes using cursor-based pagination
   * @param params - List parameters
   * @param params.limit - Maximum number of items to return
   * @param params.cursor - Optional cursor for pagination
   * @returns Promise with items and next cursor
   */
  listAll(params: {
    limit: number;
    cursor?: string;
  }): Promise<{ items: Envelope[]; nextCursor?: string }>;
}
