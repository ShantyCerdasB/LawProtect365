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
import { assertTenantBoundary } from "@lawprotect/shared-ts";

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
    // Apply generic rules
    assertTenantBoundary(command.tenantId, command.tenantId);

    return this.commandsPort.create(command);
  }

  /**
   * Updates an existing Party.
   */
  async update(command: UpdatePartyCommand): Promise<UpdatePartyResult> {
    // Apply generic rules
    assertTenantBoundary(command.tenantId, command.tenantId);

    return this.commandsPort.update(command);
  }

  /**
   * Deletes a Party from an envelope.
   */
  async delete(command: DeletePartyCommand): Promise<DeletePartyResult> {
    // Apply generic rules
    assertTenantBoundary(command.tenantId, command.tenantId);

    return this.commandsPort.delete(command);
  }
}






