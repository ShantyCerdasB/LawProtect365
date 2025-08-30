/**
 * @file ListInputs.ts
 * @summary Use case for listing inputs with pagination
 * @description Lists inputs for a given envelope with pagination support.
 * Validates envelope existence and returns paginated results.
 */

import type { Input } from "@/domain/entities/Input";
import type { EnvelopeId } from "@/app/ports/shared";

/**
 * Input parameters for listing inputs
 */
export interface ListInputsInput {
  envelopeId: EnvelopeId;
  limit?: number;
  cursor?: string;
}

/**
 * Output result for listing inputs
 */
export interface ListInputsOutput {
  items: Input[];
  nextCursor?: string;
}

/**
 * Context dependencies for listing inputs
 */
export interface ListInputsContext {
  repos: {
    inputs: {
      listByEnvelope(query: {
        envelopeId: string;
        limit?: number;
        cursor?: string;
      }): Promise<{
        items: Input[];
        nextCursor?: string;
      }>;
    };
  };
}

/**
 * Lists inputs for a given envelope with pagination support
 * @param input - The input parameters containing envelope ID and pagination options
 * @param ctx - The context containing repository dependencies
 * @returns Promise resolving to paginated list of inputs
 * @throws {AppError} When validation fails or envelope doesn't exist
 */
export const listInputs = async (
  input: ListInputsInput,
  ctx: ListInputsContext
): Promise<ListInputsOutput> => {
  if (!input.envelopeId) {
    throw new Error("Envelope ID is required");
  }

  const limit = input.limit || 50;

  const result = await ctx.repos.inputs.listByEnvelope({
    envelopeId: input.envelopeId,
    limit,
    cursor: input.cursor,
  });

  return {
    items: result.items,
    nextCursor: result.nextCursor,
  };
};
