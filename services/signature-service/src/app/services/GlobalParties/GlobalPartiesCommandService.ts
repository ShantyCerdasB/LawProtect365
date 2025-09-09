/**
 * @file GlobalPartiesCommandService.ts
 * @summary Command service for Global Parties operations
 * @description Wrapper service for Global Party command operations
 */

import type { 
  GlobalPartiesCommandsPort,
  CreateGlobalPartyCommand,
  CreateGlobalPartyResult,
  UpdateGlobalPartyCommand,
  UpdateGlobalPartyResult,
  DeleteGlobalPartyCommand,
  DeleteGlobalPartyResult
} from "../../ports/global-parties";
import type { GlobalPartiesCommandService as IGlobalPartiesCommandService } from "../../../domain/types/global-parties/ServiceInterfaces";

/**
 * @summary Command service for Global Parties operations
 * @description Default implementation of GlobalPartiesCommandService
 */
export class GlobalPartiesCommandService implements IGlobalPartiesCommandService {
  constructor(private readonly commandsPort: GlobalPartiesCommandsPort) {}

  async create(command: CreateGlobalPartyCommand): Promise<CreateGlobalPartyResult> {
    return this.commandsPort.create(command);
  }

  async update(command: UpdateGlobalPartyCommand): Promise<UpdateGlobalPartyResult> {
    return this.commandsPort.update(command);
  }

  async delete(command: DeleteGlobalPartyCommand): Promise<DeleteGlobalPartyResult> {
    return this.commandsPort.delete(command);
  }
};
