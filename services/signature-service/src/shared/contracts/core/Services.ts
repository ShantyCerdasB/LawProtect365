/**
 * @file Services.ts
 * @summary Application services contracts
 * @description Shared contracts for high-level application services
 */

import type { TenantId, UserId } from "@lawprotect/shared-ts";
import type { Envelope } from "../../../domain/entities/Envelope";
import { ActorContext } from "../../../domain/entities";


/**
 * @summary Application services exposed to controllers
 * @description Provides high-level business operations for envelope management
 * and other domain operations.
 */
export interface Services {
  /** Envelope-related business operations */
  readonly envelopes: {
    /**
     * @summary Creates a new envelope with the specified parameters
     * @description Creates a new envelope with the specified tenant, owner, title, and actor information.
     * @param input - Envelope creation parameters including tenant, owner, title, and actor
     * @param opts - Optional idempotency and TTL settings
     * @returns Promise resolving to the created envelope
     */
    create(
      input: {
        readonly tenantId: TenantId;
        readonly ownerId: UserId;
        readonly title: string;
        readonly actor?: ActorContext;
      },
      opts?: { 
        readonly idempotencyKey?: string; 
        readonly ttlSeconds?: number 
      }
    ): Promise<{ readonly envelope: Envelope }>;
  };
}
