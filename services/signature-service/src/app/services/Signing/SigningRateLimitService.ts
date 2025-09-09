/**
 * @file SigningRateLimitService.ts
 * @summary Rate limit service for Signing operations
 * @description Handles rate limiting for Signing operations using domain rules
 */


import type { EnvelopeId, PartyId, TenantId } from "@/domain/value-objects/ids";
import type { SigningRateLimitService } from "../../../domain/types/signing";
import { TooManyRequestsError, RateLimitStore } from "@lawprotect/shared-ts";
import { SignatureErrorCodes } from "../../../shared/errors";

/**
 * @description Default implementation of SigningRateLimitService
 */
export class DefaultSigningRateLimitService implements SigningRateLimitService {
  constructor(private readonly rateLimitStore: RateLimitStore) {}

  /**
   * @summary Checks and enforces signing preparation rate limits
   * @description Enforces rate limits for signing preparation requests per party per envelope
   * @param envelopeId - Envelope identifier
   * @param partyId - Party identifier
   * @param tenantId - Tenant identifier
   * @throws {TooManyRequestsError} When rate limit is exceeded
   */
  async checkPrepareSigningRateLimit(
    envelopeId: EnvelopeId,
    partyId: PartyId,
    tenantId: TenantId
  ): Promise<void> {
    const rateLimitKey = `prepare:${tenantId}:${envelopeId}:${partyId}`;
    
    try {
      await this.rateLimitStore.incrementAndCheck(rateLimitKey, {
        windowSeconds: 60, // 1 minute window
        maxRequests: 5, // 5 requests per minute
        ttlSeconds: 300, // 5 minutes TTL
      });
    } catch (error) {
      if (error instanceof TooManyRequestsError) {
        throw new TooManyRequestsError(
          "Signing preparation rate limit exceeded",
          SignatureErrorCodes.RATE_LIMIT_PARTY_INVITE,
          {
            envelopeId,
            partyId,
            tenantId,
            retryAfterSeconds: 60,
          }
        );
      }
      throw error;
    }
  }

  /**
   * @summary Checks and enforces signing completion rate limits
   * @description Enforces rate limits for signing completion attempts per party per envelope
   * @param envelopeId - Envelope identifier
   * @param partyId - Party identifier
   * @param tenantId - Tenant identifier
   * @throws {TooManyRequestsError} When rate limit is exceeded
   */
  async checkSigningRateLimit(
    envelopeId: EnvelopeId,
    partyId: PartyId,
    tenantId: TenantId
  ): Promise<void> {
    const rateLimitKey = `signing:${tenantId}:${envelopeId}:${partyId}`;
    
    try {
      await this.rateLimitStore.incrementAndCheck(rateLimitKey, {
        windowSeconds: 300, // 5 minute window
        maxRequests: 3, // 3 attempts per 5 minutes
        ttlSeconds: 600, // 10 minutes TTL
      });
    } catch (error) {
      if (error instanceof TooManyRequestsError) {
        throw new TooManyRequestsError(
          "Signing completion rate limit exceeded",
          SignatureErrorCodes.RATE_LIMIT_ENVELOPE_SEND,
          {
            envelopeId,
            partyId,
            tenantId,
            retryAfterSeconds: 300,
          }
        );
      }
      throw error;
    }
  }
}






