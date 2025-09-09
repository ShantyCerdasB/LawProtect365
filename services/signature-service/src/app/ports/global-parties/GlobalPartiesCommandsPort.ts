/**
 * @file GlobalPartiesCommandsPort.ts
 * @summary Commands port for Global Parties (contacts)
 * @description Commands port for managing Global Party operations (create, update, delete).
 * Defines the contract for Global Party command operations.
 */

import type { TenantId } from "../../../domain/value-objects/ids";
import type { ActorContext } from "@lawprotect/shared-ts";
import type { 
  GlobalPartyExtended,
  CreateGlobalPartyControllerInput,
  UpdateGlobalPartyControllerInput,
  DeleteGlobalPartyControllerInput
} from "../../../domain/types/global-parties";

// Define command types that extend controller inputs with actor context
export interface CreateGlobalPartyCommand extends CreateGlobalPartyControllerInput {
  tenantId: TenantId;
  actor: ActorContext;
}

export interface UpdateGlobalPartyCommand extends UpdateGlobalPartyControllerInput {
  tenantId: TenantId;
  actor: ActorContext;
}

export interface DeleteGlobalPartyCommand extends DeleteGlobalPartyControllerInput {
  tenantId: TenantId;
  actor: ActorContext;
}

// Define result types that are not in shared yet
export interface CreateGlobalPartyResult {
  globalParty: GlobalPartyExtended;
}

export interface UpdateGlobalPartyResult {
  globalParty: GlobalPartyExtended;
}

export interface DeleteGlobalPartyResult {
  deleted: boolean;
}

/**
 * @summary Commands port for Global Party operations
 * @description Defines the contract for Global Party command operations including create, update, and delete
 */
export interface GlobalPartiesCommandsPort {
  /**
   * @summary Creates a new Global Party (contact)
   * @description Creates a new Global Party with validation and persistence
   * @param command - The Global Party creation command
   * @returns Promise resolving to the created Global Party
   */
  create(command: CreateGlobalPartyCommand): Promise<CreateGlobalPartyResult>;

  /**
   * @summary Updates an existing Global Party
   * @description Updates an existing Global Party with the specified changes
   * @param command - The Global Party update command
   * @returns Promise resolving to the updated Global Party
   */
  update(command: UpdateGlobalPartyCommand): Promise<UpdateGlobalPartyResult>;

  /**
   * @summary Deletes a Global Party (soft delete)
   * @description Performs a soft delete of a Global Party
   * @param command - The Global Party deletion command
   * @returns Promise resolving to deletion confirmation
   */
  delete(command: DeleteGlobalPartyCommand): Promise<DeleteGlobalPartyResult>;
};
