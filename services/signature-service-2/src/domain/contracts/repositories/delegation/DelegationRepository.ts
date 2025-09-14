/**
 * @file DelegationRepository.ts
 * @summary Repository contract for delegation operations
 * @description Defines the interface for delegation repository operations
 */

import type { DelegationRepoCreateInput, DelegationRepoRow } from "../../../../domain/types/delegation/DelegationTypes";

/**
 * @summary Repository interface for delegation operations
 * @description Defines the contract for delegation repository operations
 */
export interface DelegationRepository {
  /**
   * @summary Creates a new delegation record
   * @description Creates a new delegation record with validation
   * @param input - The delegation creation parameters
   * @returns Promise resolving to the created delegation record
   */
  create(input: DelegationRepoCreateInput): Promise<DelegationRepoRow>;
}

