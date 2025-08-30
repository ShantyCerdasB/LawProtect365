/**
 * @file makeInputsCommandsPort.ts
 * @summary Factory for InputsCommandsPort
 * @description Creates and configures the InputsCommandsPort implementation,
 * adapting between the app service layer and use cases. Handles dependency injection
 * and type conversions for input command operations.
 */

import type { Repository } from "@lawprotect/shared-ts";
import type { Input } from "@/domain/entities/Input";
import type { Envelope } from "@/domain/entities/Envelope";
import type { InputId } from "@/adapters/dynamodb/InputRepositoryDdb";
import type { EnvelopeId } from "@/domain/value-objects/Ids";
import type { 
  InputsCommandsPort, 
  CreateInputsCommand, 
  CreateInputsResult, 
  UpdateInputCommand, 
  UpdateInputResult,
  UpdateInputPositionsCommand,
  UpdateInputPositionsResult,
  DeleteInputCommand
} from "@/app/ports/inputs/InputsCommandsPort";
import { createInputs } from "@/use-cases/inputs/CreateInputs";
import { patchInput } from "@/use-cases/inputs/PatchInput";
import { patchInputPositions } from "@/use-cases/inputs/PatchInputPositions";
import { deleteInput } from "@/use-cases/inputs/DeleteInput";

/**
 * Creates an InputsCommandsPort implementation
 * @param inputsRepo - The input repository for data persistence
 * @param envelopesRepo - The envelope repository for validation
 * @param deps - Dependencies including ID generators
 * @returns Configured InputsCommandsPort implementation
 */
export const makeInputsCommandsPort = (
  inputsRepo: Repository<Input, InputId>,
  envelopesRepo: Repository<Envelope, EnvelopeId>,
  deps: { ids: { ulid(): string } }
): InputsCommandsPort => {
  return {
    /**
     * Creates inputs in batch
     * @param command - The input creation command
     * @returns Promise resolving to creation result
     */
    async create(command: CreateInputsCommand): Promise<CreateInputsResult> {
      const result = await createInputs(
        {
          tenantId: command.tenantId,
          envelopeId: command.envelopeId,
          documentId: command.documentId,
          inputs: command.inputs.map(input => ({
            type: input.type,
            page: input.page,
            x: input.x,
            y: input.y,
            required: input.required,
            partyId: input.partyId,
            value: input.value,
          })),
          actor: command.actor,
        },
        {
          repos: { 
            inputs: inputsRepo,
            envelopes: envelopesRepo,
          },
          ids: deps.ids,
        }
      );

      return {
        items: result.inputs.map(input => ({
          inputId: input.inputId,
          type: input.type,
          page: input.position.page,
          geometry: { 
            x: input.position.x, 
            y: input.position.y, 
            w: 0, // Default width since InputPosition doesn't have width
            h: 0, // Default height since InputPosition doesn't have height
          },
          assignedPartyId: input.partyId,
          required: input.required,
        })),
        count: result.inputs.length,
      };
    },

    /**
     * Updates an existing input
     * @param command - The input update command
     * @returns Promise resolving to update result
     */
    async update(command: UpdateInputCommand): Promise<UpdateInputResult> {
      const result = await patchInput(
        {
          envelopeId: command.envelopeId,
          inputId: command.inputId,
          updates: command.updates,
        },
        {
          repos: { 
            inputs: inputsRepo,
            envelopes: envelopesRepo,
          },
          ids: deps.ids,
        }
      );

      return {
        inputId: result.input.inputId,
        updatedAt: result.input.updatedAt,
      };
    },

    /**
     * Updates input positions in batch
     * @param command - The position update command
     * @returns Promise resolving to update result
     */
    async updatePositions(command: UpdateInputPositionsCommand): Promise<UpdateInputPositionsResult> {
      const result = await patchInputPositions(
        {
          envelopeId: command.envelopeId,
          items: command.items.map(item => ({
            inputId: item.inputId,
            page: item.page,
            x: item.x,
            y: item.y,
          })),
        },
        {
          repos: { 
            inputs: inputsRepo,
            envelopes: envelopesRepo,
          },
          ids: deps.ids,
        }
      );

      return {
        updated: result.updated,
      };
    },

    /**
     * Deletes an input
     * @param command - The input deletion command
     * @returns Promise resolving when deletion is complete
     */
    async delete(command: DeleteInputCommand): Promise<void> {
      await deleteInput(
        {
          envelopeId: command.envelopeId,
          inputId: command.inputId,
        },
        {
          repos: { 
            inputs: inputsRepo,
            envelopes: envelopesRepo,
          },
          ids: deps.ids,
        }
      );
    },
  };
};
