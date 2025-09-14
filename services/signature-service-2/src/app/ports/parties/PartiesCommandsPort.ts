/**
 * @file PartiesCommandsPort.ts
 * @summary Commands port for envelope-scoped parties
 * @description Commands port for managing Party operations within envelopes (create, update, delete).
 * Defines the contract for Party command operations.
 */

import type { ActorContext } from "@lawprotect/shared-ts";
import type { 
  PartyRow,
  CreatePartyControllerInput,
  UpdatePartyControllerInput,
  DeletePartyControllerInput
} from "../../../domain/types/parties";

// Define command types that extend controller inputs with actor context
export interface CreatePartyCommand extends CreatePartyControllerInput { actor: ActorContext;
}

export interface UpdatePartyCommand extends UpdatePartyControllerInput { actor: ActorContext;
}

export interface DeletePartyCommand extends DeletePartyControllerInput { actor: ActorContext;
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
 * @summary Commands port for Party operations
 * @description Defines the contract for Party command operations including create, update, and delete
 */
export interface PartiesCommandsPort {
  /**
   * @summary Creates a new Party in an envelope
   * @description Creates a new Party in an envelope with validation and persistence
   * @param command - The Party creation command
   * @returns Promise resolving to the created Party
   */
  create(command: CreatePartyCommand): Promise<CreatePartyResult>;

  /**
   * @summary Updates an existing Party
   * @description Updates an existing Party with the specified changes
   * @param command - The Party update command
   * @returns Promise resolving to the updated Party
   */
  update(command: UpdatePartyCommand): Promise<UpdatePartyResult>;

  /**
   * @summary Deletes a Party from an envelope
   * @description Deletes a Party from an envelope
   * @param command - The Party deletion command
   * @returns Promise resolving to deletion confirmation
   */
  delete(command: DeletePartyCommand): Promise<DeletePartyResult>;
};
