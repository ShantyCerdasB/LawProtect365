/**
 * @file PartiesRateLimitService.ts
 * @summary Rate limiting service for Parties operations
 * @description Prevents abuse by limiting the number of parties that can be created
 * per envelope within a time window. Uses tenant + envelope scoped keys.
 */

import type { RateLimitStore } from "@lawprotect/shared-ts";
import type { TenantId, EnvelopeId } from "@/domain/value-objects/ids";
import type { PartiesRateLimitConfig } from "../../../domain/types/parties/PartiesTypes";
import { TooManyRequestsError, ErrorCodes } from "@lawprotect/shared-ts";

/**
 * @description Rate limiting service for Parties operations
 */
export class PartiesRateLimitService {
  constructor(
    private readonly rateLimitStore: RateLimitStore,
    private readonly config: PartiesRateLimitConfig
  ) {}

  /**
   * @description Checks if creating a new party would exceed rate limits
   * @param tenantId Tenant identifier
   * @param envelopeId Envelope identifier
   * @throws {TooManyRequestsError} If rate limit is exceeded
   */
  async checkCreatePartyLimit(tenantId: TenantId, envelopeId: EnvelopeId): Promise<void> {
    const key = `parties:create:${tenantId}:${envelopeId}`;
    
    try {
      await this.rateLimitStore.incrementAndCheck(key, {
        maxRequests: this.config.maxPartiesPerEnvelope,
        windowSeconds: this.config.windowSeconds,
        ttlSeconds: this.config.ttlSeconds,
      });
    } catch (error) {
      if (error instanceof TooManyRequestsError) {
        // Re-throw with more specific message
        throw new TooManyRequestsError(
          `Rate limit exceeded: Cannot create more than ${this.config.maxPartiesPerEnvelope} parties per envelope within ${this.config.windowSeconds} seconds`,
          ErrorCodes.COMMON_TOO_MANY_REQUESTS,
          {
            tenantId,
            envelopeId,
            maxPartiesPerEnvelope: this.config.maxPartiesPerEnvelope,
            windowSeconds: this.config.windowSeconds,
            resetInSeconds: this.config.windowSeconds,
          }
        );
      }
      throw error;
    }
  }

  /**
   * @description Gets current rate limit usage for an envelope
   * @param tenantId Tenant identifier
   * @param envelopeId Envelope identifier
   * @returns Current usage information
   */
  async getCurrentUsage(tenantId: TenantId, envelopeId: EnvelopeId): Promise<{
    currentUsage: number;
    maxRequests: number;
    resetInSeconds: number;
  }> {
    const key = `parties:create:${tenantId}:${envelopeId}`;
    
    try {
      const usage = await this.rateLimitStore.incrementAndCheck(key, {
        maxRequests: this.config.maxPartiesPerEnvelope,
        windowSeconds: this.config.windowSeconds,
        ttlSeconds: this.config.ttlSeconds,
      });
      
      return {
        currentUsage: usage.currentUsage,
        maxRequests: usage.maxRequests,
        resetInSeconds: usage.resetInSeconds,
      };
    } catch (error) {
      if (error instanceof TooManyRequestsError) {
        // Return max usage when limit is exceeded
        return {
          currentUsage: this.config.maxPartiesPerEnvelope,
          maxRequests: this.config.maxPartiesPerEnvelope,
          resetInSeconds: this.config.windowSeconds,
        };
      }
      throw error;
    }
  }
};
