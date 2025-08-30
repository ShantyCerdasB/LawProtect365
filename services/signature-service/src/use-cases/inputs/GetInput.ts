/**
 * @file GetInput.ts
 * @description Use case to get a single input by ID.
 * Handles input retrieval with validation and proper error handling.
 */

/**
 * @file GetInput.ts
 * @summary Use case to get a single input by ID.
 *
 * @description
 * Responsibilities:
 * - Validate input parameters (envelope ID, input ID).
 * - Retrieve the input entity via the repository port.
 * - Handle not found scenarios gracefully.
 * - Keep orchestration-only; no transport or provider concerns.
 */

import type { Repository } from "@lawprotect/shared-ts";
import type { Input } from "@/domain/entities/Input";
import type { EnvelopeId } from "@/domain/value-objects/Ids";
import type { InputId } from "@/adapters/dynamodb/InputRepositoryDdb";
import { inputNotFound } from "@/shared/errors";

/**
 * @description Input contract for GetInput use case.
 * Defines the required parameters for retrieving an input.
 */
export interface GetInputInput {
  /** Envelope identifier */
  envelopeId: EnvelopeId;
  /** Input identifier */
  inputId: string;
}

/**
 * @description Output contract for GetInput use case.
 * Contains the retrieved input entity.
 */
export interface GetInputOutput {
  /** Retrieved input entity or null if not found */
  input: Input | null;
}

/**
 * @description Execution context for GetInput use case.
 * Provides repository access.
 */
export interface GetInputContext {
  /** Repository dependencies */
  repos: {
    /** Input repository */
    inputs: Repository<Input, InputId>;
  };
}

/**
 * @description Retrieves a single input by its ID.
 * Validates input parameters and retrieves the input entity.
 *
 * @param {GetInputInput} input - Input parameters for input retrieval
 * @param {GetInputContext} ctx - Execution context with repositories
 * @returns {Promise<GetInputOutput>} Promise resolving to retrieved input or null
 * @throws {AppError} 404 when input is not found
 */
export const getInput = async (
  input: GetInputInput,
  ctx: GetInputContext
): Promise<GetInputOutput> => {
  // 1. Validate input parameters
  if (!input.envelopeId || !input.inputId) {
    throw inputNotFound();
  }

  // 2. Retrieve input from repository
  const inputEntity = await ctx.repos.inputs.getById({
    envelopeId: input.envelopeId,
    inputId: input.inputId,
  });

  // 3. Return result
  return { input: inputEntity };
};

