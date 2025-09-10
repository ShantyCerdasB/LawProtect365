/**
 * @file ConsentRepository.ts
 * @summary Consent repository contract
 * @description Repository interface for consent persistence operations
 */

import type { 
  ConsentRepoRow, 
  ConsentRepoKey, 
  ConsentRepoCreateInput, 
  ConsentRepoUpdateInput, 
  ConsentRepoListInput, 
  ConsentRepoListOutput 
} from "../../../../domain/types/consent";

/**
 * @summary Consent repository contract
 * @description Defines the interface for consent persistence operations
 */
export interface ConsentRepository {
  /**
   * @summary Create a new consent record
   * @description Creates a new consent record with validation
   */
  create(input: ConsentRepoCreateInput): Promise<ConsentRepoRow>;

  /**
   * @summary Get consent by ID
   * @description Retrieves a specific consent by its unique identifier
   */
  getById(keys: ConsentRepoKey): Promise<ConsentRepoRow | null>;

  /**
   * @summary Update a consent record
   * @description Updates an existing consent record with the specified changes
   */
  update(keys: ConsentRepoKey, changes: ConsentRepoUpdateInput): Promise<ConsentRepoRow>;

  /**
   * @summary Delete a consent record
   * @description Deletes a consent record from the repository
   */
  delete(keys: ConsentRepoKey): Promise<void>;

  /**
   * @summary List consents by envelope
   * @description Retrieves consents for a specific envelope with pagination and filtering
   */
  listByEnvelope(input: ConsentRepoListInput): Promise<ConsentRepoListOutput>;
}

