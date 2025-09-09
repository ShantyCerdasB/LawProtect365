/**
 * @file RequestsRateLimitService.ts
 * @summary Rate limiting service for requests operations
 * @description Provides rate limiting for request operations to prevent spam
 */


import type { EnvelopeId, PartyId } from "@/domain/value-objects/ids";
import type { ActorContext, RateLimitStore } from "@lawprotect/shared-ts";
import type { RequestsRateLimitService as IRequestsRateLimitService } from "../../../domain/types/requests/ServiceInterfaces";

/**
 * @summary Rate limiting service for requests operations
 * @description Prevents spam by limiting the frequency of request operations
 */
export class RequestsRateLimitService implements IRequestsRateLimitService {
  constructor(private readonly rateLimitStore: RateLimitStore) {}

  /**
   * @summary Check rate limit for invite operations
   * @description Maximum 5 invites per day per envelope per actor
   */
  async checkInviteLimit(envelopeId: EnvelopeId, actor: ActorContext): Promise<void> {
    const key = `invite:${envelopeId}:${actor.userId}`;
    const window = {
      maxRequests: 5,
      windowSeconds: 24 * 60 * 60, // 24 hours in seconds
      ttlSeconds: 24 * 60 * 60, // 24 hours in seconds
    };
    
    await this.rateLimitStore.incrementAndCheck(key, window);
  }

  /**
   * @summary Check rate limit for remind operations
   * @description Maximum 3 reminders per day per party per actor
   */
  async checkRemindLimit(envelopeId: EnvelopeId, partyId: PartyId, actor: ActorContext): Promise<void> {
    const key = `remind:${envelopeId}:${partyId}:${actor.userId}`;
    const window = {
      maxRequests: 3,
      windowSeconds: 24 * 60 * 60, // 24 hours in seconds
      ttlSeconds: 24 * 60 * 60, // 24 hours in seconds
    };
    
    await this.rateLimitStore.incrementAndCheck(key, window);
  }

  /**
   * @summary Check rate limit for request signature operations
   * @description Maximum 10 signature requests per day per party per actor
   */
  async checkRequestSignatureLimit(envelopeId: EnvelopeId, partyId: PartyId, actor: ActorContext): Promise<void> {
    const key = `request_signature:${envelopeId}:${partyId}:${actor.userId}`;
    const window = {
      maxRequests: 10,
      windowSeconds: 24 * 60 * 60, // 24 hours in seconds
      ttlSeconds: 24 * 60 * 60, // 24 hours in seconds
    };
    
    await this.rateLimitStore.incrementAndCheck(key, window);
  }

  /**
   * @summary Check rate limit for add viewer operations
   * @description Maximum 20 add viewer operations per day per envelope per actor
   */
  async checkAddViewerLimit(envelopeId: EnvelopeId, actor: ActorContext): Promise<void> {
    const key = `add_viewer:${envelopeId}:${actor.userId}`;
    const window = {
      maxRequests: 20,
      windowSeconds: 24 * 60 * 60, // 24 hours in seconds
      ttlSeconds: 24 * 60 * 60, // 24 hours in seconds
    };
    
    await this.rateLimitStore.incrementAndCheck(key, window);
  }

  /**
   * @summary Check rate limit for cancel operations
   * @description Maximum 5 cancel operations per day per envelope per actor
   */
  async checkCancelLimit(envelopeId: EnvelopeId, actor: ActorContext): Promise<void> {
    const key = `cancel:${envelopeId}:${actor.userId}`;
    const window = {
      maxRequests: 5,
      windowSeconds: 24 * 60 * 60, // 24 hours in seconds
      ttlSeconds: 24 * 60 * 60, // 24 hours in seconds
    };
    
    await this.rateLimitStore.incrementAndCheck(key, window);
  }

  /**
   * @summary Check rate limit for decline operations
   * @description Maximum 5 decline operations per day per envelope per actor
   */
  async checkDeclineLimit(envelopeId: EnvelopeId, actor: ActorContext): Promise<void> {
    const key = `decline:${envelopeId}:${actor.userId}`;
    const window = {
      maxRequests: 5,
      windowSeconds: 24 * 60 * 60, // 24 hours in seconds
      ttlSeconds: 24 * 60 * 60, // 24 hours in seconds
    };
    
    await this.rateLimitStore.incrementAndCheck(key, window);
  }

  /**
   * @summary Check rate limit for finalise operations
   * @description Maximum 3 finalise operations per day per envelope per actor
   */
  async checkFinaliseLimit(envelopeId: EnvelopeId, actor: ActorContext): Promise<void> {
    const key = `finalise:${envelopeId}:${actor.userId}`;
    const window = {
      maxRequests: 3,
      windowSeconds: 24 * 60 * 60, // 24 hours in seconds
      ttlSeconds: 24 * 60 * 60, // 24 hours in seconds
    };
    
    await this.rateLimitStore.incrementAndCheck(key, window);
  }
};
