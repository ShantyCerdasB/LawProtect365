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
import type { EnvelopesRepository } from "../../../domain/contracts/repositories/envelopes/EnvelopesRepository";
import { ForbiddenError } from "../../../shared/errors";
import { ErrorCodes } from "../../../shared/errors";

/**
 * @summary Command service for Parties operations
 * @description Simple wrapper around PartiesCommandsPort with authorization validation
 */
export class PartiesCommandService {
  constructor(
    private readonly commandsPort: PartiesCommandsPort,
    private readonly envelopesRepo?: EnvelopesRepository
  ) {}

  /**
   * @summary Creates a new Party in an envelope
   * @param command - Command data for creating party
   * @returns Promise resolving to creation result
   */
  async create(command: CreatePartyCommand): Promise<CreatePartyResult> {
    // Authorization validation: only envelope owner can create parties
    const actorEmail = (command as any).actorEmail || command.actor?.email;
    if (actorEmail && this.envelopesRepo) {
      const envelope = await this.envelopesRepo.getById(command.envelopeId);
      if (envelope && envelope.ownerEmail !== actorEmail) {
        throw new ForbiddenError(
          "Unauthorized: Only envelope owner can create parties", 
          ErrorCodes.AUTH_FORBIDDEN, 
          { 
            actorEmail, 
            envelopeOwnerEmail: envelope.ownerEmail, 
            envelopeId: command.envelopeId 
          }
        );
      }
    }
    
    return this.commandsPort.create(command);
  }

  /**
   * @summary Updates an existing Party
   * @param command - Command data for updating party
   * @returns Promise resolving to update result
   */
  async update(command: UpdatePartyCommand): Promise<UpdatePartyResult> {
    return this.commandsPort.update(command);
  }

  /**
   * @summary Deletes a Party from an envelope
   * @param command - Command data for deleting party
   * @returns Promise resolving to deletion result
   */
  async delete(command: DeletePartyCommand): Promise<DeletePartyResult> {
    return this.commandsPort.delete(command);
  }
};
