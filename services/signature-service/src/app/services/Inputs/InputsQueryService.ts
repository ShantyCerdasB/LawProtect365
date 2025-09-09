/**
 * @file InputsQueryService.ts
 * @summary Query service for Input operations
 * @description Wrapper service for Input query operations
 */

import type { 
  InputsQueriesPort,
  GetInputQuery,
  ListInputsQuery,
  ListInputsResult
} from "../../ports/inputs/InputsQueriesPort";

/**
 * @summary Default implementation of InputsQueryService
 * @description Simple wrapper around InputsQueriesPort
 */
export class DefaultInputsQueryService {
  constructor(private readonly queriesPort: InputsQueriesPort) {}

  /**
   * Gets an input by ID.
   */
  async getById(query: GetInputQuery): Promise<ListInputsResult["items"][number] | null> {
    return this.queriesPort.getById(query);
  }

  /**
   * Lists inputs by envelope with optional filters.
   */
  async listByEnvelope(query: ListInputsQuery): Promise<ListInputsResult> {
    return this.queriesPort.listByEnvelope(query);
  }
}






