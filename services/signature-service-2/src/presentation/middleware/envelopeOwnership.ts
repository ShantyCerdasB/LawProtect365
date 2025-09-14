/**
 * @file envelopeOwnership.ts
 * @summary Envelope ownership validation middleware
 * @description Validates that users can only access their own envelopes
 * Uses shared-ts auth system and envelope repository
 */

import { requireAuth } from "@lawprotect/shared-ts";
import { ForbiddenError } from "../../shared/errors";
import { ErrorCodes } from "../../shared/errors";
import type { EnvelopeId } from "../../domain/value-objects/index";
import type { EnvelopesRepository } from "../../domain/contracts/repositories/envelopes/EnvelopesRepository";
import type { ApiEvent } from "@lawprotect/shared-ts";

/**
 * Validates that the authenticated user owns the specified envelope
 * @param evt - API event with auth context
 * @param envelopeId - ID of the envelope to validate
 * @param envelopesRepo - Envelope repository for ownership lookup
 * @throws ForbiddenError if user doesn't own the envelope
 */
export const validateEnvelopeOwnership = async (
  evt: ApiEvent,
  envelopeId: EnvelopeId,
  envelopesRepo: EnvelopesRepository
): Promise<void> => {
  // Extract authenticated user from JWT token
  const auth = requireAuth(evt);
  
  if (!auth.email) {
    throw new ForbiddenError(
      "Missing email in authentication context",
      ErrorCodes.AUTH_FORBIDDEN,
      { envelopeId }
    );
  }

  // Get envelope to validate ownership
  const envelope = await envelopesRepo.getById(envelopeId);
  if (!envelope) {
    throw new ForbiddenError(
      "Envelope not found",
      ErrorCodes.AUTH_FORBIDDEN,
      { envelopeId, userEmail: auth.email }
    );
  }

  // Validate ownership
  if (envelope.ownerEmail !== auth.email) {
    throw new ForbiddenError(
      "Unauthorized: You can only access your own envelopes",
      ErrorCodes.AUTH_FORBIDDEN,
      {
        userEmail: auth.email,
        envelopeOwnerEmail: envelope.ownerEmail,
        envelopeId
      }
    );
  }
};

/**
 * Middleware factory for envelope ownership validation
 * @param envelopesRepo - Envelope repository for ownership validation
 * @returns Middleware function that validates envelope ownership
 */
export const createEnvelopeOwnershipMiddleware = (envelopesRepo: EnvelopesRepository) => {
  return async (evt: ApiEvent, envelopeId: EnvelopeId): Promise<void> => {
    await validateEnvelopeOwnership(evt, envelopeId, envelopesRepo);
  };
};

