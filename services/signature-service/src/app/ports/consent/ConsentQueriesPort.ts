/**
 * @file ConsentQueriesPort.ts
 * @summary Port interface for consent query operations
 * @description Defines the interface for read-only consent operations including listing and filtering
 */

import type { 
  GetConsentAppInput, 
  GetConsentAppResult,
  ListConsentsAppInput,
  ListConsentsAppResult 
} from "../../../shared/types/consent/AppServiceInputs";

/**
 * @summary Port interface for consent query operations
 * @description Defines the contract for read-only consent operations
 */
export interface ConsentQueriesPort {
  /**
   * @summary Gets a consent by its ID
   * @description Retrieves a specific consent by its unique identifier
   * @param input - The input parameters containing tenant, envelope, and consent IDs
   * @returns Promise resolving to the consent data or null if not found
   */
  getById(input: GetConsentAppInput): Promise<GetConsentAppResult | null>;

  /**
   * @summary Lists consents by envelope with optional filtering and pagination
   * @description Retrieves consents for a specific envelope with pagination and filtering
   * @param input - The input parameters containing filtering and pagination options
   * @returns Promise resolving to paginated consent list
   */
  listByEnvelope(input: ListConsentsAppInput): Promise<ListConsentsAppResult>;
}
