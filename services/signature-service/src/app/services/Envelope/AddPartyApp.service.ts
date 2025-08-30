/**
 * @file AddPartyApp.service.ts
 * @summary Application service for adding parties to envelopes
 * @description Orchestrates party addition operations, delegates to PartiesCommandsPort,
 * and handles validation logic. Uses branded types for type safety.
 */

import type { TenantId, EnvelopeId, ActorContext } from "@/app/ports/shared";
import type { PartiesCommandsPort } from "@/app/ports/parties/PartiesCommandsPort";
import type { Repository } from "@lawprotect/shared-ts";
import type { Envelope } from "@/domain/entities/Envelope";
import type { PartyRole } from "@/domain/values/enums";
import { envelopeNotFound } from "@/errors";


/**
 * Notification preferences for party
 */
export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
}

/**
 * Input parameters for adding a party to an envelope
 */
export interface AddPartyAppInput {
  tenantId: TenantId;
  envelopeId: EnvelopeId;
  email: string;
  name: string;
  role: PartyRole;
  order?: number;
  metadata?: Record<string, any>;
  notificationPreferences?: NotificationPreferences;
  actor?: ActorContext;
}

/**
 * Output result for adding a party
 */
export interface AddPartyAppResult {
  partyId: string;
}

/**
 * Dependencies required by the AddParty app service
 */
export interface AddPartyAppDependencies {
  envelopes: Repository<Envelope, EnvelopeId>;
  partiesCommands: PartiesCommandsPort;
  ids: { ulid(): string };
}

/**
 * Adds a party to an envelope with proper validation
 * @param input - The input parameters containing party data
 * @param deps - The dependencies containing repositories and commands
 * @returns Promise resolving to created party data
 * @throws {AppError} When validation fails or party creation fails
 */
export const addPartyApp = async (
  input: AddPartyAppInput,
  deps: AddPartyAppDependencies
): Promise<AddPartyAppResult> => {
  // Validate that envelope exists and belongs to tenant
  const envelope = await deps.envelopes.getById(input.envelopeId);
  if (!envelope || envelope.tenantId !== input.tenantId) {
    throw envelopeNotFound();
  }

  // Create party using the commands port
  const result = await deps.partiesCommands.create({
    tenantId: input.tenantId,
    envelopeId: input.envelopeId,
    email: input.email,
    name: input.name,
    role: input.role,
    order: input.order,
    metadata: input.metadata,
    notificationPreferences: input.notificationPreferences,
  });

  return { partyId: result.partyId };
};
