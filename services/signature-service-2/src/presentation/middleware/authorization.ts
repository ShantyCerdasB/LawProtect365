/**
 * @file authorization.ts
 * @summary Authorization middleware for envelope access control
 * @description Middleware to validate that users can only access their own envelopes
 */

import { ForbiddenError } from "../../shared/errors";
import { ErrorCodes } from "../../shared/errors";
import type { EnvelopeId } from "../../domain/value-objects/index";

/**
 * Validates that the actor can access the specified envelope
 * @param actorEmail - Email of the authenticated user
 * @param envelopeId - ID of the envelope to access
 * @param envelopeOwnerEmail - Email of the envelope owner
 * @throws ForbiddenError if access is denied
 */
export const validateEnvelopeAccess = (
  actorEmail: string,
  envelopeId: EnvelopeId,
  envelopeOwnerEmail: string
): void => {
  if (actorEmail !== envelopeOwnerEmail) {
    throw new ForbiddenError(
      "Unauthorized: You can only access your own envelopes",
      ErrorCodes.AUTH_FORBIDDEN,
      {
        actorEmail,
        envelopeOwnerEmail,
        envelopeId
      }
    );
  }
};

/**
 * Validates that the actor can create resources for the specified envelope
 * @param actorEmail - Email of the authenticated user
 * @param envelopeId - ID of the envelope
 * @param envelopeOwnerEmail - Email of the envelope owner
 * @throws ForbiddenError if access is denied
 */
export const validateEnvelopeCreationAccess = (
  actorEmail: string,
  envelopeId: EnvelopeId,
  envelopeOwnerEmail: string
): void => {
  if (actorEmail !== envelopeOwnerEmail) {
    throw new ForbiddenError(
      "Unauthorized: You can only create resources for your own envelopes",
      ErrorCodes.AUTH_FORBIDDEN,
      {
        actorEmail,
        envelopeOwnerEmail,
        envelopeId
      }
    );
  }
};

