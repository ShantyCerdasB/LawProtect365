/**
 * @file GlobalPartiesCommandsPort.ts
 * @summary Commands port for Global Parties (contacts)
 * @description Commands port for managing Global Party operations (create, update, delete).
 * Defines the contract for Global Party command operations.
 */

import type { TenantId, ActorContext } from "../shared";
import type { GlobalParty } from "@/domain/entities/GlobalParty";
import type { GlobalPartyStatus, PartyRole, PartySource } from "@/domain/values/enums";

/**
 * @description Input for creating a new Global Party (contact).
 */
export interface CreateGlobalPartyCommand {
  tenantId: TenantId;
  name: string;
  email: string;
  emails?: string[];
  phone?: string;
  locale?: string;
  role: PartyRole;
  source: PartySource;
  tags?: string[];
  attributes?: Record<string, unknown>;
  preferences?: {
    defaultAuth?: string;
    defaultLocale?: string;
  };
  notificationPreferences?: {
    email: boolean;
    sms: boolean;
  };
  actor: ActorContext;
}

/**
 * @description Result of creating a Global Party.
 */
export interface CreateGlobalPartyResult {
  globalParty: GlobalParty;
}

/**
 * @description Input for updating a Global Party.
 */
export interface UpdateGlobalPartyCommand {
  tenantId: TenantId;
  globalPartyId: string;
  updates: {
    name?: string;
    email?: string;
    emails?: string[];
    phone?: string;
    locale?: string;
    role?: PartyRole;
    status?: GlobalPartyStatus;
    tags?: string[];
    attributes?: Record<string, unknown>;
    preferences?: {
      defaultAuth?: string;
      defaultLocale?: string;
    };
    notificationPreferences?: {
      email?: boolean;
      sms?: boolean;
    };
  };
  actor: ActorContext;
}

/**
 * @description Result of updating a Global Party.
 */
export interface UpdateGlobalPartyResult {
  globalParty: GlobalParty;
}

/**
 * @description Input for deleting a Global Party.
 */
export interface DeleteGlobalPartyCommand {
  tenantId: TenantId;
  globalPartyId: string;
  actor: ActorContext;
}

/**
 * @description Result of deleting a Global Party.
 */
export interface DeleteGlobalPartyResult {
  deleted: boolean;
}

/**
 * @description Commands port for Global Party operations.
 */
export interface GlobalPartiesCommandsPort {
  /**
   * Creates a new Global Party (contact).
   */
  create(command: CreateGlobalPartyCommand): Promise<CreateGlobalPartyResult>;

  /**
   * Updates an existing Global Party.
   */
  update(command: UpdateGlobalPartyCommand): Promise<UpdateGlobalPartyResult>;

  /**
   * Deletes a Global Party (soft delete).
   */
  delete(command: DeleteGlobalPartyCommand): Promise<DeleteGlobalPartyResult>;
}
