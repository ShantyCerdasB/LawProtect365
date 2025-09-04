/**
 * @file PartiesCommandsPort.ts
 * @summary Commands port for envelope-scoped parties
 * @description Commands port for managing Party operations within envelopes (create, update, delete).
 * Defines the contract for Party command operations.
 */

import type { TenantId } from "../../../domain/value-objects/Ids";
import type { ActorContext } from "../../../domain/entities/ActorContext";
import type { PartyRow } from "../../../shared/types/parties";
import type { 
  CreatePartyControllerInput,
  UpdatePartyControllerInput,
  DeletePartyControllerInput
} from "../../../shared/types/parties";

// Define command types that extend controller inputs with actor context
export interface CreatePartyCommand extends CreatePartyControllerInput {
  tenantId: TenantId;
  actor: ActorContext;
}

export interface UpdatePartyCommand extends UpdatePartyControllerInput {
  tenantId: TenantId;
  actor: ActorContext;
}

export interface DeletePartyCommand extends DeletePartyControllerInput {
  tenantId: TenantId;
  actor: ActorContext;
}

// Define result types that are not in shared yet
export interface CreatePartyResult {
  party: PartyRow;
}

export interface UpdatePartyResult {
  party: PartyRow;
}

export interface DeletePartyResult {
  deleted: boolean;
}

/**
 * @description Commands port for Party operations.
 */
export interface PartiesCommandsPort {
  /**
   * Creates a new Party in an envelope.
   */
  create(command: CreatePartyCommand): Promise<CreatePartyResult>;

  /**
   * Updates an existing Party.
   */
  update(command: UpdatePartyCommand): Promise<UpdatePartyResult>;

  /**
   * Deletes a Party from an envelope.
   */
  delete(command: DeletePartyCommand): Promise<DeletePartyResult>;
}
