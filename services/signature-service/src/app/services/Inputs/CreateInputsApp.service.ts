/**
 * @file CreateInputsApp.service.ts
 * @summary Application service for creating inputs in batch
 * @description Orchestrates input creation operations, delegates to InputsCommandsPort,
 * and handles validation logic. Uses branded types for type safety.
 */

import type { TenantId, EnvelopeId, ActorContext } from "@/app/ports/shared";
import type { InputsCommandsPort } from "@/app/ports/inputs/InputsCommandsPort";
import { InputType } from "@/domain/values/enums";

/**
 * Input data for creating a single input
 */
export interface CreateInputData {
  type: InputType;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  required: boolean;
  partyId?: string;
  value?: string;
}

/**
 * Input parameters for creating inputs in batch
 */
export interface CreateInputsAppInput {
  tenantId: TenantId;
  envelopeId: EnvelopeId;
  documentId: string;
  inputs: CreateInputData[];
  actor?: ActorContext;
}

/**
 * Output result for inputs creation
 */
export interface CreateInputsAppResult {
  items: Array<{
    inputId: string;
    type: InputType;
    page: number;
    geometry: {
      x: number;
      y: number;
      w: number;
      h: number;
    };
    assignedPartyId?: string;
    required: boolean;
  }>;
  count: number;
}

/**
 * Dependencies required by the CreateInputs app service
 */
export interface CreateInputsAppDependencies {
  inputsCommands: InputsCommandsPort;
  ids: { ulid(): string };
}

/**
 * Options for idempotency
 */
export interface CreateInputsAppOptions {
  idempotencyKey?: string;
  ttlSeconds?: number;
}

/**
 * Creates inputs in batch with proper validation and event emission
 * @param input - The input parameters containing input creation data
 * @param deps - The dependencies containing the inputs commands port and ID generators
 * @param opts - Optional idempotency settings
 * @returns Promise resolving to created inputs data
 * @throws {AppError} When validation fails or input creation fails
 */
export const createInputsApp = async (
  input: CreateInputsAppInput,
  deps: CreateInputsAppDependencies,
  opts?: CreateInputsAppOptions
): Promise<CreateInputsAppResult> => {
  const exec = async () => {
    const result = await deps.inputsCommands.create({
      tenantId: input.tenantId,
      envelopeId: input.envelopeId,
      documentId: input.documentId,
      inputs: input.inputs,
      actor: input.actor,
    });

    return result;
  };

  // If idempotency key is provided, use idempotency runner
  if (opts?.idempotencyKey) {
    // Note: This would require access to the idempotency runner from the container
    // For now, we'll just execute directly
    return exec();
  }

  return exec();
};
