/**
 * @file makeInputsQueriesPort.ts
 * @summary App adapter for InputsQueriesPort
 * @description Implements InputsQueriesPort by delegating to input use cases.
 * Provides query operations for inputs (read-only operations).
 */

import type { InputsQueriesPort } from "@/app/ports/inputs/InputsQueriesPort";
import type { InputRepositoryDdb } from "@/adapters/dynamodb/InputRepositoryDdb";
import { listInputs } from "@/use-cases/inputs/ListInputs";
import { getInput } from "@/use-cases/inputs/GetInput";

/**
 * Creates an InputsQueriesPort implementation
 * @param inputsRepo - The input repository for data persistence
 * @returns InputsQueriesPort implementation
 */
export const makeInputsQueriesPort = (
  inputsRepo: InputRepositoryDdb
): InputsQueriesPort => ({
  async getById(query) {
    const result = await getInput(
      {
        envelopeId: query.envelopeId,
        inputId: query.inputId,
      },
      {
        repos: { inputs: inputsRepo },
      }
    );
    
    if (!result.input) {
      throw new Error("Input not found");
    }
    
    return {
      inputId: result.input.inputId,
      type: result.input.type,
      page: result.input.position.page,
      geometry: {
        x: result.input.position.x,
        y: result.input.position.y,
        w: 0, // Default width since InputPosition doesn't have width
        h: 0, // Default height since InputPosition doesn't have height
      },
      assignedPartyId: result.input.partyId,
      required: result.input.required,
      value: result.input.value,
      createdAt: result.input.createdAt,
      updatedAt: result.input.updatedAt,
    };
  },

  async listByEnvelope(query) {
    const result = await listInputs(
      {
        envelopeId: query.envelopeId,
        limit: query.limit,
        cursor: query.cursor,
      },
      {
        repos: { inputs: inputsRepo },
      }
    );
    return {
      items: result.items.map((input) => ({
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
        value: input.value,
        createdAt: input.createdAt,
        updatedAt: input.updatedAt,
      })),
      nextCursor: result.nextCursor,
    };
  },
});
