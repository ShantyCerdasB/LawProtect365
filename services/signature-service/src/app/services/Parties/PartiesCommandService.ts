/**
 * @file PartiesCommandService.ts
 * @summary Command service for Parties operations
 * @description Wrapper service for Party command operations
 */

import type { 
  PartiesCommandsPort,
  CreatePartyCommand,
  CreatePartyResult,
  UpdatePartyCommand,
  UpdatePartyResult,
  DeletePartyCommand,
  DeletePartyResult
} from "../../ports/parties";
// Party invitation rules would need proper command structure integration

/**
 * @summary Command service for Parties operations
 * @description Simple wrapper around PartiesCommandsPort
 */
export class PartiesCommandService {
  constructor(private readonly commandsPort: PartiesCommandsPort) {}

  /**
   * @summary Creates a new Party in an envelope
   * @param command - Command data for creating party
   * @returns Promise resolving to creation result
   */
  async create(command: CreatePartyCommand): Promise<CreatePartyResult> {
    // Apply generic rules - validate cross-tenant access
    // Note: The tenantId validation should be done at the controller level
    // where we have access to both the context tenantId and the resource tenantId

    return this.commandsPort.create(command);
  }

  /**
   * @summary Updates an existing Party
   * @param command - Command data for updating party
   * @returns Promise resolving to update result
   */
  async update(command: UpdatePartyCommand): Promise<UpdatePartyResult> {
    // Apply generic rules - validate cross-tenant access
    // Note: The tenantId validation should be done at the controller level
    // where we have access to both the context tenantId and the resource tenantId

    return this.commandsPort.update(command);
  }

  /**
   * @summary Deletes a Party from an envelope
   * @param command - Command data for deleting party
   * @returns Promise resolving to deletion result
   */
  async delete(command: DeletePartyCommand): Promise<DeletePartyResult> {
    // Apply generic rules - validate cross-tenant access
    // Note: The tenantId validation should be done at the controller level
    // where we have access to both the context tenantId and the resource tenantId

    return this.commandsPort.delete(command);
  }
};
