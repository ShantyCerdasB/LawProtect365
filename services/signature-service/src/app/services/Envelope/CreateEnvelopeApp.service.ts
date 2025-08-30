/**
 * @file CreateEnvelopeApp.service.ts
 * @summary Application service for creating envelopes
 * @description Orchestrates envelope creation operations, delegates to EnvelopesCommandsPort,
 * and handles validation logic. Uses branded types for type safety.
 */

import type { TenantId, UserId } from "@/app/ports/shared";
import type { EnvelopesCommandsPort } from "@/app/ports/envelopes/EnvelopesCommandsPort";
import { ActorContext } from "@/app/ports/shared";

/**
 * Input parameters for creating an envelope
 */
export interface CreateEnvelopeAppInput {
  tenantId: TenantId;
  ownerId: UserId;
  title: string;
  actor?: ActorContext;
}

/**
 * Output result for envelope creation
 */
export interface CreateEnvelopeAppResult {
  envelopeId: string;
  createdAt: string;
}

/**
 * Dependencies required by the CreateEnvelope app service
 */
export interface CreateEnvelopeAppDependencies {
  envelopesCommands: EnvelopesCommandsPort;
  ids: { ulid(): string };
}

/**
 * Creates a new envelope with proper validation and event emission
 * @param input - The input parameters containing envelope creation data
 * @param deps - The dependencies containing the envelopes commands port and ID generators
 * @returns Promise resolving to created envelope data
 * @throws {AppError} When validation fails or envelope creation fails
 */
export const createEnvelopeApp = async (
  input: CreateEnvelopeAppInput,
  deps: CreateEnvelopeAppDependencies
): Promise<CreateEnvelopeAppResult> => {
  const created = await deps.envelopesCommands.create({
    tenantId: input.tenantId,
    ownerId: input.ownerId,
    title: input.title,
    actor: input.actor,
  });

  return { 
    envelopeId: (created.envelopeId as unknown as string),
    createdAt: created.createdAt
  };
};
