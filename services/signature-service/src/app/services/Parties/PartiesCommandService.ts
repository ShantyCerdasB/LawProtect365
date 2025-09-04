/**
 * @file PartiesCommandService.ts
 * @summary Command service for Parties operations
 * @description Wrapper service for Party command operations
 */

import type { PartiesCommandsPort } from "../../ports/parties";
import type { 
  CreatePartyCommand,
  CreatePartyResult,
  UpdatePartyCommand,
  UpdatePartyResult,
  DeletePartyCommand,
  DeletePartyResult
} from "../../ports/parties";

/**
 * @summary Default implementation of PartiesCommandService
 * @description Simple wrapper around PartiesCommandsPort
 */
export class DefaultPartiesCommandService {
  constructor(private readonly commandsPort: PartiesCommandsPort) {}

  /**
   * Creates a new Party in an envelope.
   */
  async create(command: CreatePartyCommand): Promise<CreatePartyResult> {
    return this.commandsPort.create(command);
  }

  /**
   * Updates an existing Party.
   */
  async update(command: UpdatePartyCommand): Promise<UpdatePartyResult> {
    return this.commandsPort.update(command);
  }

  /**
   * Deletes a Party from an envelope.
   */
  async delete(command: DeletePartyCommand): Promise<DeletePartyResult> {
    return this.commandsPort.delete(command);
  }
}
