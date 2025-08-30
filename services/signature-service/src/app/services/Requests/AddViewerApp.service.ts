/**
 * @file AddViewerApp.service.ts
 * @summary Application service for adding viewers to envelopes.
 * @description Orchestrates add viewer operations, delegates to RequestsCommandsPort,
 * and handles validation logic. Uses branded types for type safety.
 */

import type { EnvelopeId, PartyId } from "@/app/ports/shared";
import type { RequestsCommandsPort } from "@/app/ports/requests/RequestsCommandsPort";

/**
 * @description Actor context for audit and attribution purposes.
 */
export interface ActorContext {
  /** User identifier */
  userId?: string;
  /** User email address */
  email?: string;
  /** Client IP address */
  ip?: string;
  /** User agent string */
  userAgent?: string;
  /** User locale preference */
  locale?: string;
}

/**
 * @description Input parameters for adding a viewer to an envelope.
 */
export interface AddViewerAppInput {
  /** The envelope ID to add the viewer to */
  envelopeId: EnvelopeId;
  /** Email address of the viewer */
  email: string;
  /** Optional name of the viewer */
  name?: string;
  /** Optional locale preference for the viewer */
  locale?: string;
  /** Optional actor context for audit purposes */
  actor?: ActorContext;
}

/**
 * @description Output result for adding a viewer.
 */
export interface AddViewerAppResult {
  /** The party ID of the newly created viewer */
  partyId: PartyId;
  /** The email address of the viewer */
  email: string;
  /** Timestamp when the viewer was added */
  addedAt: string;
}

/**
 * @description Dependencies required by the AddViewerApp service.
 */
export interface AddViewerAppDependencies {
  /** Requests commands port for add viewer operations */
  requestsCommands: RequestsCommandsPort;
}

/**
 * @description Adds a viewer to an envelope with proper validation and event emission.
 * 
 * @param {AddViewerAppInput} input - The input parameters containing add viewer data
 * @param {AddViewerAppDependencies} deps - The dependencies containing the requests commands port
 * @returns {Promise<AddViewerAppResult>} Promise resolving to add viewer result
 * @throws {AppError} When validation fails or add viewer fails
 */
export const addViewerApp = async (
  input: AddViewerAppInput,
  deps: AddViewerAppDependencies
): Promise<AddViewerAppResult> => {
  const result = await deps.requestsCommands.addViewer({
    envelopeId: input.envelopeId,
    email: input.email,
    name: input.name,
    locale: input.locale,
    actor: input.actor,
  });

  return {
    partyId: result.partyId,
    email: result.email,
    addedAt: result.addedAt,
  };
};
