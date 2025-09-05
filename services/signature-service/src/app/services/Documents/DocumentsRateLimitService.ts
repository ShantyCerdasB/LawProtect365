/**
 * @file DocumentsRateLimitService.ts
 * @summary Rate limit service for Documents operations
 * @description Handles rate limiting for Documents operations using domain rules
 */

import type { DocumentId, EnvelopeId, TenantId } from "../../../domain/value-objects/Ids";
import { TooManyRequestsError } from "@lawprotect/shared-ts";
import { SignatureErrorCodes } from "../../../shared/errors";
import { RateLimitStore } from "@/shared/contracts/ratelimit";
import { UPLOAD_RATE_LIMITS } from "../../../domain/values/enums";

/**
 * @description Service interface for Documents rate limit operations
 */
export interface DocumentsRateLimitService {
  /**
   * Checks and enforces document upload rate limits
   * @param tenantId - Tenant identifier
   * @param envelopeId - Envelope identifier
   * @param actorUserId - Actor user identifier
   * @throws {TooManyRequestsError} When rate limit is exceeded
   */
  checkDocumentUploadRateLimit(
    tenantId: TenantId,
    envelopeId: EnvelopeId,
    actorUserId: string
  ): Promise<void>;

  /**
   * Checks and enforces document creation rate limits
   * @param tenantId - Tenant identifier
   * @param envelopeId - Envelope identifier
   * @param actorUserId - Actor user identifier
   * @throws {TooManyRequestsError} When rate limit is exceeded
   */
  checkDocumentCreationRateLimit(
    tenantId: TenantId,
    envelopeId: EnvelopeId,
    actorUserId: string
  ): Promise<void>;

  /**
   * Checks and enforces document update rate limits
   * @param tenantId - Tenant identifier
   * @param envelopeId - Envelope identifier
   * @param actorUserId - Actor user identifier
   * @throws {TooManyRequestsError} When rate limit is exceeded
   */
  checkDocumentUpdateRateLimit(
    tenantId: TenantId,
    envelopeId: EnvelopeId,
    actorUserId: string
  ): Promise<void>;

  /**
   * Checks and enforces document deletion rate limits
   * @param tenantId - Tenant identifier
   * @param envelopeId - Envelope identifier
   * @param actorUserId - Actor user identifier
   * @throws {TooManyRequestsError} When rate limit is exceeded
   */
  checkDocumentDeletionRateLimit(
    tenantId: TenantId,
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
   * @description Enforces rate limits for document upload requests per user per envelope
   * @param tenantId - Tenant identifier
   * @param envelopeId - Envelope identifier
   * @param actorUserId - Actor user identifier
   * @throws {TooManyRequestsError} When rate limit is exceeded
   */
  async checkDocumentUploadRateLimit(
    tenantId: TenantId,
    envelopeId: EnvelopeId,
    actorUserId: string
  ): Promise<void> {
    const key = `documents:upload:${tenantId}:${envelopeId}:${actorUserId}`;
    const limit = UPLOAD_RATE_LIMITS.DOCUMENT_UPLOAD_PER_HOUR;
    const windowMs = 60 * 60 * 1000; // 1 hour

    const current = await this.rateLimitStore.increment(key, windowMs);
    
    if (current > limit) {
      throw new TooManyRequestsError(
        `Document upload rate limit exceeded. Maximum ${limit} uploads per hour allowed.`,
        SignatureErrorCodes.DOCUMENT_UPLOAD_RATE_LIMIT_EXCEEDED,
        {
          tenantId,
          envelopeId,
          actorUserId,
          current,
          limit,
          windowMs,
        }
      );
    }
  }

  /**
   * @summary Checks and enforces document creation rate limits
   * @description Enforces rate limits for document creation requests per user per envelope
   * @param tenantId - Tenant identifier
   * @param envelopeId - Envelope identifier
   * @param actorUserId - Actor user identifier
   * @throws {TooManyRequestsError} When rate limit is exceeded
   */
  async checkDocumentCreationRateLimit(
    tenantId: TenantId,
    envelopeId: EnvelopeId,
    actorUserId: string
  ): Promise<void> {
    const key = `documents:create:${tenantId}:${envelopeId}:${actorUserId}`;
    const limit = UPLOAD_RATE_LIMITS.DOCUMENT_CREATE_PER_HOUR;
    const windowMs = 60 * 60 * 1000; // 1 hour

    const current = await this.rateLimitStore.increment(key, windowMs);
    
    if (current > limit) {
      throw new TooManyRequestsError(
        `Document creation rate limit exceeded. Maximum ${limit} creations per hour allowed.`,
        SignatureErrorCodes.DOCUMENT_CREATE_RATE_LIMIT_EXCEEDED,
        {
          tenantId,
          envelopeId,
          actorUserId,
          current,
          limit,
          windowMs,
        }
      );
    }
  }

  /**
   * @summary Checks and enforces document update rate limits
   * @description Enforces rate limits for document update requests per user per envelope
   * @param tenantId - Tenant identifier
   * @param envelopeId - Envelope identifier
   * @param actorUserId - Actor user identifier
   * @throws {TooManyRequestsError} When rate limit is exceeded
   */
  async checkDocumentUpdateRateLimit(
    tenantId: TenantId,
    envelopeId: EnvelopeId,
    actorUserId: string
  ): Promise<void> {
    const key = `documents:update:${tenantId}:${envelopeId}:${actorUserId}`;
    const limit = UPLOAD_RATE_LIMITS.DOCUMENT_UPDATE_PER_HOUR;
    const windowMs = 60 * 60 * 1000; // 1 hour

    const current = await this.rateLimitStore.increment(key, windowMs);
    
    if (current > limit) {
      throw new TooManyRequestsError(
        `Document update rate limit exceeded. Maximum ${limit} updates per hour allowed.`,
        SignatureErrorCodes.DOCUMENT_UPDATE_RATE_LIMIT_EXCEEDED,
        {
          tenantId,
          envelopeId,
          actorUserId,
          current,
          limit,
          windowMs,
        }
      );
    }
  }

  /**
   * @summary Checks and enforces document deletion rate limits
   * @description Enforces rate limits for document deletion requests per user per envelope
   * @param tenantId - Tenant identifier
   * @param envelopeId - Envelope identifier
   * @param actorUserId - Actor user identifier
   * @throws {TooManyRequestsError} When rate limit is exceeded
   */
  async checkDocumentDeletionRateLimit(
    tenantId: TenantId,
    envelopeId: EnvelopeId,
    actorUserId: string
  ): Promise<void> {
    const key = `documents:delete:${tenantId}:${envelopeId}:${actorUserId}`;
    const limit = UPLOAD_RATE_LIMITS.DOCUMENT_DELETE_PER_HOUR;
    const windowMs = 60 * 60 * 1000; // 1 hour

    const current = await this.rateLimitStore.increment(key, windowMs);
    
    if (current > limit) {
      throw new TooManyRequestsError(
        `Document deletion rate limit exceeded. Maximum ${limit} deletions per hour allowed.`,
        SignatureErrorCodes.DOCUMENT_DELETE_RATE_LIMIT_EXCEEDED,
        {
          tenantId,
          envelopeId,
          actorUserId,
          current,
          limit,
          windowMs,
        }
      );
    }
  }
}
