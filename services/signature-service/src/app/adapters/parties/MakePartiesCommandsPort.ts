/**
 * @file MakePartiesCommandsPort.ts
 * @summary Adapter factory for Parties Commands Port
 * @description Creates PartiesCommandsPort implementation using DynamoDB repository.
 * Handles create, update, delete, and delegate operations for envelope-scoped Parties.
 */

import type { PartiesCommandsPort } from "@/app/ports/parties";
import type { PartyRepository } from "@/infra/repos/PartyRepository";
import type { EventBus } from "@/infra/events/EventBus";
import type { 
  CreatePartyCommand, 
  CreatePartyResult,
  UpdatePartyCommand,
  UpdatePartyResult,
  DeletePartyCommand,
  DeletePartyResult,
  DelegatePartyCommand,
  DelegatePartyResult
} from "@/app/ports/parties";
import { Party } from "@/domain/entities/Party";
import { PartyStatus, PartyRole } from "@/domain/values/enums";
import { DEFAULT_PARTY_AUTH } from "@/domain/value-objects/party/PartyAuth";
import { generateId } from "@/domain/value-objects/Ids";

/**
 * @description Dependencies for the Parties Commands adapter.
 */
export interface MakePartiesCommandsPortDeps {
  parties: PartyRepository;
  events: EventBus;
}

/**
 * @description Creates PartiesCommandsPort implementation.
 * 
 * @param deps - Dependencies for the adapter
 * @returns PartiesCommandsPort implementation
 */
export const makePartiesCommandsPort = (
  deps: MakePartiesCommandsPortDeps
): PartiesCommandsPort => {
  return {
    async create(command: CreatePartyCommand): Promise<CreatePartyResult> {
      const now = new Date().toISOString();
      const partyId = generateId();

      const party: Party = {
        id: partyId,
        tenantId: command.tenantId,
        envelopeId: command.envelopeId,
        name: command.name,
        email: command.email,
        role: command.role,
        status: "pending" as PartyStatus,
        sequence: command.sequence || 1,
        phone: command.phone,
        locale: command.locale,
        auth: command.auth || DEFAULT_PARTY_AUTH,
        globalPartyId: command.globalPartyId,
        createdAt: now,
        updatedAt: now,
      };

      await deps.parties.create(party);

      // TODO: Emit domain events when event bus is available
      // await deps.events.emit("PartyCreated", {
      //   partyId: party.id,
      //   envelopeId: party.envelopeId,
      //   tenantId: party.tenantId,
      //   actor: command.actor,
      // });

      return { party };
    },

    async update(command: UpdatePartyCommand): Promise<UpdatePartyResult> {
      const existing = await deps.parties.getById(command.partyId, command.envelopeId);
      if (!existing) {
        throw new Error(`Party with ID ${command.partyId} not found in envelope ${command.envelopeId}`);
      }

      const now = new Date().toISOString();
      const updatedParty: Party = {
        ...existing,
        ...command.updates,
        updatedAt: now,
      };

      await deps.parties.updateParty(updatedParty);

      // TODO: Emit domain events when event bus is available
      // await deps.events.emit("PartyUpdated", {
      //   partyId: updatedParty.id,
      //   envelopeId: updatedParty.envelopeId,
      //   tenantId: updatedParty.tenantId,
      //   actor: command.actor,
      // });

      return { party: updatedParty };
    },

    async delete(command: DeletePartyCommand): Promise<DeletePartyResult> {
      const existing = await deps.parties.getById(command.partyId, command.envelopeId);
      if (!existing) {
        throw new Error(`Party with ID ${command.partyId} not found in envelope ${command.envelopeId}`);
      }

      await deps.parties.deleteParty(command.partyId, command.envelopeId);

      // TODO: Emit domain events when event bus is available
      // await deps.events.emit("PartyDeleted", {
      //   partyId: command.partyId,
      //   envelopeId: command.envelopeId,
      //   tenantId: command.tenantId,
      //   actor: command.actor,
      // });

      return { deleted: true };
    },

    async delegate(command: DelegatePartyCommand): Promise<DelegatePartyResult> {
      const existing = await deps.parties.getById(command.partyId, command.envelopeId);
      if (!existing) {
        throw new Error(`Party with ID ${command.partyId} not found in envelope ${command.envelopeId}`);
      }

      const now = new Date().toISOString();
      const delegatedParty: Party = {
        ...existing,
        globalPartyId: command.delegateTo.globalPartyId,
        email: command.delegateTo.email || existing.email,
        name: command.delegateTo.name || existing.name,
        updatedAt: now,
      };

      await deps.parties.updateParty(delegatedParty);

      // TODO: Emit domain events when event bus is available
      // await deps.events.emit("PartyDelegated", {
      //   partyId: delegatedParty.id,
      //   envelopeId: delegatedParty.envelopeId,
      //   tenantId: delegatedParty.tenantId,
      //   delegateTo: command.delegateTo,
      //   actor: command.actor,
      // });

      return { party: delegatedParty };
    },
  };
};
