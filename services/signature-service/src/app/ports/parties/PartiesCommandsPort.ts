/**
 * @file PartiesCommandsPort.ts
 * @summary Commands port for envelope-scoped parties
 * @description Commands port for managing Party operations within envelopes (create, update, delete, delegate).
 * Defines the contract for Party command operations.
 */

import type { TenantId, EnvelopeId, ActorContext } from "../shared";
import type { Party } from "@/domain/entities/Party";
import type { PartyRole, PartyStatus, AuthMethod } from "@/domain/values/enums";

/**
 * @description Input for creating a new Party in an envelope.
 */
export interface CreatePartyCommand {
  tenantId: TenantId;
  envelopeId: EnvelopeId;
  name: string;
  email: string;
  role: PartyRole;
  sequence?: number;
  phone?: string;
  locale?: string;
  auth?: {
    methods: AuthMethod[];
  };
  globalPartyId?: string;
  actor: ActorContext;
}

/**
 * @description Result of creating a Party.
 */
export interface CreatePartyResult {
  party: Party;
}

/**
 * @description Input for updating a Party.
 */
export interface UpdatePartyCommand {
  tenantId: TenantId;
  envelopeId: EnvelopeId;
  partyId: string;
  updates: {
    name?: string;
    email?: string;
    role?: PartyRole;
    sequence?: number;
    phone?: string;
    locale?: string;
    auth?: {
      methods: AuthMethod[];
    };
  };
  actor: ActorContext;
}

/**
 * @description Result of updating a Party.
 */
export interface UpdatePartyResult {
  party: Party;
}

/**
 * @description Input for deleting a Party.
 */
export interface DeletePartyCommand {
  tenantId: TenantId;
  envelopeId: EnvelopeId;
  partyId: string;
  actor: ActorContext;
}

/**
 * @description Result of deleting a Party.
 */
export interface DeletePartyResult {
  deleted: boolean;
}

/**
 * @description Input for delegating a Party.
 */
export interface DelegatePartyCommand {
  tenantId: TenantId;
  envelopeId: EnvelopeId;
  partyId: string;
  delegateTo: {
    globalPartyId?: string;
    email?: string;
    name?: string;
  };
  actor: ActorContext;
}

/**
 * @description Result of delegating a Party.
 */
export interface DelegatePartyResult {
  party: Party;
}

/**
 * @description Commands port for Party operations.
 */
export interface PartiesCommandsPort {
  /**
   * Creates a new Party in an envelope.
   */
  create(command: CreatePartyCommand): Promise<CreatePartyResult>;

  /**
   * Updates an existing Party.
   */
  update(command: UpdatePartyCommand): Promise<UpdatePartyResult>;

  /**
   * Deletes a Party from an envelope.
   */
  delete(command: DeletePartyCommand): Promise<DeletePartyResult>;

  /**
   * Delegates a Party to another person.
   */
  delegate(command: DelegatePartyCommand): Promise<DelegatePartyResult>;
}
