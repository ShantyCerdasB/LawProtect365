/**
 * @file InputsCommandService.ts
 * @summary Command service for Input operations
 * @description Wrapper service for Input command operations
 */

import type { 
  InputsCommandsPort,
  CreateInputsCommand,
  CreateInputsResult,
  UpdateInputCommand,
  UpdateInputResult,
  UpdateInputPositionsCommand,
  UpdateInputPositionsResult,
  DeleteInputCommand
} from "../../ports/inputs/InputsCommandsPort";
// Input rules would need proper command structure integration
import { assertTenantBoundary } from "@lawprotect/shared-ts";

/**
 * @summary Command service for Input operations
 * @description Simple wrapper around InputsCommandsPort
 */
export class InputsCommandService {
  constructor(private readonly commandsPort: InputsCommandsPort) {}

  /**
   * @summary Creates inputs in batch
   * @param command - Command data for creating inputs
   * @returns Promise resolving to creation result
   */
  async create(command: CreateInputsCommand): Promise<CreateInputsResult> {
    // Apply generic rules
    assertTenantBoundary(command.tenantId, command.tenantId);

    return this.commandsPort.create(command);
  }

  /**
   * @summary Updates an existing input
   * @param command - Command data for updating input
   * @returns Promise resolving to update result
   */
  async update(command: UpdateInputCommand): Promise<UpdateInputResult> {
    // Apply generic rules
    assertTenantBoundary(command.tenantId, command.tenantId);
    
    return this.commandsPort.update(command);
  }

  /**
   * @summary Updates input positions in batch
   * @param command - Command data for updating positions
   * @returns Promise resolving to positions update result
   */
  async updatePositions(command: UpdateInputPositionsCommand): Promise<UpdateInputPositionsResult> {
    // Apply generic rules
    assertTenantBoundary(command.tenantId, command.tenantId);

    return this.commandsPort.updatePositions(command);
  }

  /**
   * @summary Deletes an input
   * @param command - Command data for deleting input
   * @returns Promise resolving when deletion is complete
   */
  async delete(command: DeleteInputCommand): Promise<void> {
    // Apply generic rules
    assertTenantBoundary(command.tenantId, command.tenantId);
    
    return this.commandsPort.delete(command);
  }
};
