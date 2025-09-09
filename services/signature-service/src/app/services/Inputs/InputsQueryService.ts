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
 * @summary Query service for Input operations
 * @description Simple wrapper around InputsQueriesPort
 */
export class InputsQueryService {
  constructor(private readonly queriesPort: InputsQueriesPort) {}

  /**
   * @summary Gets an input by ID
   * @param query - Query data for getting input
   * @returns Promise resolving to input or null
   */
  async getById(query: GetInputQuery): Promise<ListInputsResult["items"][number] | null> {
    return this.queriesPort.getById(query);
  }

  /**
   * @summary Lists inputs by envelope with optional filters
   * @param query - Query data for listing inputs
   * @returns Promise resolving to paginated list of inputs
   */
  async listByEnvelope(query: ListInputsQuery): Promise<ListInputsResult> {
    return this.queriesPort.listByEnvelope(query);
  }
};
