/**
 * @file GlobalPartiesCommandsPort.ts
 * @summary Write-oriented global party port for controllers/use-cases
 * @description Commands port for global party (address book) operations.
 * Handles create, update, delete, and delegation operations for global parties.
 * This port is used by application services to perform write operations on global parties.
 */

import type { TenantId, PartyId } from "../shared";
import type { GlobalParty } from "../../../domain/entities/GlobalParty";
import type { DelegationRecord } from "../../../domain/value-objects/party/DelegationRecord";
import type { PartyMetadata } from "../../../domain/value-objects/party/PartyMetadata";
import type { PartyRole, PartySource, DelegationType } from "../../../domain/values/enums";

/**
 * Input parameters for creating a global party
 * @interface CreateGlobalPartyInput
 * @description Data required to create a new global party in the address book
 */
export interface CreateGlobalPartyInput {
  /** The tenant ID that owns the party */
  tenantId: TenantId;
  /** The email address of the party */
  email: string;
  /** The display name of the party */
  name: string;
  /** Optional phone number of the party (USA format) */
  phone?: string;
  /** The role assigned to the party */
  role: PartyRole;
  /** The source of the party (manual, import, etc.) */
  source?: PartySource;
  /** Optional metadata associated with the party */
  metadata?: PartyMetadata;
  /** Notification preferences for the party */
  notificationPreferences?: {
    /** Whether to send email notifications */
    email: boolean;
    /** Whether to send SMS notifications */
    sms: boolean;
  };
}

/**
 * Result of creating a global party
 * @interface CreateGlobalPartyResult
 * @description Contains the created party ID and full party data
 */
export interface CreateGlobalPartyResult {
  /** The unique identifier of the created party */
  partyId: PartyId;
  /** The complete party data */
  party: GlobalParty;
}

/**
 * Input parameters for updating a global party
 * @interface UpdateGlobalPartyInput
 * @description Data required to update an existing global party
 */
export interface UpdateGlobalPartyInput {
  /** The tenant ID that owns the party */
  tenantId: TenantId;
  /** The unique identifier of the party to update */
  partyId: PartyId;
  /** The fields to update */
  updates: {
    /** The display name of the party */
    name?: string;
    /** The phone number of the party (USA format) */
    phone?: string;
    /** The role assigned to the party */
    role?: PartyRole;
    /** Optional metadata associated with the party */
    metadata?: PartyMetadata;
    /** Notification preferences for the party */
    notificationPreferences?: {
      /** Whether to send email notifications */
      email: boolean;
      /** Whether to send SMS notifications */
      sms: boolean;
    };
  };
}

/**
 * Result of updating a global party
 * @interface UpdateGlobalPartyResult
 * @description Contains the updated party data
 */
export interface UpdateGlobalPartyResult {
  /** The complete updated party data */
  party: GlobalParty;
}

/**
 * Input parameters for deleting a global party
 * @interface DeleteGlobalPartyInput
 * @description Data required to delete a global party
 */
export interface DeleteGlobalPartyInput {
  /** The tenant ID that owns the party */
  tenantId: TenantId;
  /** The unique identifier of the party to delete */
  partyId: PartyId;
}

/**
 * Input parameters for creating a delegation
 * @interface CreateDelegationInput
 * @description Data required to create a delegation for a global party
 */
export interface CreateDelegationInput {
  /** The tenant ID that owns the delegation */
  tenantId: TenantId;
  /** The ID of the original party being delegated */
  originalPartyId: PartyId;
  /** The email address of the delegate */
  delegateEmail: string;
  /** The display name of the delegate */
  delegateName: string;
  /** The reason for the delegation */
  reason: string;
  /** The type of delegation */
  type: DelegationType;
  /** Optional expiration date for the delegation */
  expiresAt?: string;
  /** Optional metadata associated with the delegation */
  metadata?: PartyMetadata;
}

/**
 * Result of creating a delegation
 * @interface CreateDelegationResult
 * @description Contains the created delegation ID, delegation data, and delegate party
 */
export interface CreateDelegationResult {
  /** The unique identifier of the created delegation */
  delegationId: string;
  /** The complete delegation data */
  delegation: DelegationRecord;
  /** The delegate party data */
  delegateParty: GlobalParty;
}

/**
 * Input parameters for updating a delegation
 * @interface UpdateDelegationInput
 * @description Data required to update an existing delegation
 */
export interface UpdateDelegationInput {
  /** The tenant ID that owns the delegation */
  tenantId: TenantId;
  /** The unique identifier of the delegation to update */
  delegationId: string;
  /** The fields to update */
  updates: {
    /** The reason for the delegation */
    reason?: string;
    /** The expiration date for the delegation */
    expiresAt?: string;
    /** Optional metadata associated with the delegation */
    metadata?: PartyMetadata;
  };
}

/**
 * Result of updating a delegation
 * @interface UpdateDelegationResult
 * @description Contains the updated delegation data
 */
export interface UpdateDelegationResult {
  /** The complete updated delegation data */
  delegation: DelegationRecord;
}

/**
 * Input parameters for deleting a delegation
 * @interface DeleteDelegationInput
 * @description Data required to delete a delegation
 */
export interface DeleteDelegationInput {
  /** The tenant ID that owns the delegation */
  tenantId: TenantId;
  /** The unique identifier of the delegation to delete */
  delegationId: string;
}

/**
 * Commands port for global party operations
 * @interface GlobalPartiesCommandsPort
 * @description Provides write operations for global parties (address book)
 * This port handles all command operations including create, update, delete,
 * and delegation management for global parties.
 */
export interface GlobalPartiesCommandsPort {
  /**
   * Create a new global party
   * @param input - The input data for creating a global party
   * @returns Promise resolving to the creation result containing party ID and data
   */
  create(input: CreateGlobalPartyInput): Promise<CreateGlobalPartyResult>;

  /**
   * Update an existing global party
   * @param input - The input data for updating a global party
   * @returns Promise resolving to the update result containing updated party data
   */
  update(input: UpdateGlobalPartyInput): Promise<UpdateGlobalPartyResult>;

  /**
   * Delete a global party
   * @param input - The input data for deleting a global party
   * @returns Promise resolving when the party is successfully deleted
   */
  delete(input: DeleteGlobalPartyInput): Promise<void>;

  /**
   * Create a delegation for a global party
   * @param input - The input data for creating a delegation
   * @returns Promise resolving to the delegation creation result
   */
  createDelegation(input: CreateDelegationInput): Promise<CreateDelegationResult>;

  /**
   * Update a delegation
   * @param input - The input data for updating a delegation
   * @returns Promise resolving to the delegation update result
   */
  updateDelegation(input: UpdateDelegationInput): Promise<UpdateDelegationResult>;

  /**
   * Delete a delegation
   * @param input - The input data for deleting a delegation
   * @returns Promise resolving when the delegation is successfully deleted
   */
  deleteDelegation(input: DeleteDelegationInput): Promise<void>;
}
