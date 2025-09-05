/**
 * @file GlobalPartiesCommandsPort.ts
 * @summary Commands port for Global Parties (contacts)
 * @description Commands port for managing Global Party operations (create, update, delete).
 * Defines the contract for Global Party command operations.
 */

import type { TenantId } from "../../../domain/value-objects/Ids";
import type { ActorContext } from "../../../domain/entities/ActorContext";
import type { 
  GlobalPartyRow,
  CreateGlobalPartyControllerInput,
  UpdateGlobalPartyControllerInput,
  DeleteGlobalPartyControllerInput
} from "../../../shared/types/global-parties";

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
  globalParty: GlobalPartyRow;
}

export interface UpdateGlobalPartyResult {
  globalParty: GlobalPartyRow;
}

export interface DeleteGlobalPartyResult {
  deleted: boolean;
}

/**
 * @description Commands port for Global Party operations.
 */
export interface GlobalPartiesCommandsPort {
  /**
   * Creates a new Global Party (contact).
   */
  create(command: CreateGlobalPartyCommand): Promise<CreateGlobalPartyResult>;

  /**
   * Updates an existing Global Party.
   */
  update(command: UpdateGlobalPartyCommand): Promise<UpdateGlobalPartyResult>;

  /**
   * Deletes a Global Party (soft delete).
   */
  delete(command: DeleteGlobalPartyCommand): Promise<DeleteGlobalPartyResult>;
}



