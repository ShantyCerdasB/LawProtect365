/**
 * @file ListInputsApp.service.ts
 * @summary Application service for listing inputs
 * @description Orchestrates input listing operations, delegates to InputsQueriesPort,
 * and handles validation logic. Uses branded types for type safety.
 */

import type { TenantId, EnvelopeId } from "@/app/ports/shared";
import type { InputsQueriesPort } from "@/app/ports/inputs/InputsQueriesPort";
import { InputType } from "@/domain/values/enums";

/**
 * Input parameters for listing inputs
 */
export interface ListInputsAppInput {
  tenantId: TenantId;
  envelopeId: EnvelopeId;
  limit?: number;
  cursor?: string;
}

/**
 * Output result for inputs listing
 */
export interface ListInputsAppResult {
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
    value?: string;
    createdAt: string;
    updatedAt: string;
  }>;
  nextCursor?: string;
}

/**
 * Dependencies required by the ListInputs app service
 */
export interface ListInputsAppDependencies {
  inputsQueries: InputsQueriesPort;
}

/**
 * Lists inputs with pagination support
 * @param input - The input parameters containing listing criteria
 * @param deps - The dependencies containing the inputs queries port
 * @returns Promise resolving to inputs list data
 * @throws {AppError} When validation fails or input listing fails
 */
export const listInputsApp = async (
  input: ListInputsAppInput,
  deps: ListInputsAppDependencies
): Promise<ListInputsAppResult> => {
  const result = await deps.inputsQueries.listByEnvelope({
    tenantId: input.tenantId,
    envelopeId: input.envelopeId,
    limit: input.limit,
    cursor: input.cursor,
  });

  return result;
};
