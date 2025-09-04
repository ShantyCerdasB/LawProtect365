/**
 * @file GlobalPartiesCommandService.ts
 * @summary Command service for Global Parties operations
 * @description Wrapper service for Global Party command operations
 */

import type { GlobalPartiesCommandsPort } from "../../ports/global-parties";
import type { 
  CreateGlobalPartyCommand,
  CreateGlobalPartyResult,
  UpdateGlobalPartyCommand,
  UpdateGlobalPartyResult,
  DeleteGlobalPartyCommand,
  DeleteGlobalPartyResult
} from "../../ports/global-parties";
import type { GlobalPartiesCommandService } from "../../../shared/types/global-parties/ServiceInterfaces";

/**
 * @description Default implementation of GlobalPartiesCommandService
 */
export class DefaultGlobalPartiesCommandService implements GlobalPartiesCommandService {
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
}
