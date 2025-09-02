/**
 * @file ConsentCommandsPort.ts
 * @summary Port interface for consent command operations
 * @description Defines the interface for write-oriented consent operations including create, update, delete, submit, and delegate
 */

import type { 
  CreateConsentAppInput, 
  CreateConsentAppResult,
  UpdateConsentAppInput,
  UpdateConsentAppResult,
  DeleteConsentAppInput,
  SubmitConsentAppInput,
  SubmitConsentAppResult,
  DelegateConsentAppInput,
  DelegateConsentAppResult
} from "../../../shared/types/consent/AppServiceInputs";

/**
 * @summary Port interface for consent command operations
 * @description Defines the contract for write-oriented consent operations
 */
export interface ConsentCommandsPort {
  /**
   * @summary Creates a new consent
   * @description Creates a new consent record with validation
   * @param input - The consent creation parameters
   * @returns Promise resolving to the created consent data
   */
  create(input: CreateConsentAppInput): Promise<CreateConsentAppResult>;

  /**
   * @summary Updates an existing consent
   * @description Updates an existing consent record with the specified changes
   * @param input - The consent update parameters
   * @returns Promise resolving to the updated consent data
   */
  update(input: UpdateConsentAppInput): Promise<UpdateConsentAppResult>;

  /**
   * @summary Deletes a consent
   * @description Deletes a consent record from the repository
   * @param input - The consent deletion parameters
   * @returns Promise resolving when deletion is complete
   */
  delete(input: DeleteConsentAppInput): Promise<void>;

  /**
   * @summary Submits a consent
   * @description Submits a consent for approval or processing
   * @param input - The consent submission parameters
   * @returns Promise resolving to the submitted consent data
   */
  submit(input: SubmitConsentAppInput): Promise<SubmitConsentAppResult>;

  /**
   * @summary Delegates a consent to another party
   * @description Delegates a consent to another party for processing
   * @param input - The consent delegation parameters
   * @returns Promise resolving to the delegated consent data
   */
  delegate(input: DelegateConsentAppInput): Promise<DelegateConsentAppResult>;
}
