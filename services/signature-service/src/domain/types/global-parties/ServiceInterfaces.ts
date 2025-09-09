/**
 * @file ServiceInterfaces.ts
 * @summary Service interfaces for Global Parties module
 * @description Defines all service interfaces used by Global Parties services
 */

import type { ActorContext } from "@lawprotect/shared-ts";
import type { TenantId, PartyId } from "@/domain/value-objects/ids";
import type { 
  CreateGlobalPartyControllerInput,
  UpdateGlobalPartyControllerInput,
  DeleteGlobalPartyControllerInput,
  ListGlobalPartiesControllerInput,
  SearchGlobalPartiesByEmailControllerInput
} from "./ControllerInputs";
import type { 
  ListGlobalPartiesAppInput,
  ListGlobalPartiesAppResult,
  GetGlobalPartyAppInput,
  GetGlobalPartyAppResult,
  SearchGlobalPartiesByEmailAppInput,
  SearchGlobalPartiesByEmailAppResult
} from "./AppServiceInputs";
import type { 
  CreateGlobalPartyCommand,
  UpdateGlobalPartyCommand,
  DeleteGlobalPartyCommand,
  CreateGlobalPartyResult,
  UpdateGlobalPartyResult,
  DeleteGlobalPartyResult
} from "../../../app/ports/global-parties/GlobalPartiesCommandsPort";

/**
 * @description Validation service for Global Parties operations
 */
export interface GlobalPartiesValidationService {
  /**
   * Validates create Global Party input
   */
  validateCreate(input: CreateGlobalPartyControllerInput): void;

  /**
   * Validates update Global Party input
   */
  validateUpdate(input: UpdateGlobalPartyControllerInput): void;

  /**
   * Validates delete Global Party input
   */
  validateDelete(input: DeleteGlobalPartyControllerInput): void;

  /**
   * Validates list Global Parties input
   */
  validateList(input: ListGlobalPartiesControllerInput): void;

  /**
   * Validates search Global Parties by email input
   */
  validateSearchByEmail(input: SearchGlobalPartiesByEmailControllerInput): void;
}

/**
 * @description Audit service for Global Parties operations
 */
export interface GlobalPartiesAuditService {
  /**
   * Logs Global Party creation
   */
  logCreate(partyId: PartyId, tenantId: TenantId, actor: ActorContext): Promise<void>;

  /**
   * Logs Global Party update
   */
  logUpdate(partyId: PartyId, tenantId: TenantId, actor: ActorContext): Promise<void>;

  /**
   * Logs Global Party deletion
   */
  logDelete(partyId: PartyId, tenantId: TenantId, actor: ActorContext): Promise<void>;

  /**
   * Logs Global Party access
   */
  logAccess(partyId: PartyId, tenantId: TenantId, actor: ActorContext): Promise<void>;
}

/**
 * @description Event service for Global Parties operations
 */
export interface GlobalPartiesEventService {
  /**
   * Publishes Global Party created event
   */
  publishCreated(partyId: PartyId, tenantId: TenantId, actor: ActorContext): Promise<void>;

  /**
   * Publishes Global Party updated event
   */
  publishUpdated(partyId: PartyId, tenantId: TenantId, actor: ActorContext): Promise<void>;

  /**
   * Publishes Global Party deleted event
   */
  publishDeleted(partyId: PartyId, tenantId: TenantId, actor: ActorContext): Promise<void>;
}

/**
 * @description Command service for Global Parties operations
 */
export interface GlobalPartiesCommandService {
  /**
   * Creates a new Global Party
   */
  create(command: CreateGlobalPartyCommand): Promise<CreateGlobalPartyResult>;

  /**
   * Updates an existing Global Party
   */
  update(command: UpdateGlobalPartyCommand): Promise<UpdateGlobalPartyResult>;

  /**
   * Deletes a Global Party
   */
  delete(command: DeleteGlobalPartyCommand): Promise<DeleteGlobalPartyResult>;
}

/**
 * @description Query service for Global Parties operations
 */
export interface GlobalPartiesQueryService {
  /**
   * Lists Global Parties with optional filters
   */
  list(input: ListGlobalPartiesAppInput): Promise<ListGlobalPartiesAppResult>;

  /**
   * Gets a Global Party by ID
   */
  getById(input: GetGlobalPartyAppInput): Promise<GetGlobalPartyAppResult>;

  /**
   * Searches Global Parties by email
   */
  searchByEmail(input: SearchGlobalPartiesByEmailAppInput): Promise<SearchGlobalPartiesByEmailAppResult>;
}






