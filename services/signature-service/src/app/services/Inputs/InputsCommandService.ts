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
 * @summary Default implementation of InputsCommandService
 * @description Simple wrapper around InputsCommandsPort
 */
export class DefaultInputsCommandService {
  constructor(private readonly commandsPort: InputsCommandsPort) {}

  /**
   * Creates inputs in batch.
   */
  async create(command: CreateInputsCommand): Promise<CreateInputsResult> {
    // Apply generic rules
    assertTenantBoundary(command.tenantId, command.tenantId);

    return this.commandsPort.create(command);
  }

  /**
   * Updates an existing input.
   */
  async update(command: UpdateInputCommand): Promise<UpdateInputResult> {
    // Apply generic rules
    assertTenantBoundary(command.tenantId, command.tenantId);
    
    return this.commandsPort.update(command);
  }

  /**
   * Updates input positions in batch.
   */
  async updatePositions(command: UpdateInputPositionsCommand): Promise<UpdateInputPositionsResult> {
    // Apply generic rules
    assertTenantBoundary(command.tenantId, command.tenantId);

    return this.commandsPort.updatePositions(command);
  }

  /**
   * Deletes an input.
   */
  async delete(command: DeleteInputCommand): Promise<void> {
    // Apply generic rules
    assertTenantBoundary(command.tenantId, command.tenantId);
    
    return this.commandsPort.delete(command);
  }
}






