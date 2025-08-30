/**
 * @file MakeGlobalPartiesCommandsPort.ts
 * @summary Adapter factory for Global Parties Commands Port
 * @description Creates GlobalPartiesCommandsPort implementation using DynamoDB repository.
 * Handles create, update, and delete operations for Global Parties (contacts).
 */

import type { GlobalPartiesCommandsPort } from "@/app/ports/global-parties";
import type { GlobalPartyRepository } from "@/infra/repos/GlobalPartyRepository";
import type { EventBus } from "@/infra/events/EventBus";
import type { 
  CreateGlobalPartyCommand, 
  CreateGlobalPartyResult,
  UpdateGlobalPartyCommand,
  UpdateGlobalPartyResult,
  DeleteGlobalPartyCommand,
  DeleteGlobalPartyResult
} from "@/app/ports/global-parties";
import { GlobalParty } from "@/domain/entities/GlobalParty";
import { GlobalPartyStatus, PartyRole, PartySource } from "@/domain/values/enums";
import { createGlobalPartyStats } from "@/domain/value-objects/global-party/GlobalPartyStats";
import { createGlobalPartyTags } from "@/domain/value-objects/global-party/GlobalPartyTags";
import { generateId } from "@/domain/value-objects/Ids";

/**
 * @description Dependencies for the Global Parties Commands adapter.
 */
export interface MakeGlobalPartiesCommandsPortDeps {
  globalParties: GlobalPartyRepository;
  events: EventBus;
}

/**
 * @description Creates GlobalPartiesCommandsPort implementation.
 * 
 * @param deps - Dependencies for the adapter
 * @returns GlobalPartiesCommandsPort implementation
 */
export const makeGlobalPartiesCommandsPort = (
  deps: MakeGlobalPartiesCommandsPortDeps
): GlobalPartiesCommandsPort => {
  return {
    async create(command: CreateGlobalPartyCommand): Promise<CreateGlobalPartyResult> {
      const now = new Date().toISOString();
      const globalPartyId = generateId();

      const globalParty: GlobalParty = {
        id: globalPartyId,
        tenantId: command.tenantId,
        name: command.name,
        email: command.email,
        emails: command.emails,
        phone: command.phone,
        locale: command.locale,
        role: command.role,
        source: command.source,
        status: "active" as GlobalPartyStatus,
        tags: command.tags ? createGlobalPartyTags(command.tags) : undefined,
        attributes: command.attributes,
        preferences: {
          defaultAuth: command.preferences?.defaultAuth || "otpViaEmail",
          defaultLocale: command.preferences?.defaultLocale || command.locale,
        },
        notificationPreferences: command.notificationPreferences,
        stats: createGlobalPartyStats({}),
        createdAt: now,
        updatedAt: now,
      };

      await deps.globalParties.create(globalParty);

      // TODO: Emit domain events when event bus is available
      // await deps.events.emit("GlobalPartyCreated", {
      //   globalPartyId: globalParty.id,
      //   tenantId: globalParty.tenantId,
      //   actor: command.actor,
      // });

      return { globalParty };
    },

    async update(command: UpdateGlobalPartyCommand): Promise<UpdateGlobalPartyResult> {
      const existing = await deps.globalParties.getById(command.globalPartyId);
      if (!existing) {
        throw new Error(`Global Party with ID ${command.globalPartyId} not found`);
      }

      const now = new Date().toISOString();
      const updatedGlobalParty: GlobalParty = {
        ...existing,
        ...command.updates,
        tags: command.updates.tags ? createGlobalPartyTags(command.updates.tags) : existing.tags,
        updatedAt: now,
      };

      await deps.globalParties.update(updatedGlobalParty);

      // TODO: Emit domain events when event bus is available
      // await deps.events.emit("GlobalPartyUpdated", {
      //   globalPartyId: updatedGlobalParty.id,
      //   tenantId: updatedGlobalParty.tenantId,
      //   actor: command.actor,
      // });

      return { globalParty: updatedGlobalParty };
    },

    async delete(command: DeleteGlobalPartyCommand): Promise<DeleteGlobalPartyResult> {
      const existing = await deps.globalParties.getById(command.globalPartyId);
      if (!existing) {
        throw new Error(`Global Party with ID ${command.globalPartyId} not found`);
      }

      // Soft delete by updating status
      const now = new Date().toISOString();
      const deletedGlobalParty: GlobalParty = {
        ...existing,
        status: "deleted" as GlobalPartyStatus,
        updatedAt: now,
      };

      await deps.globalParties.update(deletedGlobalParty);

      // TODO: Emit domain events when event bus is available
      // await deps.events.emit("GlobalPartyDeleted", {
      //   globalPartyId: deletedGlobalParty.id,
      //   tenantId: deletedGlobalParty.tenantId,
      //   actor: command.actor,
      // });

      return { deleted: true };
    },
  };
};
