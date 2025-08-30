/**
 * @file GetInputApp.service.ts
 * @summary Application service for getting a single input
 * @description Orchestrates input retrieval operations, delegates to InputsQueriesPort,
 * and handles validation logic. Uses branded types for type safety.
 */

import type { TenantId, EnvelopeId } from "@/app/ports/shared";
import type { InputsQueriesPort } from "@/app/ports/inputs/InputsQueriesPort";
import { InputType } from "@/domain/values/enums";

/**
 * Input parameters for getting a single input
 */
export interface GetInputAppInput {
  tenantId: TenantId;
  envelopeId: EnvelopeId;
  inputId: string;
}

/**
 * Output result for getting a single input
 */
export interface GetInputAppResult {
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
  value?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Dependencies required by the GetInput app service
 */
export interface GetInputAppDependencies {
  inputsQueries: InputsQueriesPort;
}

/**
 * Gets a single input by ID
 * @param input - The input parameters containing input ID
 * @param deps - The dependencies containing the inputs queries port
 * @returns Promise resolving to input data
 * @throws {AppError} When validation fails or input retrieval fails
 */
export const getInputApp = async (
  input: GetInputAppInput,
  deps: GetInputAppDependencies
): Promise<GetInputAppResult> => {
  const result = await deps.inputsQueries.getById({
    tenantId: input.tenantId,
    envelopeId: input.envelopeId,
    inputId: input.inputId,
  });

  return result;
};
