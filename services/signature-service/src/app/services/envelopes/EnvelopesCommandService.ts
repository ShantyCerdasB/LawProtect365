/**
 * @file EnvelopesCommandService.ts
 * @summary Command service for envelope operations
 * @description Simple wrapper service for envelope command operations
 */

import type { 
  EnvelopesCommandsPort,
  CreateEnvelopeCommand, 
  CreateEnvelopeResult, 
  UpdateEnvelopeCommand, 
  UpdateEnvelopeResult, 
  DeleteEnvelopeCommand, 
  DeleteEnvelopeResult 
} from "../../ports/envelopes/EnvelopesCommandsPort";
// Envelope lifecycle rules would need proper command structure integration

/**
 * @summary Command service for envelope operations
 * @description Simple wrapper service that delegates to the commands port
 */
export class EnvelopesCommandService {
  constructor(private readonly commandsPort: EnvelopesCommandsPort) {}


  /**
   * @summary Creates a new envelope
   * @param command - Command data for creating an envelope
   * @returns Promise resolving to the created envelope
   */
  async create(command: CreateEnvelopeCommand): Promise<CreateEnvelopeResult> {
    // Apply generic rules - validate cross-tenant access
    // Note: The tenantId validation should be done at the controller level
    // where we have access to both the context tenantId and the resource tenantId
    
    return this.commandsPort.create(command);
  }

  /**
   * @summary Updates an existing envelope
   * @param command - Command data for updating an envelope
   * @returns Promise resolving to the updated envelope
   */
  async update(command: UpdateEnvelopeCommand): Promise<UpdateEnvelopeResult> {
    // Apply generic rules - validate cross-tenant access
    // Note: The tenantId validation should be done at the controller level
    // where we have access to both the context tenantId and the resource tenantId
    
    return this.commandsPort.update(command);
  }

  /**
   * @summary Deletes an envelope
   * @param command - Command data for deleting an envelope
   * @returns Promise resolving to deletion confirmation
   */
  async delete(command: DeleteEnvelopeCommand): Promise<DeleteEnvelopeResult> {
    // Apply generic rules - validate cross-tenant access
    // Note: The tenantId validation should be done at the controller level
    // where we have access to both the context tenantId and the resource tenantId

    return this.commandsPort.delete(command);
  }
};
