/**
 * @file DocumentsRateLimitService.ts
 * @summary Rate limit service for Documents operations
 * @description Handles rate limiting for Documents operations using domain rules
 */

import type { EnvelopeId } from "../../../domain/value-objects/ids";
import { TooManyRequestsError, RateLimitStore } from "@lawprotect/shared-ts";
import { SignatureErrorCodes } from "../../../shared/errors";
import { UPLOAD_RATE_LIMITS } from "../../../domain/values/enums";

/**
 * @description Service interface for Documents rate limit operations
 */
export interface DocumentsRateLimitService {
  /**
   * Checks and enforces document upload rate limits   * @param envelopeId - Envelope identifier
   * @param actorUserId - Actor user identifier
   * @throws {TooManyRequestsError} When rate limit is exceeded
   */
  checkDocumentUploadRateLimit(
    envelopeId: EnvelopeId,
    actorUserId: string
  ): Promise<void>;

  /**
   * Checks and enforces document creation rate limits   * @param envelopeId - Envelope identifier
   * @param actorUserId - Actor user identifier
   * @throws {TooManyRequestsError} When rate limit is exceeded
   */
  checkDocumentCreationRateLimit(
    envelopeId: EnvelopeId,
    actorUserId: string
  ): Promise<void>;

  /**
   * Checks and enforces document update rate limits   * @param envelopeId - Envelope identifier
   * @param actorUserId - Actor user identifier
   * @throws {TooManyRequestsError} When rate limit is exceeded
   */
  checkDocumentUpdateRateLimit(
    envelopeId: EnvelopeId,
    actorUserId: string
  ): Promise<void>;

  /**
   * Checks and enforces document deletion rate limits   * @param envelopeId - Envelope identifier
   * @param actorUserId - Actor user identifier
   * @throws {TooManyRequestsError} When rate limit is exceeded
   */
  checkDocumentDeletionRateLimit(
    envelopeId: EnvelopeId,
    actorUserId: string
  ): Promise<void>;
}

/**
 * @description Default implementation of DocumentsRateLimitService
 */
export class DefaultDocumentsRateLimitService implements DocumentsRateLimitService {
  constructor(private readonly rateLimitStore: RateLimitStore) {}

  /**
   * @summary Checks and enforces document upload rate limits
   * @description Enforces rate limits for document upload requests per user per envelope   * @param envelopeId - Envelope identifier
   * @param actorUserId - Actor user identifier
   * @throws {TooManyRequestsError} When rate limit is exceeded
   */
  async checkDocumentUploadRateLimit(
    envelopeId: EnvelopeId,
    actorUserId: string
  ): Promise<void> {
    const key = `documents:upload:${envelopeId}:${actorUserId}`;
    const limit = UPLOAD_RATE_LIMITS.EVIDENCE_PER_HOUR;
    const windowMs = 60 * 60 * 1000; // 1 hour

    const usage = await this.rateLimitStore.incrementAndCheck(key, { 
      windowSeconds: 3600, // 1 hour
      maxRequests: limit,
      ttlSeconds: 3600
    });
    const current = usage.currentUsage;
    
    if (current > limit) {
      throw new TooManyRequestsError(
        `Document upload rate limit exceeded. Maximum ${limit} uploads per hour allowed.`,
        SignatureErrorCodes.RATE_LIMIT_ENVELOPE_SEND,
        {
          envelopeId,
          actorUserId,
          current,
          limit,
          windowMs}
      );
    }
  }

  /**
   * @summary Checks and enforces document creation rate limits
   * @description Enforces rate limits for document creation requests per user per envelope   * @param envelopeId - Envelope identifier
   * @param actorUserId - Actor user identifier
   * @throws {TooManyRequestsError} When rate limit is exceeded
   */
  async checkDocumentCreationRateLimit(
    envelopeId: EnvelopeId,
    actorUserId: string
  ): Promise<void> {
    const key = `documents:create:${envelopeId}:${actorUserId}`;
    const limit = UPLOAD_RATE_LIMITS.EVIDENCE_PER_HOUR;
    const windowMs = 60 * 60 * 1000; // 1 hour

    const usage = await this.rateLimitStore.incrementAndCheck(key, { 
      windowSeconds: 3600, // 1 hour
      maxRequests: limit,
      ttlSeconds: 3600
    });
    const current = usage.currentUsage;
    
    if (current > limit) {
      throw new TooManyRequestsError(
        `Document creation rate limit exceeded. Maximum ${limit} creations per hour allowed.`,
        SignatureErrorCodes.RATE_LIMIT_ENVELOPE_SEND,
        {
          envelopeId,
          actorUserId,
          current,
          limit,
          windowMs}
      );
    }
  }

  /**
   * @summary Checks and enforces document update rate limits
   * @description Enforces rate limits for document update requests per user per envelope   * @param envelopeId - Envelope identifier
   * @param actorUserId - Actor user identifier
   * @throws {TooManyRequestsError} When rate limit is exceeded
   */
  async checkDocumentUpdateRateLimit(
    envelopeId: EnvelopeId,
    actorUserId: string
  ): Promise<void> {
    const key = `documents:update:${envelopeId}:${actorUserId}`;
    const limit = UPLOAD_RATE_LIMITS.EVIDENCE_PER_HOUR;
    const windowMs = 60 * 60 * 1000; // 1 hour

    const usage = await this.rateLimitStore.incrementAndCheck(key, { 
      windowSeconds: 3600, // 1 hour
      maxRequests: limit,
      ttlSeconds: 3600
    });
    const current = usage.currentUsage;
    
    if (current > limit) {
      throw new TooManyRequestsError(
        `Document update rate limit exceeded. Maximum ${limit} updates per hour allowed.`,
        SignatureErrorCodes.RATE_LIMIT_ENVELOPE_SEND,
        {
          envelopeId,
          actorUserId,
          current,
          limit,
          windowMs}
      );
    }
  }

  /**
   * @summary Checks and enforces document deletion rate limits
   * @description Enforces rate limits for document deletion requests per user per envelope   * @param envelopeId - Envelope identifier
   * @param actorUserId - Actor user identifier
   * @throws {TooManyRequestsError} When rate limit is exceeded
   */
  async checkDocumentDeletionRateLimit(
    envelopeId: EnvelopeId,
    actorUserId: string
  ): Promise<void> {
    const key = `documents:delete:${envelopeId}:${actorUserId}`;
    const limit = UPLOAD_RATE_LIMITS.EVIDENCE_PER_HOUR;
    const windowMs = 60 * 60 * 1000; // 1 hour

    const usage = await this.rateLimitStore.incrementAndCheck(key, { 
      windowSeconds: 3600, // 1 hour
      maxRequests: limit,
      ttlSeconds: 3600
    });
    const current = usage.currentUsage;
    
    if (current > limit) {
      throw new TooManyRequestsError(
        `Document deletion rate limit exceeded. Maximum ${limit} deletions per hour allowed.`,
        SignatureErrorCodes.RATE_LIMIT_ENVELOPE_SEND,
        {
          envelopeId,
          actorUserId,
          current,
          limit,
          windowMs}
      );
    }
  }
};
